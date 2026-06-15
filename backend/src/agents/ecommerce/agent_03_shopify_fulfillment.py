"""Agent #3 — Shopify Fulfillment"""
import logging
from src.integrations.shopify_integration import ShopifyIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)


async def _get_shopify(tenant_id: str):
    creds = await db.fetch_one(
        "SELECT store_url, access_token FROM shopify_credentials WHERE tenant_id=$1",
        tenant_id,
    )
    if not creds:
        return None, "Shopify not connected for this tenant. Configure store_url and access_token first."
    return ShopifyIntegration({"store_url": creds["store_url"], "access_token": creds["access_token"]}), None


class ShopifyFulfillmentAgent:
    name = "Shopify Fulfillment #3"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        order_id = data.get("order_id")
        if not order_id:
            return {"success": False, "error": "order_id required", "data": {}}

        try:
            shopify, err = await _get_shopify(tenant_id)
            if err:
                return {"success": False, "error": err, "data": {}}

            order = await shopify.get_order(str(order_id))
            if not order:
                return {"success": False, "error": f"Order {order_id} not found in Shopify", "data": {}}

            tracking = data.get("tracking_number")
            carrier = data.get("carrier", "")

            fulfillment = await shopify.fulfill_order(
                order_id=str(order_id),
                tracking_number=tracking,
                tracking_company=carrier,
                notify_customer=data.get("notify_customer", True),
            )

            await db.execute(
                """INSERT INTO shopify_orders (tenant_id, shopify_order_id, status, customer_email, total, fulfilled_at)
                   VALUES ($1,$2,'fulfilled',$3,$4,NOW())
                   ON CONFLICT (tenant_id, shopify_order_id) DO UPDATE
                   SET status='fulfilled', fulfilled_at=NOW()""",
                tenant_id,
                str(order_id),
                order.get("email", ""),
                float(order.get("total_price", 0)),
            )

            logger.info("Shopify order %s fulfilled for tenant %s", order_id, tenant_id)
            return {
                "success": True,
                "data": {
                    "order_id": str(order_id),
                    "status": "fulfilled",
                    "tracking_number": tracking,
                    "carrier": carrier,
                    "fulfillment_id": fulfillment.get("id") if fulfillment else None,
                },
            }
        except Exception as exc:
            logger.error("ShopifyFulfillment failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


shopify_fulfillment = ShopifyFulfillmentAgent()
