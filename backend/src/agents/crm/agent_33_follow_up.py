"""
Agente #33: Follow-up
Responsabilidad: Seguimiento automático a leads inactivos
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_STAGES = {"interested", "quoted", "negotiation"}
VALID_CHANNELS = {"whatsapp", "email", "phone"}

# Days inactive → template key
TEMPLATE_MAP = {
    (1, 7):   "check_in_7d",
    (8, 14):  "offer_urgency_14d",
    (15, 30): "final_attempt_30d",
}

# Message previews per template (stage-aware where possible)
MESSAGE_PREVIEWS = {
    "check_in_7d": {
        "interested":   "Hola [nombre], te contactamos hace unos días. ¿Pudiste revisar nuestra propuesta?",
        "quoted":       "Hola [nombre], te enviamos una cotización hace unos días. ¿Tienes alguna duda?",
        "negotiation":  "Hola [nombre], ¿hay algo en la negociación que podamos afinar para avanzar?",
    },
    "offer_urgency_14d": {
        "interested":   "Hola [nombre], queremos asegurarnos de no perderte. Tenemos una oferta especial esta semana.",
        "quoted":       "Hola [nombre], tu cotización sigue vigente. Te ofrecemos un 5% adicional si cerramos esta semana.",
        "negotiation":  "Hola [nombre], queremos cerrar esto contigo. ¿Qué necesitas para avanzar?",
    },
    "final_attempt_30d": {
        "interested":   "Hola [nombre], este es nuestro último intento de contacto. ¿Sigues interesado?",
        "quoted":       "Hola [nombre], tu cotización está por vencer. ¿Te gustaría renovarla?",
        "negotiation":  "Hola [nombre], queremos retomar la conversación. ¿Hay algo que podamos mejorar?",
    },
}


def _get_template(days_inactive: int) -> Optional[str]:
    for (lo, hi), template in TEMPLATE_MAP.items():
        if lo <= days_inactive <= hi:
            return template
    return None


class Agent33FollowUp:
    """
    Follow-up — Seguimiento automático a leads por inactividad.

    Reglas:
      1-7 días  → check_in_7d       (recordatorio suave)
      8-14 días → offer_urgency_14d  (oferta con urgencia)
      15-30 días → final_attempt_30d (último intento)
      >30 días  → no action (marcar como frío)

    Input:
        {
            "lead_id":           str  — ID del lead
            "last_contact_date": str  — ISO timestamp
            "days_inactive":     int  — días desde último contacto
            "stage":             str  — interested | quoted | negotiation
            "channel":           str  — whatsapp | email | phone
        }

    Output:
        {
            "lead_id":          str
            "action":           str  — send_follow_up | no_action
            "message_template": str
            "message_preview":  str
            "channel":          str
            "scheduled_at":     str
            "next_follow_up":   str  — +7 días
        }
    """

    REQUIRED_FIELDS = ["lead_id", "days_inactive", "stage", "channel"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #33 - Follow-up"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Determina y agenda seguimiento para lead inactivo."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} lead={validated['lead_id']} "
                f"action={result.get('action')} days={validated['days_inactive']}"
            )
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

        lead_id = str(data["lead_id"]).strip()
        if not lead_id:
            raise ValueError("lead_id cannot be empty")

        days = int(data["days_inactive"])
        if days < 0:
            raise ValueError("days_inactive must be >= 0")
        data["days_inactive"] = days

        if data["stage"] not in VALID_STAGES:
            raise ValueError(f"Invalid stage. Valid: {VALID_STAGES}")

        if data["channel"] not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel. Valid: {VALID_CHANNELS}")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Fetch lead contact name from Supabase
        - Send WhatsApp via WhatsApp Cloud API
        - Send email via Resend/SendGrid
        - Update lead last_contact_date in Supabase
        """
        days = data["days_inactive"]
        stage = data["stage"]
        channel = data["channel"]
        now = datetime.now(timezone.utc)
        template = _get_template(days)

        if not template:
            return {
                "lead_id": data["lead_id"],
                "action": "no_action",
                "reason": f"Lead inactive for {days} days — mark as cold",
                "message_template": None,
                "message_preview": None,
                "channel": channel,
                "scheduled_at": None,
                "next_follow_up": None,
                "note": "Lead marked cold after 30+ days — Fase 2: archive flow",
            }

        preview = MESSAGE_PREVIEWS[template].get(stage, MESSAGE_PREVIEWS[template]["interested"])
        next_follow_up = (now + timedelta(days=7)).isoformat()

        return {
            "lead_id": data["lead_id"],
            "action": "send_follow_up",
            "message_template": template,
            "message_preview": preview,
            "channel": channel,
            "days_inactive": days,
            "stage": stage,
            "scheduled_at": now.isoformat(),
            "next_follow_up": next_follow_up,
            "note": "WhatsApp/email delivery integration pending — Fase 2",
        }


follow_up = Agent33FollowUp()
