"""
Agente #3: Shopify Fulfillment
Responsabilidad: Cumplir órdenes Shopify automáticamente
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

REQUIRED_ADDRESS_FIELDS = {"name", "address", "city", "zip"}


class Agent03ShopifyFulfillment:
    """
    Shopify Fulfillment — Cumplimiento automático de órdenes Shopify.

    Flujo:
      1. Valida orden y stock     → Agent #5 (Inventory)
      2. Genera guía de envío    → Agent #25 (Shipping)
      3. Actualiza Shopify Order → Shopify GraphQL Admin API
      4. Notifica cliente        → WhatsApp / email

    Input:
        {
            "order_id":        str   — ID Shopify (SH-XXXXXX)
            "items":           list  — [{sku, quantity}]
            "shipping_address": dict — {name, address, city, zip}
        }

    Output:
        {
            "order_id":       str
            "fulfillment_id": str
            "status":         str   — fulfilled | partial | failed
            "tracking_number": str
        }
    """

    REQUIRED_FIELDS = ["order_id", "items", "shipping_address"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #3 - Shopify Fulfillment"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa el fulfillment de una orden Shopify."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} processed order {validated['order_id']}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
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

        order_id = str(data["order_id"]).strip()
        if not order_id:
            raise ValueError("order_id cannot be empty")

        items = data["items"]
        if not isinstance(items, list) or len(items) == 0:
            raise ValueError("items must be a non-empty list")

        for i, item in enumerate(items):
            if "sku" not in item:
                raise ValueError(f"items[{i}] missing sku")
            if "quantity" not in item or int(item["quantity"]) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")

        addr = data["shipping_address"]
        if not isinstance(addr, dict):
            raise ValueError("shipping_address must be a dict")
        missing_addr = REQUIRED_ADDRESS_FIELDS - set(addr.keys())
        if missing_addr:
            raise ValueError(f"shipping_address missing fields: {missing_addr}")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import shopify
        order = shopify.Order.find(data["order_id"])
        fulfillment = shopify.Fulfillment.create({"order_id": order.id, ...})
        """
        return {
            "order_id": data["order_id"],
            "fulfillment_id": None,
            "status": "queued_for_fulfillment",
            "tracking_number": None,
            "items_count": len(data["items"]),
            "note": "Shopify GraphQL API integration pending — Fase 2",
        }


shopify_fulfillment = Agent03ShopifyFulfillment()
