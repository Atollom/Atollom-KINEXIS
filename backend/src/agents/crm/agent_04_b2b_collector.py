"""Agent #4 — B2B Collector (stub)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class B2BCollectorAgent:
    name = "B2B Collector #4"

    async def execute(self, data):
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}
        try:
            row = await db.fetch_one(
                "INSERT INTO leads (tenant_id, company_name, contact_name, contact_email, deal_stage) "
                "VALUES ($1, $2, $3, $4, 'new') RETURNING id",
                tenant_id,
                data.get("company_name", ""),
                data.get("contact_name", ""),
                data.get("contact_email", ""),
            )
            return {"success": True, "data": {"lead_id": str(row["id"]) if row else None}}
        except Exception as exc:
            logger.error("B2BCollector failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


b2b_collector = B2BCollectorAgent()
