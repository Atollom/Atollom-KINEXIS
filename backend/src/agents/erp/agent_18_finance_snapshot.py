"""Agent #18 — Finance Snapshot (stub)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class FinanceSnapshotAgent:
    name = "Finance Snapshot #18"

    async def execute(self, data):
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}
        try:
            row = await db.fetch_one(
                """SELECT
                    COALESCE(SUM(CASE WHEN status='completed' THEN total ELSE 0 END), 0) AS revenue_30d,
                    COUNT(*) AS orders_total
                FROM orders
                WHERE tenant_id=$1 AND created_at >= NOW() - INTERVAL '30 days'""",
                tenant_id,
            )
            return {"success": True, "data": dict(row) if row else {}}
        except Exception as exc:
            logger.error("FinanceSnapshot failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


finance_snapshot = FinanceSnapshotAgent()
