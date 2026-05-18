"""
Agente #33: Follow-up Automation
Responsabilidad: Seguimiento automático a leads inactivos vía email (Resend)
Autor: Carlos Cortés (Atollom Labs)
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

import httpx

logger = logging.getLogger(__name__)

VALID_STAGES   = {"interested", "quoted", "negotiation"}
VALID_CHANNELS = {"whatsapp", "email", "phone"}

RESEND_URL  = "https://api.resend.com/emails"
EMAIL_FROM  = os.getenv("EMAIL_FROM", "noreply@onboarding.resend.dev")

# Days inactive → template key
TEMPLATE_MAP = {
    (1,  7):  "check_in_7d",
    (8,  14): "offer_urgency_14d",
    (15, 30): "final_attempt_30d",
}

MESSAGE_PREVIEWS = {
    "check_in_7d": {
        "interested":  "Hola {name}, te contactamos hace unos días. ¿Pudiste revisar nuestra propuesta?",
        "quoted":      "Hola {name}, te enviamos una cotización hace unos días. ¿Tienes alguna duda?",
        "negotiation": "Hola {name}, ¿hay algo en la negociación que podamos afinar para avanzar?",
    },
    "offer_urgency_14d": {
        "interested":  "Hola {name}, queremos asegurarnos de no perderte. Tenemos una oferta especial esta semana.",
        "quoted":      "Hola {name}, tu cotización sigue vigente. Te ofrecemos un 5% adicional si cerramos esta semana.",
        "negotiation": "Hola {name}, queremos cerrar esto contigo. ¿Qué necesitas para avanzar?",
    },
    "final_attempt_30d": {
        "interested":  "Hola {name}, este es nuestro último intento de contacto. ¿Sigues interesado?",
        "quoted":      "Hola {name}, tu cotización está por vencer. ¿Te gustaría renovarla?",
        "negotiation": "Hola {name}, queremos retomar la conversación. ¿Hay algo que podamos mejorar?",
    },
}

EMAIL_HTML = {
    "check_in_7d": """
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px">
  <div style="background:#14532d;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#CCFF00;font-size:22px;margin:0">KINEXIS</h1>
    <p style="color:#bbf7d0;font-size:12px;margin:4px 0 0">Seguimiento automático</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827;font-size:15px">Hola <strong>{name}</strong>,</p>
    <p style="color:#4b5563">Te contactamos hace unos días y queremos asegurarnos de que recibiste toda la información que necesitabas.</p>
    <p style="color:#4b5563">¿Pudiste revisar nuestra propuesta? Con gusto aclaramos cualquier duda.</p>
    <a href="mailto:{reply_to}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px">Responder</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Atollom Labs · contacto@atollom.com</p>
  </div>
</div>""",
    "offer_urgency_14d": """
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px">
  <div style="background:#14532d;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#CCFF00;font-size:22px;margin:0">KINEXIS</h1>
    <p style="color:#bbf7d0;font-size:12px;margin:4px 0 0">Oferta especial para ti</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827;font-size:15px">Hola <strong>{name}</strong>,</p>
    <p style="color:#4b5563">Queremos asegurarnos de no perderte como cliente. Esta semana tenemos una <strong>oferta especial de 5% de descuento</strong> si cerramos el trato.</p>
    <p style="color:#4b5563">¿Te gustaría retomar la conversación?</p>
    <a href="mailto:{reply_to}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px">Contactar ahora</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Atollom Labs · contacto@atollom.com</p>
  </div>
</div>""",
    "final_attempt_30d": """
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:12px">
  <div style="background:#111827;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#CCFF00;font-size:22px;margin:0">KINEXIS</h1>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0">Último intento de contacto</p>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827;font-size:15px">Hola <strong>{name}</strong>,</p>
    <p style="color:#4b5563">Este es nuestro último intento de contacto. Si sigues interesado, nos encantaría retomar la conversación.</p>
    <p style="color:#4b5563">Si ya no te interesa, no hay problema — no recibirás más mensajes de nuestra parte.</p>
    <a href="mailto:{reply_to}" style="display:inline-block;background:#374151;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px">Responder</a>
    <p style="color:#9ca3af;font-size:12px;margin-top:24px">Atollom Labs · contacto@atollom.com</p>
  </div>
</div>""",
}

EMAIL_SUBJECTS = {
    "check_in_7d":      "¿Pudiste revisar nuestra propuesta?",
    "offer_urgency_14d": "Oferta especial — esta semana",
    "final_attempt_30d": "Último intento de contacto",
}


def _get_template(days_inactive: int) -> Optional[str]:
    for (lo, hi), template in TEMPLATE_MAP.items():
        if lo <= days_inactive <= hi:
            return template
    return None


class Agent33FollowUp:
    """
    Follow-up Automation — Seguimiento a leads inactivos con email vía Resend.

    Reglas:
      1-7 días   → check_in_7d       (recordatorio suave)
      8-14 días  → offer_urgency_14d  (oferta urgente)
      15-30 días → final_attempt_30d  (último intento)
      >30 días   → no_action (marcar como frío)

    Input:
        {
            "lead_id":           str
            "lead_name":         str  — (opcional) nombre del lead
            "email":             str  — (opcional) para envío real
            "days_inactive":     int
            "stage":             str  — interested | quoted | negotiation
            "channel":           str  — whatsapp | email | phone
            "last_contact_date": str  — (opcional) ISO timestamp
        }
    """

    REQUIRED_FIELDS = ["lead_id", "days_inactive", "stage", "channel"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #33 - Follow-up"
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                "%s lead=%s action=%s days=%s channel=%s",
                self.name, validated["lead_id"],
                result.get("action"), validated["days_inactive"], validated["channel"],
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
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

    async def _send_email(
        self,
        to_email: str,
        lead_name: str,
        template: str,
    ) -> Dict[str, Any]:
        if not self.resend_api_key:
            return {"sent": False, "reason": "RESEND_API_KEY not configured"}

        subject = EMAIL_SUBJECTS.get(template, "Seguimiento KINEXIS")
        html = EMAIL_HTML.get(template, "<p>Seguimiento automático</p>").format(
            name=lead_name,
            reply_to=EMAIL_FROM,
        )
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    RESEND_URL,
                    headers={
                        "Authorization": f"Bearer {self.resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from":    EMAIL_FROM,
                        "to":      [to_email],
                        "subject": subject,
                        "html":    html,
                    },
                )
            if resp.status_code in (200, 201):
                return {"sent": True, "email_id": resp.json().get("id"), "to": to_email}
            logger.warning("%s Resend error %s: %s", self.name, resp.status_code, resp.text[:200])
            return {"sent": False, "reason": f"HTTP {resp.status_code}", "detail": resp.text[:200]}
        except Exception as e:
            logger.warning("%s email send failed: %s", self.name, e)
            return {"sent": False, "reason": str(e)}

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        days      = data["days_inactive"]
        stage     = data["stage"]
        channel   = data["channel"]
        lead_name = str(data.get("lead_name") or "").strip() or "estimado cliente"
        to_email  = str(data.get("email") or "").strip()
        now       = datetime.now(timezone.utc)
        template  = _get_template(days)

        if not template:
            return {
                "lead_id":          data["lead_id"],
                "action":           "no_action",
                "reason":           f"Lead inactive for {days} days — marked cold",
                "message_template": None,
                "message_preview":  None,
                "channel":          channel,
                "scheduled_at":     None,
                "next_follow_up":   None,
            }

        preview_tpl = MESSAGE_PREVIEWS[template].get(stage, MESSAGE_PREVIEWS[template]["interested"])
        preview     = preview_tpl.format(name=lead_name)
        next_follow = (now + timedelta(days=7)).isoformat()

        email_result: Dict[str, Any] = {"sent": False, "reason": "channel is not email"}
        if channel == "email" and to_email:
            email_result = await self._send_email(to_email, lead_name, template)

        return {
            "lead_id":          data["lead_id"],
            "action":           "send_follow_up",
            "message_template": template,
            "message_preview":  preview,
            "channel":          channel,
            "days_inactive":    days,
            "stage":            stage,
            "email_delivery":   email_result,
            "scheduled_at":     now.isoformat(),
            "next_follow_up":   next_follow,
        }


follow_up = Agent33FollowUp()
