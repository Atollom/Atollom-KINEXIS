"""
Agente #14: Returns Manager
Responsabilidad: Gestionar devoluciones multicanal (ML, Amazon, Shopify)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_CHANNELS = {"mercadolibre", "amazon", "shopify"}
VALID_REASONS = {
    "producto_defectuoso",
    "no_deseado",
    "error_envio",
    "descripcion_incorrecta",
    "llegó_dañado",
}

# Política de devolución por canal (días)
RETURN_POLICY_DAYS: Dict[str, int] = {
    "mercadolibre": 30,
    "amazon": 30,
    "shopify": 15,
}

# Cargo por restock cuando razón es "no_deseado" (%)
RESTOCKING_FEE_PCT: Dict[str, float] = {
    "mercadolibre": 0.0,
    "amazon": 0.0,
    "shopify": 0.10,  # 10% restocking en Shopify
}


class Agent14ReturnsManager:
    """
    Returns Manager — Gestión de devoluciones multicanal.

    Flujo:
      1. Valida política de devolución del canal
      2. Calcula monto de reembolso (con/sin restocking fee)
      3. Genera etiqueta de retorno
      4. Actualiza inventario   → Agent #5 (Inventory)
      5. Procesa reembolso      → Stripe / canal

    Input:
        {
            "order_id":  str   — ID de la orden original
            "channel":   str   — mercadolibre | amazon | shopify
            "reason":    str   — motivo de devolución
            "items":     list  — [{sku, quantity, unit_price}]
            "order_date": str  — ISO date de la orden (YYYY-MM-DD)
        }

    Output:
        {
            "return_id":       str
            "status":          str   — authorized | rejected | pending
            "refund_amount":   float
            "restocking_fee":  float
            "return_label_url": str
            "policy":          str   — "X_days"
        }
    """

    REQUIRED_FIELDS = ["order_id", "channel", "reason", "items"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #14 - Returns Manager"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Procesa una solicitud de devolución."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} return {result.get('status')} "
                f"order={validated['order_id']} channel={validated['channel']}"
            )
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

        if data["channel"] not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel. Valid: {VALID_CHANNELS}")

        if data["reason"] not in VALID_REASONS:
            raise ValueError(f"Invalid reason. Valid: {VALID_REASONS}")

        items = data["items"]
        if not isinstance(items, list) or len(items) == 0:
            raise ValueError("items must be non-empty list")

        for i, item in enumerate(items):
            if "sku" not in item:
                raise ValueError(f"items[{i}] missing sku")
            qty = item.get("quantity", 0)
            if int(qty) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")

        return data

    def _calculate_refund(
        self, items: list, channel: str, reason: str
    ) -> tuple[float, float]:
        """Returns (gross_amount, restocking_fee)."""
        gross = sum(
            float(item.get("unit_price", 0)) * int(item.get("quantity", 1))
            for item in items
        )
        fee_pct = RESTOCKING_FEE_PCT.get(channel, 0.0)
        # Restocking fee solo si razón es "no_deseado"
        restocking_fee = round(gross * fee_pct, 2) if reason == "no_deseado" else 0.0
        net_refund = round(gross - restocking_fee, 2)
        return net_refund, restocking_fee

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Check order date vs policy window
        - Generate return label via Skydropx
        - Process refund via Stripe / canal API
        - Notify Agent #5 to update inventory
        """
        channel = data["channel"]
        reason = data["reason"]
        items = data["items"]
        policy_days = RETURN_POLICY_DAYS[channel]
        net_refund, restocking_fee = self._calculate_refund(items, channel, reason)

        return {
            "return_id": None,  # Will be assigned by system
            "order_id": data["order_id"],
            "channel": channel,
            "status": "authorized",
            "refund_amount": net_refund,
            "restocking_fee": restocking_fee,
            "return_label_url": None,  # Pending Skydropx integration
            "policy": f"{policy_days}_days",
            "items_count": len(items),
            "note": "Label & refund API integration pending — Fase 2",
        }


returns_manager = Agent14ReturnsManager()
