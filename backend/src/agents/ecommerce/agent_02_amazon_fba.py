"""Agent #2 — Amazon FBA Manager"""
import logging
from src.integrations.amazon_integration import AmazonIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)


class AmazonFBAAgent:
    name = "Amazon FBA #2"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "sync_inventory")
        try:
            if action == "sync_inventory":
                return await self._sync_inventory(tenant_id, data)
            elif action == "create_shipment":
                return await self._create_shipment(tenant_id, data)
            elif action == "get_status":
                return await self._get_status(tenant_id, data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("AmazonFBA failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _get_amazon(self, tenant_id: str):
        creds = await db.fetch_one(
            "SELECT seller_id, marketplace_id FROM amazon_credentials WHERE tenant_id=$1",
            tenant_id,
        )
        return AmazonIntegration({"seller_id": creds["seller_id"]} if creds else None)

    async def _sync_inventory(self, tenant_id: str, data: dict) -> dict:
        amazon = await self._get_amazon(tenant_id)
        inventory = await amazon.get_fba_inventory()
        synced = 0
        for item in inventory.get("inventorySummaries", []):
            await db.execute(
                """INSERT INTO amazon_inventory (tenant_id, asin, seller_sku, fulfillable_qty, synced_at)
                   VALUES ($1,$2,$3,$4,NOW())
                   ON CONFLICT (tenant_id, seller_sku) DO UPDATE
                   SET fulfillable_qty=$4, synced_at=NOW()""",
                tenant_id,
                item.get("asin", ""),
                item.get("sellerSku", ""),
                int(item.get("fulfillableQuantity", 0)),
            )
            synced += 1
        return {"success": True, "data": {"synced_items": synced, "source": "amazon_fba"}}

    async def _create_shipment(self, tenant_id: str, data: dict) -> dict:
        amazon = await self._get_amazon(tenant_id)
        items = [
            {"SellerSKU": i["sku"], "Quantity": i["quantity"]}
            for i in data.get("items", [])
        ]
        result = await amazon.create_inbound_shipment(
            shipment_name=data.get("shipment_name", f"KNX-{tenant_id[:8]}"),
            ship_from_address=data.get("origin", {}),
            items=items,
        )
        if result.get("success"):
            await db.execute(
                "INSERT INTO amazon_shipments (tenant_id, shipment_id, status, created_at) VALUES ($1,$2,'working',NOW())",
                tenant_id, result.get("shipmentId", ""),
            )
        return {"success": result.get("success", False), "data": result}

    async def _get_status(self, tenant_id: str, data: dict) -> dict:
        rows = await db.fetch_all(
            "SELECT shipment_id, status, created_at FROM amazon_shipments WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 10",
            tenant_id,
        )
        return {"success": True, "data": {"shipments": rows}}


amazon_fba = AmazonFBAAgent()
