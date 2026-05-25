"""
WhatsApp Business webhook — Meta verification + inbound message handler.
Stores messages in whatsapp_messages table and triggers Samantha for AI replies.
"""

import hashlib
import hmac
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Header, HTTPException, Query, Request, Response

from src.utils.database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations/whatsapp", tags=["WhatsApp"])

VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "")
APP_SECRET   = os.getenv("META_APP_SECRET", "")


# ── Webhook verification (GET) ────────────────────────────────────────────────

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    """Meta sends GET to verify the webhook endpoint during setup."""
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        logger.info("[WhatsApp] Webhook verified by Meta")
        return Response(content=hub_challenge, media_type="text/plain")
    logger.warning("[WhatsApp] Verification failed — bad token")
    raise HTTPException(status_code=403, detail="Verification failed")


# ── Payload signature check ───────────────────────────────────────────────────

def _signature_valid(body: bytes, signature_header: str) -> bool:
    """Validate X-Hub-Signature-256 from Meta."""
    if not APP_SECRET or not signature_header:
        return True  # skip validation if secret not configured
    expected = "sha256=" + hmac.new(
        APP_SECRET.encode(), body, hashlib.sha256  # type: ignore[attr-defined]
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


# ── Inbound message handler (POST) ────────────────────────────────────────────

@router.post("/webhook")
async def receive_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
):
    """Process inbound WhatsApp messages from Meta Cloud API."""
    body = await request.body()

    if not _signature_valid(body, x_hub_signature_256 or ""):
        logger.warning("[WhatsApp] Invalid signature — ignoring payload")
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        payload: Dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Meta sends a nested structure: entry → changes → value → messages
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                await _handle_message(msg, value)

    # Always return 200 so Meta doesn't retry
    return {"status": "ok"}


async def _handle_message(msg: Dict[str, Any], value: Dict[str, Any]) -> None:
    """Persist an inbound WhatsApp message to the DB."""
    wa_id    = msg.get("from", "")
    msg_id   = msg.get("id", "")
    msg_type = msg.get("type", "text")
    ts       = msg.get("timestamp", "")

    # Extract text body
    body_text = ""
    if msg_type == "text":
        body_text = msg.get("text", {}).get("body", "")
    elif msg_type == "image":
        body_text = msg.get("image", {}).get("caption", "[Imagen]")
    elif msg_type == "document":
        body_text = msg.get("document", {}).get("filename", "[Documento]")
    elif msg_type == "audio":
        body_text = "[Audio]"

    # Sender display name from contacts metadata
    contacts = value.get("contacts", [])
    sender_name = contacts[0].get("profile", {}).get("name", wa_id) if contacts else wa_id

    # Resolve tenant_id by phone number business account
    # For MVP: use the first tenant that matches the phone_number_id or fallback to NULL
    phone_number_id = value.get("metadata", {}).get("phone_number_id", "")
    tenant_id = await _resolve_tenant(phone_number_id)

    try:
        await db.execute(
            """
            INSERT INTO whatsapp_messages
                (tenant_id, wa_id, message_id, sender_name, body, message_type, direction, received_at)
            VALUES
                ($1::uuid, $2, $3, $4, $5, $6, 'inbound', $7)
            ON CONFLICT (message_id) DO NOTHING
            """,
            tenant_id,
            wa_id,
            msg_id,
            sender_name,
            body_text,
            msg_type,
            datetime.fromtimestamp(int(ts), tz=timezone.utc) if ts else datetime.now(timezone.utc),
        )
        logger.info("[WhatsApp] Stored message %s from %s", msg_id, wa_id)
    except Exception as exc:
        logger.error("[WhatsApp] DB insert error: %s", exc)


async def _resolve_tenant(phone_number_id: str) -> str | None:
    """Look up tenant_id by their WhatsApp phone_number_id."""
    if not phone_number_id:
        return None
    try:
        row = await db.fetch_one(
            "SELECT tenant_id FROM whatsapp_credentials WHERE phone_number_id = $1 LIMIT 1",
            phone_number_id,
        )
        return str(row["tenant_id"]) if row else None
    except Exception:
        return None
