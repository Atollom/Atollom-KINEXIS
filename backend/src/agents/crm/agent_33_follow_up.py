"""Agent #33 — Follow-up (generación de mensajes + agenda)"""
import logging
from datetime import datetime, timedelta
from src.utils.database import db

logger = logging.getLogger(__name__)

_MESSAGES = {
    "interested": {
        "whatsapp": "Hola {name}, ¿cómo estás? Quería saber si tuviste oportunidad de revisar nuestra propuesta. Estoy disponible si tienes alguna duda. 😊",
        "email": "Estimado {name}, espero se encuentre bien. Le escribo para hacer seguimiento a nuestra conversación del {last_contact}. ¿Podemos agendar una llamada esta semana?",
        "phone": "Llamar a {name} para verificar si revisó la propuesta inicial. Preguntar por próximos pasos y decisores involucrados.",
    },
    "quoted": {
        "whatsapp": "Hola {name}, ¿tuviste oportunidad de revisar la cotización que te enviamos? Cualquier ajuste que necesites con gusto lo hacemos. 💼",
        "email": "Estimado {name}, adjunto la cotización que le enviamos. Estaremos disponibles para resolver cualquier duda o hacer ajustes según sus necesidades.",
        "phone": "Llamar a {name} para hacer seguimiento a la cotización enviada. Preguntar si hay objeciones de precio o condiciones.",
    },
    "negotiation": {
        "whatsapp": "Hola {name}, ¿hay algún punto de la negociación que quieras revisar? Podemos agendar una llamada para cerrar los detalles. 🤝",
        "email": "Estimado {name}, estamos listos para cerrar el acuerdo. ¿Podemos agendar una reunión esta semana para revisar los términos finales?",
        "phone": "Llamar a {name} para acelerar el cierre. Tener lista contraoferta si es necesario.",
    },
}

_NEXT_DAYS = {"interested": 3, "quoted": 5, "negotiation": 2}


class FollowUpAgent:
    name = "Follow Up #33"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        lead_id = data.get("lead_id")

        if not tenant_id or not lead_id:
            return {"success": False, "error": "tenant_id and lead_id required", "data": {}}

        try:
            lead = await db.fetch_one(
                "SELECT * FROM leads WHERE id=$1 AND tenant_id=$2", lead_id, tenant_id
            )
            if not lead:
                return {"success": False, "error": f"Lead {lead_id} not found", "data": {}}

            stage = data.get("stage") or lead.get("deal_stage", "interested")
            channel = data.get("channel", "whatsapp")
            lead_name = data.get("lead_name") or lead.get("contact_name") or lead.get("company_name") or "Cliente"
            company = data.get("company") or lead.get("company_name", "")

            templates = _MESSAGES.get(stage, _MESSAGES["interested"])
            message = templates.get(channel, templates["whatsapp"]).format(
                name=lead_name,
                company=company,
                last_contact=(lead.get("last_contact") or datetime.now()).strftime("%d/%m/%Y") if lead.get("last_contact") else "la última vez",
            )

            next_days = _NEXT_DAYS.get(stage, 3)
            next_followup = datetime.now() + timedelta(days=next_days)

            await db.execute(
                "UPDATE leads SET last_contact=NOW(), next_followup=$1 WHERE id=$2 AND tenant_id=$3",
                next_followup, lead_id, tenant_id,
            )

            return {
                "success": True,
                "data": {
                    "lead_id": str(lead_id),
                    "lead_name": lead_name,
                    "stage": stage,
                    "channel": channel,
                    "message": message,
                    "next_followup": next_followup.strftime("%Y-%m-%d"),
                    "next_followup_days": next_days,
                },
            }
        except Exception as exc:
            logger.error("FollowUp failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


follow_up = FollowUpAgent()
