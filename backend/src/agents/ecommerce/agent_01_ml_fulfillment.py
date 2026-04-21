"""
Agente #1: ML Fulfillment
Responsabilidad: Cumplir órdenes de Mercado Libre automáticamente
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class Agent01MLFulfillment:
    """
    ML Fulfillment — Cumplimiento automático de órdenes Mercado Libre.

    Orquesta:
      1. Verifica stock            → Agent #5 (Inventory)
      2. Genera guía de envío     → Agent #25 (Shipping)
      3. Actualiza status en ML   → ML API
      4. Notifica comprador       → WhatsApp Agent

    Input:
        {
            "order_id":        str   — ID de la orden ML
            "tenant_id":       str
            "items":           list  — [{sku, qty}]
            "shipping_address": dict
        }

    Output:
        {
            "success":          bool
            "order_id":         str
            "tracking_number":  str
            "carrier":          str
            "estimated_delivery": str  — ISO date
        }
    """

    REQUIRED_FIELDS = ["order_id", "tenant_id", "items", "shipping_address"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #1 - ML Fulfillment"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa el fulfillment de una orden ML."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} executed successfully for order {validated['order_id']}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        if not isinstance(data["items"], list) or len(data["items"]) == 0:
            raise ValueError("items must be a non-empty list")
        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = data["order_id"]

        # Try real ML API when credentials are available
        try:
            from src.integrations import ml_integration
            if ml_integration._access_token or ml_integration.test_access_token:
                orders = await ml_integration.get_orders(status="paid")
                order = next(
                    (o for o in orders if str(o.get("id")) == str(order_id)), None
                )
                if order:
                    logger.info(f"{self.name} fetched real order {order_id} from ML API")
                    return {
                        "order_id": order_id,
                        "order_data": order,
                        "status": "processing",
                        "total": order.get("total_amount"),
                        "buyer": order.get("buyer", {}).get("nickname"),
                        "tracking_number": None,
                        "carrier": None,
                        "estimated_delivery": None,
                        "note": "Shipping dispatch pending — Fase 2",
                    }
        except Exception as e:
            logger.warning(f"{self.name} ML API unavailable, using mock: {e}")

        # Mock fallback — no credentials or order not found in API
        return {
            "order_id": order_id,
            "status": "queued_for_fulfillment",
            "tracking_number": None,
            "carrier": None,
            "estimated_delivery": None,
            "note": "Integration pending — Fase 2",
        }


ml_fulfillment = Agent01MLFulfillment()
