"""
Amazon OAuth Router — LWA authorization flow for multi-tenant SP-API connections.

Flow:
  1. Frontend calls GET /connect  → returns Amazon LWA authorization URL
  2. Frontend redirects window.location.href to that URL
  3. Seller approves on Amazon Seller Central
  4. Amazon redirects browser to GET /callback?spapi_oauth_code=...&state=...
  5. Backend exchanges code → refresh_token, stores in amazon_credentials
  6. Backend redirects browser back to dashboard (/settings/sandbox?amazon=connected)

Required env vars:
  AMAZON_SP_APP_ID          — SP-API Application ID  (amzn1.sp.solution.xxx) — used in consent URL
  AMAZON_LWA_CLIENT_ID      — LWA Client ID          (amzn1.application-oa2-client.xxx) — used in token exchange
  AMAZON_LWA_CLIENT_SECRET  — LWA Client Secret
  BACKEND_URL               — full URL of this backend (e.g. https://kinexis.onrender.com)
  DASHBOARD_URL             — frontend URL (e.g. https://dashboard.atollom.com)
  ENCRYPTION_KEY            — used to sign CSRF state tokens
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

router = APIRouter(prefix="/api/integrations/amazon", tags=["amazon-oauth"])

LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token"

CONSENT_URLS = {
    "A1AM78C64UM0Y8": "https://sellercentral.amazon.com.mx/apps/authorize/consent",
    "ATVPDKIKX0DER":  "https://sellercentral.amazon.com/apps/authorize/consent",
}

# ── helpers ────────────────────────────────────────────────────────────────────

def _sp_app_id() -> str:
    """SP-API Application ID (amzn1.sp.solution.xxx) — goes in the Seller Central consent URL."""
    return os.getenv("AMAZON_SP_APP_ID", "")

def _lwa_client_id() -> str:
    """LWA OAuth2 client ID (amzn1.application-oa2-client.xxx) — used for token exchange."""
    return os.getenv("AMAZON_LWA_CLIENT_ID", "")

def _lwa_client_secret() -> str:
    return os.getenv("AMAZON_LWA_CLIENT_SECRET", "")

def _backend_url() -> str:
    """Public-facing backend URL — used to build the callback URI for Amazon."""
    return (
        os.getenv("RENDER_EXTERNAL_URL")
        or os.getenv("BACKEND_URL", "http://localhost:8000")
    ).rstrip("/")

def _dashboard_url() -> str:
    return os.getenv("DASHBOARD_URL", "https://dashboard.atollom.com").rstrip("/")

def _state_key() -> bytes:
    # Re-use the existing ENCRYPTION_KEY so no extra secret is needed
    key = os.getenv("ENCRYPTION_KEY") or os.getenv("AMAZON_STATE_SECRET", "kinexis-dev-state-key")
    return key.encode()


def _build_state(tenant_id: str, user_id: str, marketplace_id: str) -> str:
    """Returns a URL-safe, HMAC-signed state token embedding tenant/user info."""
    payload = json.dumps({
        "tid": tenant_id,
        "uid": user_id,
        "mid": marketplace_id,
        "ts":  int(time.time()),
    })
    sig = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    return f"{encoded}.{sig}"


def _verify_state(state: str) -> Optional[dict]:
    """Returns decoded payload dict if valid and fresh (< 15 min), else None."""
    try:
        encoded, sig = state.rsplit(".", 1)
        padding = "=" * (-len(encoded) % 4)
        payload = base64.urlsafe_b64decode(encoded + padding).decode()
        expected = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]
        if not hmac.compare_digest(sig, expected):
            logger.warning("[AMZ-OAUTH] State signature mismatch")
            return None
        data = json.loads(payload)
        if int(time.time()) - data.get("ts", 0) > 900:  # 15 min TTL
            logger.warning("[AMZ-OAUTH] State token expired")
            return None
        return data
    except Exception as exc:
        logger.warning("[AMZ-OAUTH] State verification error: %s", exc)
        return None


# ── endpoints ──────────────────────────────────────────────────────────────────

@router.get("/connect")
async def connect_amazon(
    marketplace_id: str = Query(default="A1AM78C64UM0Y8"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Returns the Amazon LWA authorization URL.
    Frontend opens this URL (window.location.href) to start the OAuth flow.
    """
    sp_app_id = _sp_app_id()
    if not sp_app_id:
        raise HTTPException(
            status_code=503,
            detail="AMAZON_SP_APP_ID not configured — add it in Render dashboard",
        )
    if not _lwa_client_id():
        raise HTTPException(
            status_code=503,
            detail="AMAZON_LWA_CLIENT_ID not configured — add it in Render dashboard",
        )

    tenant_id = str(current_user["tenant_id"])
    user_id   = str(current_user["id"])
    state     = _build_state(tenant_id, user_id, marketplace_id)

    consent_base = CONSENT_URLS.get(marketplace_id, CONSENT_URLS["A1AM78C64UM0Y8"])
    callback_uri = f"{_backend_url()}/api/integrations/amazon/callback"

    # application_id = SP-API App ID (amzn1.sp.solution.xxx)
    # NOT the LWA client_id — those are different identifiers
    auth_url = (
        f"{consent_base}"
        f"?application_id={sp_app_id}"
        f"&state={state}"
        f"&redirect_uri={callback_uri}"
        f"&version=beta"
    )

    logger.info("[AMZ-OAUTH] Connect initiated for tenant=%s marketplace=%s", tenant_id, marketplace_id)
    return {
        "auth_url":       auth_url,
        "callback_uri":   callback_uri,
        "marketplace_id": marketplace_id,
    }


@router.get("/callback")
async def amazon_callback(
    state:               str = Query(...),
    spapi_oauth_code:    str = Query(...),
    selling_partner_id:  str = Query(...),
) -> RedirectResponse:
    """
    Amazon redirects here after seller approves.
    Exchanges the authorization code for a refresh_token and persists it.
    """
    dash = _dashboard_url()
    err_redirect     = f"{dash}/settings/sandbox?amazon=error"
    success_redirect = f"{dash}/settings/sandbox?amazon=connected"

    state_data = _verify_state(state)
    if not state_data:
        logger.warning("[AMZ-OAUTH] Invalid or expired state — aborting callback")
        return RedirectResponse(url=f"{dash}/settings/sandbox?amazon=invalid_state")

    tenant_id      = state_data.get("tid")
    marketplace_id = state_data.get("mid", os.getenv("AMAZON_MARKETPLACE_ID", "A1AM78C64UM0Y8"))

    if not tenant_id:
        return RedirectResponse(url=err_redirect)

    # Exchange authorization code → tokens
    callback_uri = f"{_backend_url()}/api/integrations/amazon/callback"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                LWA_TOKEN_URL,
                data={
                    "grant_type":    "authorization_code",
                    "code":          spapi_oauth_code,
                    "redirect_uri":  callback_uri,
                    "client_id":     _lwa_client_id(),
                    "client_secret": _lwa_client_secret(),
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        if resp.status_code != 200:
            logger.error(
                "[AMZ-OAUTH] Token exchange failed %s: %s",
                resp.status_code, resp.text[:400],
            )
            return RedirectResponse(url=err_redirect)

        tokens        = resp.json()
        refresh_token = tokens.get("refresh_token")
        if not refresh_token:
            logger.error("[AMZ-OAUTH] No refresh_token in LWA response: %s", tokens)
            return RedirectResponse(url=err_redirect)

    except Exception as exc:
        logger.error("[AMZ-OAUTH] Token exchange exception: %s", exc)
        return RedirectResponse(url=err_redirect)

    # Persist (upsert) credentials in amazon_credentials table
    environment = os.getenv("ENVIRONMENT", "sandbox")
    try:
        await db.execute(
            """
            INSERT INTO amazon_credentials
                (tenant_id, seller_id, marketplace_id, refresh_token, environment, connected_at, updated_at)
            VALUES ($1::uuid, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (tenant_id) DO UPDATE SET
                seller_id      = EXCLUDED.seller_id,
                marketplace_id = EXCLUDED.marketplace_id,
                refresh_token  = EXCLUDED.refresh_token,
                environment    = EXCLUDED.environment,
                updated_at     = NOW()
            """,
            tenant_id,
            selling_partner_id,
            marketplace_id,
            refresh_token,
            environment,
        )
        logger.info(
            "[AMZ-OAUTH] Credentials stored tenant=%s seller=%s env=%s",
            tenant_id, selling_partner_id, environment,
        )
    except Exception as exc:
        logger.error("[AMZ-OAUTH] DB upsert failed: %s", exc)
        return RedirectResponse(url=err_redirect)

    return RedirectResponse(url=success_redirect)


@router.get("/status")
async def amazon_status(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Returns Amazon connection status for the authenticated tenant."""
    tenant_id = str(current_user["tenant_id"])
    try:
        row = await db.fetch_one(
            """
            SELECT seller_id, marketplace_id, environment, connected_at, updated_at
            FROM amazon_credentials
            WHERE tenant_id = $1::uuid
            """,
            tenant_id,
        )
    except Exception as exc:
        logger.error("[AMZ-OAUTH] Status query failed: %s", exc)
        # Migration may not be applied yet; return safe default
        return {"connected": False, "seller_id": None, "note": "Table pending migration"}

    if not row:
        return {"connected": False, "seller_id": None}

    return {
        "connected":      True,
        "seller_id":      row["seller_id"],
        "marketplace_id": row["marketplace_id"],
        "environment":    row["environment"],
        "connected_at":   row["connected_at"].isoformat() if row.get("connected_at") else None,
        "updated_at":     row["updated_at"].isoformat()   if row.get("updated_at")   else None,
    }


@router.delete("/disconnect")
async def amazon_disconnect(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Removes Amazon credentials for the authenticated tenant."""
    tenant_id = str(current_user["tenant_id"])
    try:
        await db.execute(
            "DELETE FROM amazon_credentials WHERE tenant_id = $1::uuid",
            tenant_id,
        )
        logger.info("[AMZ-OAUTH] Credentials removed for tenant=%s", tenant_id)
    except Exception as exc:
        logger.error("[AMZ-OAUTH] Disconnect failed: %s", exc)
        raise HTTPException(status_code=500, detail="No se pudo desconectar la cuenta Amazon")

    return {"success": True, "message": "Cuenta Amazon desconectada correctamente"}
