"""
Agente Instagram: Instagram DM Messaging
Responsabilidad: Gestionar mensajes directos de Instagram Business
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import hashlib

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"send", "reply", "get_messages", "receive"}


def _generate_ig_msg_id(ig_id: str) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    h = hashlib.md5(f"{ig_id}{ts}".encode()).hexdigest()[:9].upper()
    return f"IGM-{h}"


def _generate_ig_conv_id(ig_id: str) -> str:
    h = hashlib.md5(ig_id.encode()).hexdigest()[:8].upper()
    return f"IG-CONV-{h}"


class AgentIGInstagram:
    """
    Instagram Agent — Mensajería DM de Instagram Business vía Graph API.

    Acciones:
      send         → Envía DM a usuario de Instagram
      reply        → Responde en conversación existente
      get_messages → Lista mensajes de una conversación
      receive      → Procesa webhook de mensaje entrante

    Input:
        {
            "action":          str  — send | reply | get_messages | receive
            "instagram_id":    str  — IGSID del usuario
            "message":         str  — Texto del mensaje
            "conversation_id": str  — (opcional) ID conversación
            "media":           dict — (opcional) {type, url}
        }

    Output:
        {
            "message_id":      str
            "instagram_id":    str
            "status":          str — sent
            "conversation_id": str
            "sent_at":         str
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Instagram Agent"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa acción de Instagram DM."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} action={validated['action']} ig_id={validated.get('instagram_id')}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        if data["action"] in {"send", "reply"}:
            ig_id = str(data.get("instagram_id", "")).strip()
            if not ig_id:
                raise ValueError("instagram_id is required for send/reply")
            data["instagram_id"] = ig_id
            if not data.get("message") and not data.get("media"):
                raise ValueError("message or media is required for send/reply")

        if data.get("_simulate_rate_limit"):
            raise ValueError("rate_limit: Instagram Graph API rate limit exceeded")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://graph.facebook.com/v19.0/me/messages",
                params={"access_token": IG_ACCESS_TOKEN},
                json={"recipient": {"id": ig_id}, "message": {"text": message}}
            )
        """
        action = data["action"]
        ig_id = data.get("instagram_id", "")

        if action == "get_messages":
            return {
                "action": action,
                "messages": [],
                "total": 0,
                "conversation_id": data.get("conversation_id"),
                "note": "Instagram Graph API integration pending — Fase 2",
            }

        if action == "receive":
            return {
                "action": action,
                "webhook_processed": True,
                "from": data.get("instagram_id", "unknown"),
                "message": data.get("message", ""),
                "note": "Webhook processing & DB storage pending — Fase 2",
            }

        conv_id = data.get("conversation_id") or _generate_ig_conv_id(ig_id)
        return {
            "action": action,
            "message_id": _generate_ig_msg_id(ig_id),
            "instagram_id": ig_id,
            "status": "sent",
            "conversation_id": conv_id,
            "has_media": bool(data.get("media")),
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "note": "Instagram Graph API integration pending — Fase 2",
        }


ig_agent = AgentIGInstagram()
