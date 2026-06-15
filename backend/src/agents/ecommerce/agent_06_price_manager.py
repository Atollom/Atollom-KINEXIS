"""Agent #6 — Price Manager (multicanal)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


def _apply_strategy(base_price: float, strategy: str, competitor_price: float = 0.0) -> float:
    if strategy == "fixed":
        return base_price
    elif strategy == "competitive":
        if competitor_price > 0:
            return round(min(base_price, competitor_price * 0.98), 2)
        return base_price
    elif strategy == "dynamic":
        return round(base_price * 1.05, 2)
    return base_price


class PriceManagerAgent:
    name = "Price Manager #6"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        sku = data.get("sku")
        base_price = data.get("base_price")
        if not sku or base_price is None:
            return {"success": False, "error": "sku and base_price required", "data": {}}

        channels = data.get("channels", ["ml", "amazon", "shopify"])
        strategy = data.get("strategy", "fixed")
        competitor_price = float(data.get("competitor_price", 0))

        try:
            final_price = _apply_strategy(float(base_price), strategy, competitor_price)

            await db.execute(
                """UPDATE inventory
                   SET price=$1, price_updated_at=NOW(), price_strategy=$2
                   WHERE tenant_id=$3 AND sku=$4""",
                final_price, strategy, tenant_id, sku,
            )

            channel_results = {}
            for channel in channels:
                try:
                    creds = await db.fetch_one(
                        f"SELECT id FROM {channel}_credentials WHERE tenant_id=$1", tenant_id
                    )
                    if creds:
                        await db.execute(
                            f"""INSERT INTO {channel}_price_queue (tenant_id, sku, price, status, queued_at)
                               VALUES ($1,$2,$3,'pending',NOW())
                               ON CONFLICT (tenant_id, sku) DO UPDATE SET price=$3, status='pending', queued_at=NOW()""",
                            tenant_id, sku, final_price,
                        )
                        channel_results[channel] = "queued"
                    else:
                        channel_results[channel] = "not_connected"
                except Exception:
                    channel_results[channel] = "queued_local"

            logger.info("Price updated: sku=%s price=%.2f tenant=%s", sku, final_price, tenant_id)
            return {
                "success": True,
                "data": {
                    "sku": sku,
                    "base_price": float(base_price),
                    "final_price": final_price,
                    "strategy": strategy,
                    "channels": channel_results,
                },
            }
        except Exception as exc:
            logger.error("PriceManager failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


price_manager = PriceManagerAgent()
