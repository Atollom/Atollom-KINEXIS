"""Agent #30 — Purchase Orders"""
import logging
from datetime import datetime

from src.utils.database import db

logger = logging.getLogger(__name__)


class PurchaseOrdersAgent:
    name = "Purchase Orders #30"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "create")
        try:
            if action == "create":
                return await self._create(tenant_id, data)
            elif action == "approve":
                return await self._approve(tenant_id, data)
            elif action == "send":
                return await self._send(tenant_id, data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("PurchaseOrders failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _create(self, tenant_id: str, data: dict) -> dict:
        items = data.get("items", [])
        if not items:
            return {"success": False, "error": "items required", "data": {}}

        supplier_id = data.get("supplier_id")
        payment_terms = data.get("payment_terms", "30_days")

        subtotal = sum(
            float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items
        )
        total = subtotal * 1.16

        row = await db.fetch_one(
            """INSERT INTO purchase_orders
               (tenant_id, supplier_id, status, items, total_estimate, created_at)
               VALUES ($1, $2, 'DRAFT', $3::jsonb, $4, NOW())
               RETURNING id""",
            tenant_id,
            supplier_id,
            __import__("json").dumps(items),
            total,
        )
        po_id = str(row["id"]) if row else None
        logger.info("PO created: id=%s tenant=%s", po_id, tenant_id)
        return {
            "success": True,
            "data": {
                "po_id": po_id,
                "status": "DRAFT",
                "subtotal": subtotal,
                "iva": subtotal * 0.16,
                "total": total,
                "items_count": len(items),
            },
        }

    async def _approve(self, tenant_id: str, data: dict) -> dict:
        po_id = data.get("po_id")
        if not po_id:
            return {"success": False, "error": "po_id required", "data": {}}
        await db.execute(
            "UPDATE purchase_orders SET status='APPROVED' WHERE id=$1 AND tenant_id=$2",
            po_id, tenant_id,
        )
        return {"success": True, "data": {"po_id": po_id, "status": "APPROVED"}}

    async def _send(self, tenant_id: str, data: dict) -> dict:
        po_id = data.get("po_id")
        if not po_id:
            return {"success": False, "error": "po_id required", "data": {}}
        await db.execute(
            "UPDATE purchase_orders SET status='SENT' WHERE id=$1 AND tenant_id=$2",
            po_id, tenant_id,
        )
        return {"success": True, "data": {"po_id": po_id, "status": "SENT"}}


purchase_orders = PurchaseOrdersAgent()
