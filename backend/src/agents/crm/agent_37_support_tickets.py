"""Agent #37 — Support Tickets (clasificación + SLA + auto-respuesta)"""
import logging
from datetime import datetime, timedelta
from src.utils.database import db

logger = logging.getLogger(__name__)

_SLA_HOURS = {"high": 24, "medium": 48, "low": 72}

_AUTO_RESPONSES = {
    "billing": "Hemos recibido tu consulta sobre facturación. Un especialista revisará tu caso y te contactará en {hours} horas.",
    "shipping": "Hemos recibido tu reporte sobre envío. Estamos verificando el estado con la paquetería y te informaremos en {hours} horas.",
    "product": "Hemos recibido tu reporte sobre el producto. Nuestro equipo de soporte revisará tu caso en {hours} horas.",
    "general": "Hemos recibido tu solicitud. Un agente de soporte te contactará en un máximo de {hours} horas.",
    "urgent": "Hemos recibido tu caso urgente. Te contactaremos en las próximas {hours} horas.",
}


def _classify_priority(subject: str, message: str) -> str:
    text = f"{subject} {message}".lower()
    if any(w in text for w in ["urgente", "urgent", "fraude", "robo", "dañado", "peligro", "inmediato"]):
        return "high"
    if any(w in text for w in ["factura", "pago", "cargo", "cobro"]):
        return "medium"
    return "low"


def _classify_category(subject: str, message: str) -> str:
    text = f"{subject} {message}".lower()
    if any(w in text for w in ["factura", "rfc", "cfdi", "pago", "cobro", "cargo"]):
        return "billing"
    if any(w in text for w in ["envío", "envio", "paquete", "tracking", "llegó", "llego", "entrega"]):
        return "shipping"
    if any(w in text for w in ["producto", "defecto", "roto", "dañado", "no funciona", "falla"]):
        return "product"
    if any(w in text for w in ["urgente", "emergencia"]):
        return "urgent"
    return "general"


class SupportTicketsAgent:
    name = "Support Tickets #37"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        subject = data.get("subject", "Sin asunto")
        message = data.get("message", data.get("description", ""))
        channel = data.get("channel", "chat")
        customer_id = data.get("customer_id")

        try:
            priority = _classify_priority(subject, message)
            category = _classify_category(subject, message)
            sla_hours = _SLA_HOURS[priority]
            sla_deadline = datetime.now() + timedelta(hours=sla_hours)
            auto_response = _AUTO_RESPONSES.get(category, _AUTO_RESPONSES["general"]).format(hours=sla_hours)

            row = await db.fetch_one(
                """INSERT INTO support_tickets
                   (tenant_id, customer_id, subject, description, channel, status, priority, category,
                    sla_deadline, auto_response, order_id, created_at)
                   VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8,$9,$10,NOW())
                   RETURNING id""",
                tenant_id,
                str(customer_id) if customer_id else None,
                subject,
                message,
                channel,
                priority,
                category,
                sla_deadline,
                auto_response,
                data.get("order_id"),
            )

            logger.info("Ticket created: priority=%s category=%s tenant=%s", priority, category, tenant_id)
            return {
                "success": True,
                "data": {
                    "ticket_id": str(row["id"]) if row else None,
                    "priority": priority,
                    "category": category,
                    "sla_deadline": sla_deadline.isoformat(),
                    "sla_hours": sla_hours,
                    "auto_response": auto_response,
                    "status": "open",
                },
            }
        except Exception as exc:
            logger.error("SupportTickets failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


support_tickets = SupportTicketsAgent()
