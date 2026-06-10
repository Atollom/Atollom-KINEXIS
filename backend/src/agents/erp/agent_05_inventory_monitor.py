"""Agent #5 — Inventory Monitor (stub)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class InventoryMonitorAgent:
    name = "Inventory Monitor #5"

    async def execute(self, data):
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}
        try:
            rows = await db.fetch_all(
                "SELECT sku, stock, days_remaining FROM inventory WHERE tenant_id=$1 AND stock < 10 LIMIT 20",
                tenant_id,
            )
            return {"success": True, "data": {"low_stock": rows, "count": len(rows)}}
        except Exception as exc:
            logger.error("InventoryMonitor failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


inventory_monitor = InventoryMonitorAgent()
