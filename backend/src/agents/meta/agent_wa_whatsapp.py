"""
Agente WhatsApp: WhatsApp Business Messaging
Responsabilidad: Gestionar mensajes WhatsApp Business (envío, recepción, plantillas)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import hashlib

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"send", "reply", "get_conversations", "receive"}
PHONE_PATTERN = re.compile(r"^\+\d{10,15}$")

# Message counter — Fase 2: Redis rate limiter
_MSG_COUNTER = 0
RATE_LIMIT_THRESHOLD = 1000


def _generate_wamid(phone: str) -> str:
    ts = datetime.now(timezone.utc).isoformat()
    h = hashlib.md5(f"{phone}{ts}".encode()).hexdigest()[:12].upper()
    return f"WAMID.{h}"


def _generate_conv_id(phone: str) -> str:
    h = hashlib.md5(phone.encode()).hexdigest()[:8].upper()
    return f"WA-CONV-{h}"


class AgentWAWhatsApp:
    """
    WhatsApp Agent — Mensajería WhatsApp Business vía Cloud API.

    Acciones:
      send             → Envía mensaje nuevo a un número
      reply            → Responde en conversación existente
      get_conversations → Lista conversaciones activas
      receive          → Procesa webhook de mensaje entrante

    Input:
        {
            "action":          str  — send | reply | get_conversations | receive
            "phone":           str  — E.164 (+522221234567), requerido para send/reply
            "message":         str  — Texto del mensaje
            "conversation_id": str  — (opcional) ID conversación
            "template":        str  — (opcional) nombre de template aprobado
            "media":           dict — (opcional) {type, url}
        }

    Output:
        {
            "message_id":      str
            "phone":           str
            "status":          str — sent | delivered | read
            "conversation_id": str
            "sent_at":         str
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "WhatsApp Agent"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa acción de WhatsApp Business."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} action={validated['action']} phone={validated.get('phone')}")
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
            phone = data.get("phone", "")
            if not PHONE_PATTERN.match(phone):
                raise ValueError(f"Invalid phone format. Expected E.164: {phone}")
            msg = data.get("message", "")
            if not msg and not data.get("template") and not data.get("media"):
                raise ValueError("message, template, or media is required for send/reply")

        if data.get("_simulate_rate_limit"):
            raise ValueError("rate_limit: WhatsApp API rate limit exceeded (1000 msg/day)")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages",
                headers={"Authorization": f"Bearer {WA_ACCESS_TOKEN}"},
                json={...}
            )
        """
        action = data["action"]
        phone = data.get("phone", "")

        if action == "get_conversations":
            return {
                "action": action,
                "conversations": [],
                "total": 0,
                "note": "WhatsApp Cloud API integration pending — Fase 2",
            }

        if action == "receive":
            return {
                "action": action,
                "webhook_processed": True,
                "from": data.get("phone", "unknown"),
                "message": data.get("message", ""),
                "note": "Webhook processing & DB storage pending — Fase 2",
            }

        conv_id = data.get("conversation_id") or _generate_conv_id(phone)
        return {
            "action": action,
            "message_id": _generate_wamid(phone),
            "phone": phone,
            "status": "sent",
            "conversation_id": conv_id,
            "has_template": bool(data.get("template")),
            "has_media": bool(data.get("media")),
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "note": "WhatsApp Cloud API integration pending — Fase 2",
        }


wa_agent = AgentWAWhatsApp()
