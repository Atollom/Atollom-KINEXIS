"""
Agente #37: Support Tickets
Responsabilidad: Atender y clasificar tickets de soporte automáticamente
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_CHANNELS = {"email", "whatsapp", "chat"}

# Pattern → (category, priority)
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

# SLA hours by priority
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

# Ticket counter — Fase 2: from Supabase sequence
_TICKET_COUNTER = 41


def _next_ticket_id() -> str:
    global _TICKET_COUNTER
    _TICKET_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"TKT-{year}-{_TICKET_COUNTER:03d}"


def _classify_ticket(subject: str, message: str) -> tuple[str, str]:
    """Returns (category, priority)."""
    text = (subject + " " + message).lower()
    for pattern, category, priority in CATEGORY_PATTERNS:
        if re.search(pattern, text):
            return category, priority
    return "general", "low"


class Agent37SupportTickets:
    """
    Support Tickets — Clasificación y respuesta automática de tickets.

    Flujo:
      1. Clasifica categoría por NLP regex (subject + message)
      2. Asigna prioridad según categoría
      3. Calcula SLA (response time, resolution time)
      4. Genera respuesta automática
      5. Escala a equipo de soporte si high priority

    Input:
        {
            "customer_id": str  — ID del cliente
            "subject":     str  — Asunto del ticket
            "message":     str  — Cuerpo del ticket
            "channel":     str  — email | whatsapp | chat
            "attachments": list — (opcional) lista de archivos
        }

    Output:
        {
            "ticket_id":    str
            "customer_id":  str
            "category":     str
            "priority":     str — high | medium | low
            "auto_response": {sent, message, escalate_to}
            "sla":          {response_due, resolution_due}
            "created_at":   str
        }
    """

    REQUIRED_FIELDS = ["customer_id", "subject", "message", "channel"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #37 - Support Tickets"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Clasifica y responde ticket de soporte."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} ticket={result.get('ticket_id')} "
                f"category={result.get('category')} priority={result.get('priority')}"
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

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Persist ticket to Supabase (table: support_tickets)
        - Send auto-response via channel (WhatsApp/email)
        - Assign to support agent via round-robin
        - Notify Slack #support channel for high priority
        """
        subject = data["subject"]
        message = data["message"]
        category, priority = _classify_ticket(subject, message)
        now = datetime.now(timezone.utc)
        ticket_id = _next_ticket_id()
        sla = self._build_sla(priority, now)
        auto_msg = AUTO_RESPONSES.get(category, AUTO_RESPONSES["general"])
        escalate_to = "support_team" if priority == "high" else "queue"

        return {
            "ticket_id": ticket_id,
            "customer_id": data["customer_id"],
            "subject": subject,
            "category": category,
            "priority": priority,
            "channel": data["channel"],
            "attachments_count": len(data.get("attachments", [])),
            "auto_response": {
                "sent": True,
                "message": auto_msg,
                "escalate_to": escalate_to,
            },
            "sla": sla,
            "created_at": now.isoformat(),
            "note": "Supabase persistence, auto-response & agent assignment pending — Fase 2",
        }


support_tickets = Agent37SupportTickets()
