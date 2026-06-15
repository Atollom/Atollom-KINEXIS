"""Agent #5 — Inventory Monitor"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class InventoryMonitorAgent:
    name = "Inventory Monitor #5"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "get_alerts")
        try:
            if action == "check_stock":
                return await self._check_stock(tenant_id, data)
            elif action == "get_alerts":
                return await self._get_alerts(tenant_id)
            elif action == "suggest_reorder":
                return await self._suggest_reorder(tenant_id)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("InventoryMonitor failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _check_stock(self, tenant_id: str, data: dict) -> dict:
        sku = data.get("sku")
        warehouse = data.get("warehouse")
        if sku:
            sql = "SELECT sku, name, stock, min_stock, warehouse FROM inventory WHERE tenant_id=$1 AND sku=$2"
            rows = await db.fetch_all(sql, tenant_id, sku)
        elif warehouse:
            sql = "SELECT sku, name, stock, min_stock, warehouse FROM inventory WHERE tenant_id=$1 AND warehouse=$2 ORDER BY stock ASC LIMIT 50"
            rows = await db.fetch_all(sql, tenant_id, warehouse)
        else:
            sql = "SELECT sku, name, stock, min_stock, warehouse FROM inventory WHERE tenant_id=$1 ORDER BY stock ASC LIMIT 50"
            rows = await db.fetch_all(sql, tenant_id)
        return {"success": True, "data": {"items": rows, "count": len(rows)}}

    async def _get_alerts(self, tenant_id: str) -> dict:
        rows = await db.fetch_all(
            """SELECT sku, name, stock, min_stock, warehouse,
                      CASE WHEN stock = 0 THEN 'out_of_stock'
                           WHEN stock <= min_stock THEN 'critical'
                           WHEN stock <= min_stock * 2 THEN 'low'
                           ELSE 'ok' END AS alert_level
               FROM inventory
               WHERE tenant_id=$1 AND (stock <= min_stock * 2 OR stock = 0)
               ORDER BY stock ASC LIMIT 30""",
            tenant_id,
        )
        critical = [r for r in rows if r["alert_level"] in ("critical", "out_of_stock")]
        low = [r for r in rows if r["alert_level"] == "low"]
        return {
            "success": True,
            "data": {
                "alerts": rows,
                "critical_count": len(critical),
                "low_count": len(low),
                "total_alerts": len(rows),
            },
        }

    async def _suggest_reorder(self, tenant_id: str) -> dict:
        rows = await db.fetch_all(
            """SELECT sku, name, stock, min_stock, reorder_qty
               FROM inventory
               WHERE tenant_id=$1 AND stock <= min_stock
               ORDER BY (min_stock - stock) DESC LIMIT 20""",
            tenant_id,
        )
        suggestions = []
        for r in rows:
            qty = r.get("reorder_qty") or max(r.get("min_stock", 10) * 3, 10)
            suggestions.append({
                "sku": r["sku"],
                "name": r["name"],
                "current_stock": r["stock"],
                "min_stock": r["min_stock"],
                "suggested_order_qty": qty,
                "urgency": "high" if r["stock"] == 0 else "medium",
            })
        return {"success": True, "data": {"suggestions": suggestions, "count": len(suggestions)}}


inventory_monitor = InventoryMonitorAgent()
