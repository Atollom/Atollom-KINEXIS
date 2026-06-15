"""Agent #1 — MercadoLibre Fulfillment"""
import logging
from src.integrations.mercadolibre_integration import MercadoLibreIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)


async def _get_ml_client(tenant_id: str):
    creds = await db.fetch_one(
        "SELECT access_token, refresh_token, ml_user_id FROM ml_credentials WHERE tenant_id=$1",
        tenant_id,
    )
    if not creds:
        return None, "MercadoLibre not connected for this tenant. Complete OAuth first."
    ml = MercadoLibreIntegration()
    await ml.set_tokens(creds["access_token"], creds["refresh_token"], creds["ml_user_id"])
    return ml, None


class MLFulfillmentAgent:
    name = "ML Fulfillment #1"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        order_id = data.get("order_id")
        if not order_id:
            return {"success": False, "error": "order_id required", "data": {}}

        try:
            ml, err = await _get_ml_client(tenant_id)
            if err:
                return {"success": False, "error": err, "data": {}}

            order = await ml.get_order(str(order_id))
            if not order or order.get("error"):
                return {"success": False, "error": f"Order {order_id} not found in ML", "data": {}}

            await db.execute(
                """INSERT INTO ml_orders (tenant_id, ml_order_id, status, buyer_nickname, total, items, synced_at)
                   VALUES ($1,$2,'paid',$3,$4,$5::jsonb,NOW())
                   ON CONFLICT (tenant_id, ml_order_id) DO UPDATE
                   SET status='paid', synced_at=NOW()""",
                tenant_id,
                str(order_id),
                order.get("buyer", {}).get("nickname", ""),
                float(order.get("total_amount", 0)),
                __import__("json").dumps(order.get("order_items", [])),
            )

            logger.info("ML order %s synced for tenant %s", order_id, tenant_id)
            return {
                "success": True,
                "data": {
                    "order_id": str(order_id),
                    "status": "synced",
                    "buyer": order.get("buyer", {}).get("nickname"),
                    "total": order.get("total_amount"),
                    "items": order.get("order_items", []),
                    "shipping_id": order.get("shipping", {}).get("id"),
                },
            }
        except Exception as exc:
            logger.error("MLFulfillment failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


ml_fulfillment = MLFulfillmentAgent()
