"""Agent #18 — Finance Snapshot"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)

_PERIOD_SQL = {
    "today":   "NOW() - INTERVAL '1 day'",
    "week":    "NOW() - INTERVAL '7 days'",
    "month":   "NOW() - INTERVAL '30 days'",
    "quarter": "NOW() - INTERVAL '90 days'",
}


class FinanceSnapshotAgent:
    name = "Finance Snapshot #18"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        period = data.get("period", "month")
        sections = data.get("sections") or ["receivables", "payables", "cashflow", "sales"]
        since = _PERIOD_SQL.get(period, _PERIOD_SQL["month"])

        try:
            result = {"period": period}

            if "sales" in sections:
                row = await db.fetch_one(
                    f"""SELECT
                        COALESCE(SUM(CASE WHEN status='completed' THEN total ELSE 0 END),0) AS revenue,
                        COUNT(*) AS orders_total,
                        COUNT(CASE WHEN status='completed' THEN 1 END) AS orders_completed,
                        COALESCE(AVG(CASE WHEN status='completed' THEN total END),0) AS avg_ticket
                    FROM orders WHERE tenant_id=$1 AND created_at >= {since}""",
                    tenant_id,
                )
                result["sales"] = dict(row) if row else {}

            if "receivables" in sections:
                row = await db.fetch_one(
                    """SELECT
                        COALESCE(SUM(CASE WHEN payment_status='pending' THEN total ELSE 0 END),0) AS pending,
                        COALESCE(SUM(CASE WHEN payment_status='overdue' THEN total ELSE 0 END),0) AS overdue,
                        COUNT(CASE WHEN payment_status='pending' THEN 1 END) AS pending_count
                    FROM orders WHERE tenant_id=$1 AND payment_status IN ('pending','overdue')""",
                    tenant_id,
                )
                result["receivables"] = dict(row) if row else {}

            if "payables" in sections:
                row = await db.fetch_one(
                    """SELECT
                        COALESCE(SUM(CASE WHEN status='pending' THEN total ELSE 0 END),0) AS pending,
                        COALESCE(SUM(CASE WHEN status='overdue' THEN total ELSE 0 END),0) AS overdue,
                        COUNT(*) AS total_pos
                    FROM purchase_orders WHERE tenant_id=$1 AND status IN ('pending','overdue')""",
                    tenant_id,
                )
                result["payables"] = dict(row) if row else {}

            if "cashflow" in sections:
                row = await db.fetch_one(
                    f"""SELECT
                        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS income,
                        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expenses,
                        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) AS net
                    FROM cashflow_entries WHERE tenant_id=$1 AND created_at >= {since}""",
                    tenant_id,
                )
                result["cashflow"] = dict(row) if row else {}

            return {"success": True, "data": result}
        except Exception as exc:
            logger.error("FinanceSnapshot failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


finance_snapshot = FinanceSnapshotAgent()
