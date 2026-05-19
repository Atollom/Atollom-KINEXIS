"""
Agente #37: Support Tickets
Responsabilidad: Clasificar tickets de soporte y persistirlos en Supabase
"""

import re
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_CHANNELS = {"email", "whatsapp", "chat"}

CATEGORY_PATTERNS = [
    (r"\b(defecto|dañad|roto|falla|batería|bateria|no funciona|descompuesto)\b",
     "producto_defectuoso", "high"),
    (r"\b(tardó|tardo|demoró|demoro|retraso|tracking|envío|no llegó|no llego|perdido)\b",
     "envio_tardio", "medium"),
    (r"\b(factura|cfdi|rfc|fiscal|comprobante)\b",
     "factura_cfdi", "medium"),
    (r"\b(cobro|cargo|pago|reembolso|devolución|devolucion|sobrecoste)\b",
     "cobro_incorrecto", "high"),
]

SLA_HOURS = {
    "high":   {"response": 24,  "resolution": 72},
    "medium": {"response": 48,  "resolution": 120},
    "low":    {"response": 72,  "resolution": 168},
}

AUTO_RESPONSES = {
    "producto_defectuoso": "Hemos recibido tu reporte de producto defectuoso. Te contactaremos en máximo 24h para coordinar el cambio o reembolso.",
    "envio_tardio":        "Lamentamos el retraso. Estamos verificando el estado de tu envío y te informaremos en las próximas 48h.",
    "factura_cfdi":        "Recibimos tu solicitud de factura. La procesaremos y enviaremos en máximo 48h hábiles.",
    "cobro_incorrecto":    "Revisaremos el cargo reportado con urgencia. Te contactaremos en máximo 24h.",
    "general":             "Hemos recibido tu mensaje. Un asesor te atenderá en breve.",
}


def _classify_ticket(subject: str, message: str) -> tuple[str, str]:
    text = (subject + " " + message).lower()
    for pattern, category, priority in CATEGORY_PATTERNS:
        if re.search(pattern, text):
            return category, priority
    return "general", "low"


class Agent37SupportTickets:
    """
    Support Tickets — Clasificación, persistencia en Supabase y respuesta automática.

    Input:
        {
            "customer_id": str, "subject": str, "message": str,
            "channel": str, "tenant_id": str (opcional),
            "attachments": list (opcional)
        }
    """

    REQUIRED_FIELDS = ["customer_id", "subject", "message", "channel"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #37 - Support Tickets"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s ticket=%s category=%s priority=%s",
                        self.name, result.get("ticket_id"),
                        result.get("category"), result.get("priority"))
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                raise ValueError(f"Missing required field: {f}")
        if not str(data["subject"]).strip():
            raise ValueError("subject cannot be empty")
        if not str(data["message"]).strip():
            raise ValueError("message cannot be empty")
        if data["channel"] not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel. Valid: {VALID_CHANNELS}")
        return data

    def _build_sla(self, priority: str, now: datetime) -> Dict[str, str]:
        hours = SLA_HOURS[priority]
        return {
            "response_due":   (now + timedelta(hours=hours["response"])).isoformat(),
            "resolution_due": (now + timedelta(hours=hours["resolution"])).isoformat(),
        }

    async def _persist(self, ticket: Dict, tenant_id: Optional[str]) -> str:
        from src.utils.database import db
        try:
            row = await db.fetch_one(
                """
                INSERT INTO support_tickets
                    (tenant_id, customer_id, subject, message, channel,
                     category, priority, status, auto_response,
                     response_due, resolution_due, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9::timestamptz, $10::timestamptz, NOW(), NOW())
                RETURNING id
                """,
                tenant_id,
                ticket["customer_id"],
                ticket["subject"],
                ticket["message"],
                ticket["channel"],
                ticket["category"],
                ticket["priority"],
                ticket["auto_response"]["message"],
                ticket["sla"]["response_due"],
                ticket["sla"]["resolution_due"],
            )
            if row:
                return str(row["id"])
        except Exception as e:
            logger.warning("%s DB persist failed: %s", self.name, e)
        # Fallback ID
        import hashlib
        key = f"{ticket['customer_id']}{ticket['subject']}{datetime.now(timezone.utc).isoformat()}"
        return "TKT-" + hashlib.sha256(key.encode()).hexdigest()[:8].upper()

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        subject    = data["subject"]
        message    = data["message"]
        tenant_id  = data.get("tenant_id")
        category, priority = _classify_ticket(subject, message)
        now        = datetime.now(timezone.utc)
        sla        = self._build_sla(priority, now)
        auto_msg   = AUTO_RESPONSES.get(category, AUTO_RESPONSES["general"])
        escalate_to = "support_team" if priority == "high" else "queue"

        ticket = {
            "customer_id":     data["customer_id"],
            "subject":         subject,
            "message":         message,
            "channel":         data["channel"],
            "category":        category,
            "priority":        priority,
            "attachments_count": len(data.get("attachments", [])),
            "auto_response":   {"sent": True, "message": auto_msg, "escalate_to": escalate_to},
            "sla":             sla,
            "created_at":      now.isoformat(),
        }

        ticket_id = await self._persist(ticket, tenant_id)
        ticket["ticket_id"] = ticket_id
        return ticket


support_tickets = Agent37SupportTickets()
