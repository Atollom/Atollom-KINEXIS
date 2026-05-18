"""
Agente #6: Price Manager x3
Responsabilidad: Actualizar precios en ML, Amazon y Shopify en paralelo
Autor: Carlos Cortés (Atollom Labs)
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_CHANNELS = {"ml", "amazon", "shopify"}
VALID_STRATEGIES = {"fixed", "competitive", "dynamic"}

# Margen por canal para estrategia "competitive"
CHANNEL_MARGINS: Dict[str, float] = {
    "ml":      1.05,   # +5% por comisiones ML
    "amazon":  1.08,   # +8% por FBA fees
    "shopify": 1.00,   # precio base
}


class Agent06PriceManager:
    """
    Price Manager x3 — Actualiza precios en ML, Amazon y Shopify en paralelo.

    Input:
        {
            "sku":         str    — SKU del producto
            "base_price":  float  — Precio base MXN
            "channels":    list   — ["ml", "amazon", "shopify"]
            "strategy":    str    — fixed | competitive | dynamic
            "item_ids":    dict   — {"ml": "MLB123", "amazon": "ASIN123"} (necesario para ML/Amazon)
        }
    """

    REQUIRED_FIELDS = ["sku", "base_price", "channels"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #6 - Price Manager"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                "%s sku=%s channels=%s strategy=%s",
                self.name, validated["sku"], validated["channels"], validated["strategy"],
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        sku = str(data["sku"]).strip()
        if not sku:
            raise ValueError("sku cannot be empty")
        data["sku"] = sku

        price = float(data["base_price"])
        if price <= 0:
            raise ValueError("base_price must be > 0")
        data["base_price"] = price

        channels = data["channels"]
        if not isinstance(channels, list) or len(channels) == 0:
            raise ValueError("channels must be a non-empty list")
        invalid = set(channels) - VALID_CHANNELS
        if invalid:
            raise ValueError(f"Invalid channels: {invalid}. Valid: {VALID_CHANNELS}")
        data["channels"] = list(set(channels))

        strategy = data.get("strategy", "fixed")
        if strategy not in VALID_STRATEGIES:
            raise ValueError(f"Invalid strategy. Valid: {VALID_STRATEGIES}")
        data["strategy"] = strategy

        data.setdefault("item_ids", {})
        return data

    def _calc_price(self, base: float, channel: str, strategy: str) -> float:
        if strategy == "fixed":
            return round(base, 2)
        if strategy == "competitive":
            return round(base * CHANNEL_MARGINS.get(channel, 1.0), 2)
        # dynamic — future: use market data API
        return round(base, 2)

    # ── Per-channel API calls ─────────────────────────────────────────────────

    async def _update_shopify(self, sku: str, price: float) -> Dict[str, Any]:
        try:
            from src.integrations.shopify_integration import shopify_integration
            result = await shopify_integration.update_price_by_sku(sku, price)
            return {
                "new_price":  price,
                "old_price":  result.get("old_price"),
                "status":     result.get("status", "updated"),
            }
        except Exception as e:
            logger.warning("%s Shopify update failed: %s", self.name, e)
            return {"new_price": price, "old_price": None, "status": "api_error", "error": str(e)}

    async def _update_ml(self, item_id: Optional[str], price: float) -> Dict[str, Any]:
        if not item_id:
            return {"new_price": price, "old_price": None, "status": "skipped_no_item_id"}
        try:
            from src.integrations.mercadolibre_integration import ml_integration
            result = await ml_integration.update_item_price(item_id, price)
            return {
                "new_price": price,
                "old_price": None,
                "item_id":   item_id,
                "status":    result.get("status", "updated"),
            }
        except Exception as e:
            logger.warning("%s ML update failed: %s", self.name, e)
            return {"new_price": price, "old_price": None, "status": "api_error", "error": str(e)}

    async def _update_amazon(self, item_id: Optional[str], price: float) -> Dict[str, Any]:
        if not item_id:
            return {"new_price": price, "old_price": None, "status": "skipped_no_item_id"}
        # Amazon SP-API price update requires Listings API (Fase 3 — needs LWA tokens)
        return {
            "new_price": price,
            "old_price": None,
            "item_id":   item_id,
            "status":    "pending_sp_api_credentials",
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        base = data["base_price"]
        strategy = data["strategy"]
        channels = data["channels"]
        sku = data["sku"]
        item_ids = data.get("item_ids", {})

        # Calculate target price per channel
        prices = {ch: self._calc_price(base, ch, strategy) for ch in channels}

        # Build coroutines for requested channels
        tasks = {}
        if "shopify" in channels:
            tasks["shopify"] = self._update_shopify(sku, prices["shopify"])
        if "ml" in channels:
            tasks["ml"] = self._update_ml(item_ids.get("ml"), prices["ml"])
        if "amazon" in channels:
            tasks["amazon"] = self._update_amazon(item_ids.get("amazon"), prices["amazon"])

        # Execute in parallel
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)
        updates: Dict[str, Any] = {}
        for channel, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                updates[channel] = {"new_price": prices[channel], "status": "exception", "error": str(result)}
            elif isinstance(result, dict):
                updates[channel] = {**result, "strategy_applied": strategy}
            else:
                updates[channel] = {"new_price": prices[channel], "status": "unknown_result"}

        return {
            "sku":              sku,
            "base_price":       base,
            "strategy":         strategy,
            "channels_updated": len(updates),
            "updates":          updates,
        }


price_manager = Agent06PriceManager()
