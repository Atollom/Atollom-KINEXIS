"""
MercadoLibre OAuth Router — Authorization Code flow for multi-tenant connections.

Flow:
  1. Frontend calls GET /connect  → returns ML authorization URL
  2. Frontend redirects to that URL
  3. User logs in on MercadoLibre and authorizes KINEXIS
  4. ML redirects to GET /callback?code=...&state=...
  5. Backend exchanges code → access/refresh token, stores in ml_credentials
  6. Backend redirects browser back to frontend

Required env vars:
  ML_CLIENT_ID       — App ID from developers.mercadolibre.com
  ML_CLIENT_SECRET   — App Secret
  ML_REDIRECT_URI    — Must match exactly what's registered in ML app
                       (e.g. https://kinexis-backend.onrender.com/api/integrations/ml/callback)
  DASHBOARD_URL      — Frontend URL for post-auth redirect
  ENCRYPTION_KEY     — Used to sign CSRF state tokens
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

router = APIRouter(prefix="/api/integrations/ml", tags=["ml-oauth"])

ML_AUTH_URL   = "https://auth.mercadolibre.com.mx/authorization"
ML_TOKEN_URL  = "https://api.mercadolibre.com/oauth/token"


# ── helpers ────────────────────────────────────────────────────────────────────

def _state_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY") or os.getenv("ML_STATE_SECRET", "kinexis-ml-state")
    return key.encode()


def _build_state(tenant_id: str, user_id: str) -> str:
    payload = json.dumps({"tid": tenant_id, "uid": user_id, "ts": int(time.time())})
    sig = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    return f"{encoded}.{sig}"


def _verify_state(state: str) -> Optional[dict]:
    try:
        encoded, sig = state.rsplit(".", 1)
        padding = "=" * (-len(encoded) % 4)
        payload = base64.urlsafe_b64decode(encoded + padding).decode()
        expected = hmac.new(_state_key(), payload.encode(), hashlib.sha256).hexdigest()[:24]
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(payload)
        if int(time.time()) - data.get("ts", 0) > 900:
            return None
        return data
    except Exception as exc:
        logger.warning("[ML-OAUTH] State verification error: %s", exc)
        return None


def _dashboard_url() -> str:
    return os.getenv("DASHBOARD_URL", "https://kinexis.atollom.com").rstrip("/")


def _redirect_uri() -> str:
    backend = (
        os.getenv("RENDER_EXTERNAL_URL")
        or os.getenv("BACKEND_URL", "http://localhost:8000")
    ).rstrip("/")
    return f"{backend}/api/integrations/ml/callback"


# ── endpoints ──────────────────────────────────────────────────────────────────

@router.get("/connect")
async def connect_ml(current_user: dict = Depends(get_current_user)) -> dict:
    """Returns ML authorization URL. Frontend redirects user to this URL."""
    client_id = os.getenv("ML_CLIENT_ID") or os.getenv("ML_APP_ID")
    if not client_id:
        raise HTTPException(
            status_code=503,
            detail="ML_CLIENT_ID no configurado — agrega la variable en Render",
        )

    state = _build_state(
        tenant_id=str(current_user["tenant_id"]),
        user_id=str(current_user["id"]),
    )
    redirect_uri = _redirect_uri()

    auth_url = (
        f"{ML_AUTH_URL}"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&state={state}"
    )
    logger.info("[ML-OAUTH] Connect initiated for tenant=%s", current_user["tenant_id"])
    return {"auth_url": auth_url, "redirect_uri": redirect_uri}


@router.get("/callback")
async def ml_callback(
    code:  str = Query(...),
    state: str = Query(...),
) -> RedirectResponse:
    """ML redirects here after user authorizes. Exchanges code for tokens."""
    dash = _dashboard_url()
    err_redirect     = f"{dash}/onboarding?ml=error"
    success_redirect = f"{dash}/onboarding?ml=connected"

    state_data = _verify_state(state)
    if not state_data:
        logger.warning("[ML-OAUTH] Invalid or expired state")
        return RedirectResponse(url=f"{dash}/onboarding?ml=invalid_state")

    tenant_id = state_data.get("tid")
    if not tenant_id:
        return RedirectResponse(url=err_redirect)

    client_id     = os.getenv("ML_CLIENT_ID") or os.getenv("ML_APP_ID", "")
    client_secret = os.getenv("ML_CLIENT_SECRET", "")
    redirect_uri  = _redirect_uri()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                ML_TOKEN_URL,
                json={
                    "grant_type":    "authorization_code",
                    "client_id":     client_id,
                    "client_secret": client_secret,
                    "code":          code,
                    "redirect_uri":  redirect_uri,
                },
            )
        if resp.status_code != 200:
            logger.error("[ML-OAUTH] Token exchange failed %s: %s", resp.status_code, resp.text[:400])
            return RedirectResponse(url=err_redirect)

        tokens = resp.json()
        access_token  = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        ml_user_id    = str(tokens.get("user_id", ""))
        expires_in    = tokens.get("expires_in", 21600)

        if not access_token:
            logger.error("[ML-OAUTH] No access_token in response: %s", tokens)
            return RedirectResponse(url=err_redirect)

    except Exception as exc:
        logger.error("[ML-OAUTH] Token exchange exception: %s", exc)
        return RedirectResponse(url=err_redirect)

    # Fetch ML user info (nickname)
    ml_nickname = None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.mercadolibre.com/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code == 200:
                user_info = resp.json()
                ml_nickname = user_info.get("nickname")
    except Exception:
        pass

    # Persist credentials
    try:
        await db.execute(
            """
            INSERT INTO ml_credentials
                (tenant_id, ml_user_id, ml_nickname, access_token, refresh_token,
                 expires_in, connected_at, updated_at)
            VALUES ($1::uuid, $2, $3, $4, $5, $6, NOW(), NOW())
            ON CONFLICT (tenant_id) DO UPDATE SET
                ml_user_id    = EXCLUDED.ml_user_id,
                ml_nickname   = EXCLUDED.ml_nickname,
                access_token  = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                expires_in    = EXCLUDED.expires_in,
                updated_at    = NOW()
            """,
            tenant_id, ml_user_id, ml_nickname, access_token, refresh_token, expires_in,
        )
        logger.info("[ML-OAUTH] Credentials stored tenant=%s user=%s nick=%s",
                    tenant_id, ml_user_id, ml_nickname)
    except Exception as exc:
        logger.error("[ML-OAUTH] DB upsert failed: %s", exc)
        return RedirectResponse(url=err_redirect)

    return RedirectResponse(url=f"{success_redirect}&nickname={ml_nickname or ml_user_id}")


@router.get("/status")
async def ml_status(current_user: dict = Depends(get_current_user)) -> dict:
    """Returns ML connection status for the authenticated tenant."""
    tenant_id = str(current_user["tenant_id"])
    try:
        row = await db.fetch_one(
            "SELECT ml_user_id, ml_nickname, connected_at FROM ml_credentials WHERE tenant_id=$1::uuid",
            tenant_id,
        )
    except Exception:
        return {"connected": False, "note": "Table pending migration"}

    if not row:
        return {"connected": False}
    return {
        "connected":    True,
        "ml_user_id":   row["ml_user_id"],
        "ml_nickname":  row["ml_nickname"],
        "connected_at": row["connected_at"].isoformat() if row.get("connected_at") else None,
    }


@router.delete("/disconnect")
async def ml_disconnect(current_user: dict = Depends(get_current_user)) -> dict:
    tenant_id = str(current_user["tenant_id"])
    await db.execute(
        "DELETE FROM ml_credentials WHERE tenant_id=$1::uuid", tenant_id
    )
    return {"success": True}
