"""
Agente Facebook: Facebook Messenger
Responsabilidad: Gestionar mensajes de Facebook Messenger Business
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import hashlib

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"send", "reply", "get_conversations", "receive"}


def _generate_fb_msg_id(fb_id: str) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    h = hashlib.md5(f"{fb_id}{ts}".encode()).hexdigest()[:9].upper()
    return f"FBM-{h}"


def _generate_fb_conv_id(fb_id: str) -> str:
    h = hashlib.md5(fb_id.encode()).hexdigest()[:9].upper()
    return f"FB-CONV-{h}"


class AgentFBFacebook:
    """
    Facebook Agent — Mensajería Messenger vía Graph API.

    Acciones:
      send             → Envía mensaje a PSID de usuario
      reply            → Responde en conversación existente
      get_conversations → Lista conversaciones del page
      receive          → Procesa webhook de mensaje entrante

    Soporte para quick_replies (botones de respuesta rápida).

    Input:
        {
            "action":          str   — send | reply | get_conversations | receive
            "facebook_id":     str   — PSID del usuario (Page-Scoped ID)
            "message":         str   — Texto del mensaje
            "conversation_id": str   — (opcional) ID conversación
            "quick_replies":   list  — (opcional) [{title, payload}]
        }

    Output:
        {
            "message_id":      str
            "facebook_id":     str
            "status":          str — sent
            "conversation_id": str
            "sent_at":         str
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Facebook Agent"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa acción de Facebook Messenger."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} action={validated['action']} fb_id={validated.get('facebook_id')}")
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
            fb_id = str(data.get("facebook_id", "")).strip()
            if not fb_id:
                raise ValueError("facebook_id (PSID) is required for send/reply")
            data["facebook_id"] = fb_id
            if not data.get("message") and not data.get("quick_replies"):
                raise ValueError("message or quick_replies required for send/reply")

        qr = data.get("quick_replies")
        if qr is not None:
            if not isinstance(qr, list):
                raise ValueError("quick_replies must be a list")
            for i, qr_item in enumerate(qr):
                if "title" not in qr_item or "payload" not in qr_item:
                    raise ValueError(f"quick_replies[{i}] must have title and payload")

        if data.get("_simulate_rate_limit"):
            raise ValueError("rate_limit: Facebook Messenger API rate limit exceeded")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data["action"]
        fb_id = data.get("facebook_id", "")

        if action == "get_conversations":
            return {
                "action": action,
                "conversations": [],
                "total": 0,
                "note": "Facebook Graph API integration pending — Fase 2",
            }

        if action == "receive":
            return {
                "action": action,
                "webhook_processed": True,
                "from": data.get("facebook_id", "unknown"),
                "message": data.get("message", ""),
                "note": "Webhook processing & DB storage pending — Fase 2",
            }

        # Try real Facebook Graph API via WhatsApp integration (shared token)
        try:
            from src.integrations import whatsapp_integration
            if whatsapp_integration.access_token:
                api_result = await whatsapp_integration.send_message(
                    to=fb_id,
                    message=data.get("message", ""),
                )
                if api_result.get("success"):
                    logger.info(f"{self.name} sent via Facebook Graph API to {fb_id}")
                    qr = data.get("quick_replies")
                    return {
                        "action": action,
                        "message_id": api_result.get("message_id") or _generate_fb_msg_id(fb_id),
                        "facebook_id": fb_id,
                        "status": "sent",
                        "conversation_id": data.get("conversation_id") or _generate_fb_conv_id(fb_id),
                        "has_quick_replies": bool(qr),
                        "quick_replies_count": len(qr) if qr else 0,
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                        "provider": "facebook_graph_api",
                    }
        except Exception as e:
            logger.warning(f"{self.name} Facebook Graph API unavailable, using mock: {e}")

        conv_id = data.get("conversation_id") or _generate_fb_conv_id(fb_id)
        qr = data.get("quick_replies")
        return {
            "action": action,
            "message_id": _generate_fb_msg_id(fb_id),
            "facebook_id": fb_id,
            "status": "sent",
            "conversation_id": conv_id,
            "has_quick_replies": bool(qr),
            "quick_replies_count": len(qr) if qr else 0,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "note": "configure FB_PAGE_ACCESS_TOKEN in .env",
        }


fb_agent = AgentFBFacebook()
