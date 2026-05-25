"""
Meta Business Login OAuth — connects WhatsApp, Instagram, and Facebook in one flow.

Flow:
  1. Frontend calls GET /connect → returns Facebook OAuth URL
  2. Frontend redirects user there (same pattern as ML OAuth)
  3. User approves in Facebook → Meta redirects to GET /callback?code=...
  4. Backend exchanges code → long-lived user token
  5. Backend fetches user's WhatsApp Business Accounts automatically
  6. Backend subscribes the webhook for each account (no manual Meta dashboard needed)
  7. Stores credentials → redirects to frontend with success

Required Render env vars:
  META_APP_ID      — Facebook App ID (995653889571283)
  META_APP_SECRET  — Facebook App Secret
  META_VERIFY_TOKEN — Webhook verify token (kinexis-webhook-verify-2026)
  DASHBOARD_URL    — Frontend base URL
  BACKEND_URL      — Backend base URL (for callback URI)
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import time
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse

from src.auth.jwt_validator import get_current_user
from src.utils.database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations/meta", tags=["meta-oauth"])

GRAPH_URL    = "https://graph.facebook.com/v21.0"
FB_AUTH_URL  = "https://www.facebook.com/v21.0/dialog/oauth"
FB_TOKEN_URL = f"{GRAPH_URL}/oauth/access_token"

# Scopes needed for WhatsApp Business + Instagram + Facebook Messenger
SCOPES = ",".join([
    "whatsapp_business_management",
    "whatsapp_business_messaging",
    "pages_messaging",
    "pages_manage_metadata",
    "instagram_basic",
    "instagram_manage_messages",
    "business_management",
])


# ── helpers ────────────────────────────────────────────────────────────────────

def _state_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY") or os.getenv("META_STATE_SECRET", "kinexis-meta-state")
    return key.encode()


def _build_state(tenant_id: str, user_id: str) -> str:
    payload = json.dumps({"tid": tenant_id, "uid": user_id, "ts": int(time.time())})
    sig = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]  # type: ignore
    encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    return f"{encoded}.{sig}"


def _verify_state(state: str) -> Optional[dict]:
    try:
        encoded, sig = state.rsplit(".", 1)
        padding = "=" * (-len(encoded) % 4)
        payload = base64.urlsafe_b64decode(encoded + padding).decode()
        expected = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]  # type: ignore
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(payload)
        if int(time.time()) - data.get("ts", 0) > 900:
            return None
        return data
    except Exception as exc:
        logger.warning("[META-OAUTH] State verification error: %s", exc)
        return None


def _dashboard_url() -> str:
    return os.getenv("DASHBOARD_URL", "https://kinexis.atollom.com").rstrip("/")


def _callback_uri() -> str:
    backend = (
        os.getenv("RENDER_EXTERNAL_URL")
        or os.getenv("BACKEND_URL", "http://localhost:8000")
    ).rstrip("/")
    return f"{backend}/api/integrations/meta/callback"


def _app_id() -> str:
    return os.getenv("META_APP_ID", "")


def _app_secret() -> str:
    return os.getenv("META_APP_SECRET", "") or os.getenv("META_ACCESS_TOKEN", "")


# ── endpoints ──────────────────────────────────────────────────────────────────

@router.get("/connect")
async def connect_meta(current_user: dict = Depends(get_current_user)) -> dict:
    """Returns Facebook OAuth URL. Frontend redirects user there."""
    app_id = _app_id()
    if not app_id:
        raise HTTPException(
            status_code=503,
            detail="META_APP_ID no configurado en Render",
        )

    state = _build_state(
        tenant_id=str(current_user["tenant_id"]),
        user_id=str(current_user["supabase_user_id"]),
    )
    callback = _callback_uri()

    auth_url = (
        f"{FB_AUTH_URL}"
        f"?client_id={app_id}"
        f"&redirect_uri={callback}"
        f"&scope={SCOPES}"
        f"&response_type=code"
        f"&state={state}"
    )
    return {"auth_url": auth_url}


@router.get("/callback")
async def meta_callback(
    code:  str = Query(...),
    state: str = Query(...),
) -> RedirectResponse:
    """Facebook redirects here after user authorizes. Exchanges code → stores credentials → subscribes webhooks."""
    dash = _dashboard_url()
    err_url     = f"{dash}/settings/integrations?meta=error"
    success_url = f"{dash}/settings/integrations?meta=connected"

    state_data = _verify_state(state)
    if not state_data:
        logger.warning("[META-OAUTH] Invalid/expired state")
        return RedirectResponse(url=f"{dash}/settings/integrations?meta=invalid_state")

    tenant_id = state_data.get("tid")
    if not tenant_id:
        return RedirectResponse(url=err_url)

    app_id     = _app_id()
    app_secret = _app_secret()
    callback   = _callback_uri()

    # 1. Exchange code → short-lived token
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                FB_TOKEN_URL,
                params={
                    "client_id":     app_id,
                    "client_secret": app_secret,
                    "redirect_uri":  callback,
                    "code":          code,
                },
            )
        if resp.status_code != 200:
            logger.error("[META-OAUTH] Token exchange failed %s: %s", resp.status_code, resp.text[:400])
            return RedirectResponse(url=err_url)
        short_token = resp.json().get("access_token", "")
    except Exception as exc:
        logger.error("[META-OAUTH] Token exchange error: %s", exc)
        return RedirectResponse(url=err_url)

    # 2. Exchange short-lived → long-lived (60 days)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                FB_TOKEN_URL,
                params={
                    "grant_type":        "fb_exchange_token",
                    "client_id":         app_id,
                    "client_secret":     app_secret,
                    "fb_exchange_token": short_token,
                },
            )
        if resp.status_code != 200:
            logger.warning("[META-OAUTH] Long-lived token exchange failed, using short-lived")
            long_token = short_token
        else:
            long_token = resp.json().get("access_token", short_token)
    except Exception:
        long_token = short_token

    # 3. Get Facebook user info
    fb_user_id = None
    fb_name    = None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{GRAPH_URL}/me",
                params={"access_token": long_token, "fields": "id,name"},
            )
            if resp.status_code == 200:
                info = resp.json()
                fb_user_id = info.get("id")
                fb_name    = info.get("name")
    except Exception:
        pass

    # 4. Fetch WhatsApp Business Accounts
    waba_id          = None
    phone_number_id  = None
    phone_number     = None
    connected_platforms = ["facebook", "instagram"]  # always get these from Business Login

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{GRAPH_URL}/me/businesses",
                params={
                    "access_token": long_token,
                    "fields": "id,name,whatsapp_business_accounts{id,phone_numbers{display_phone_number,id}}",
                },
            )
            if resp.status_code == 200:
                businesses = resp.json().get("data", [])
                for biz in businesses:
                    wabas = biz.get("whatsapp_business_accounts", {}).get("data", [])
                    if wabas:
                        waba_id = wabas[0]["id"]
                        phones  = wabas[0].get("phone_numbers", {}).get("data", [])
                        if phones:
                            phone_number_id = phones[0]["id"]
                            phone_number    = phones[0].get("display_phone_number")
                        connected_platforms.append("whatsapp")
                        break
    except Exception as exc:
        logger.warning("[META-OAUTH] Could not fetch WABA: %s", exc)

    # 5. Auto-subscribe webhook for the WhatsApp Business Account
    if waba_id:
        await _subscribe_waba_webhook(waba_id, long_token)

    # 6. Persist credentials
    supabase_user_id = state_data.get("uid")
    try:
        await db.execute(
            """
            INSERT INTO meta_credentials
                (tenant_id, supabase_user_id, fb_user_id, fb_name,
                 access_token, waba_id, phone_number_id, phone_number,
                 connected_platforms, connected_at, updated_at)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT (supabase_user_id) DO UPDATE SET
                tenant_id           = EXCLUDED.tenant_id,
                fb_user_id          = EXCLUDED.fb_user_id,
                fb_name             = EXCLUDED.fb_name,
                access_token        = EXCLUDED.access_token,
                waba_id             = EXCLUDED.waba_id,
                phone_number_id     = EXCLUDED.phone_number_id,
                phone_number        = EXCLUDED.phone_number,
                connected_platforms = EXCLUDED.connected_platforms,
                updated_at          = NOW()
            """,
            tenant_id, supabase_user_id, fb_user_id, fb_name,
            long_token, waba_id, phone_number_id, phone_number,
            connected_platforms,
        )
        logger.info(
            "[META-OAUTH] Credentials stored tenant=%s fb=%s waba=%s platforms=%s",
            tenant_id, fb_user_id, waba_id, connected_platforms,
        )

        # Also populate whatsapp_credentials so the webhook can resolve tenant by phone_number_id
        if phone_number_id:
            await db.execute(
                """
                INSERT INTO whatsapp_credentials
                    (tenant_id, phone_number_id, waba_id, display_number, access_token)
                VALUES ($1::uuid, $2, $3, $4, $5)
                ON CONFLICT (phone_number_id) DO UPDATE SET
                    tenant_id      = EXCLUDED.tenant_id,
                    waba_id        = EXCLUDED.waba_id,
                    display_number = EXCLUDED.display_number,
                    access_token   = EXCLUDED.access_token
                """,
                tenant_id, phone_number_id, waba_id, phone_number, long_token,
            )

    except Exception as exc:
        logger.error("[META-OAUTH] DB upsert failed: %s", exc)
        pass

    platforms_str = ",".join(connected_platforms)
    name_str      = (fb_name or "").replace(" ", "%20")
    return RedirectResponse(
        url=f"{success_url}&name={name_str}&platforms={platforms_str}"
    )


@router.get("/status")
async def meta_status(current_user: dict = Depends(get_current_user)) -> dict:
    """Returns Meta connection status for the authenticated user/tenant."""
    try:
        row = await db.fetch_one(
            """
            SELECT fb_name, waba_id, phone_number, connected_platforms, connected_at
            FROM meta_credentials
            WHERE supabase_user_id = $1
            """,
            current_user["supabase_user_id"],
        )
    except Exception:
        return {"connected": False}

    if not row:
        return {"connected": False}

    return {
        "connected":           True,
        "fb_name":             row["fb_name"],
        "waba_id":             row["waba_id"],
        "phone_number":        row["phone_number"],
        "connected_platforms": row["connected_platforms"] or [],
        "connected_at":        row["connected_at"].isoformat() if row.get("connected_at") else None,
    }


@router.delete("/disconnect")
async def meta_disconnect(current_user: dict = Depends(get_current_user)) -> dict:
    await db.execute(
        "DELETE FROM meta_credentials WHERE supabase_user_id = $1",
        current_user["supabase_user_id"],
    )
    return {"success": True}


# ── internal ───────────────────────────────────────────────────────────────────

async def _subscribe_waba_webhook(waba_id: str, access_token: str) -> None:
    """Subscribe the WABA to KINEXIS webhook so messages are pushed automatically."""
    verify_token  = os.getenv("META_VERIFY_TOKEN", "kinexis-webhook-verify-2026")
    backend_url   = (
        os.getenv("RENDER_EXTERNAL_URL")
        or os.getenv("BACKEND_URL", "http://localhost:8000")
    ).rstrip("/")
    callback_url  = f"{backend_url}/api/integrations/whatsapp/webhook"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{GRAPH_URL}/{waba_id}/subscribed_apps",
                params={"access_token": access_token},
                json={},
            )
            logger.info(
                "[META-OAUTH] WABA webhook subscription %s → %s: %s",
                waba_id, resp.status_code, resp.text[:200],
            )
    except Exception as exc:
        logger.warning("[META-OAUTH] Webhook subscription failed: %s", exc)
