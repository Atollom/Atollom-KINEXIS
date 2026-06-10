"""Agent #37 — Support Tickets (stub)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class SupportTicketsAgent:
    name = "Support Tickets #37"

    async def execute(self, data):
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}
        try:
            row = await db.fetch_one(
                "INSERT INTO support_tickets (tenant_id, subject, description, status, priority) "
                "VALUES ($1, $2, $3, 'open', $4) RETURNING id",
                tenant_id,
                data.get("subject", "Sin asunto"),
                data.get("description", ""),
                data.get("priority", "medium"),
            )
            return {"success": True, "data": {"ticket_id": str(row["id"]) if row else None}}
        except Exception as exc:
            logger.error("SupportTickets failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


support_tickets = SupportTicketsAgent()
