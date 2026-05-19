"""
Agente #14: Returns Manager
Responsabilidad: Gestionar devoluciones multicanal — persiste en Supabase
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_CHANNELS = {"mercadolibre", "amazon", "shopify"}
VALID_REASONS  = {
    "producto_defectuoso", "no_deseado", "error_envio",
    "descripcion_incorrecta", "llegó_dañado",
}

RETURN_POLICY_DAYS: Dict[str, int] = {
    "mercadolibre": 30, "amazon": 30, "shopify": 15,
}
RESTOCKING_FEE_PCT: Dict[str, float] = {
    "mercadolibre": 0.0, "amazon": 0.0, "shopify": 0.10,
}


class Agent14ReturnsManager:
    """
    Returns Manager — Gestión de devoluciones multicanal con persistencia en Supabase.

    Input:
        {
            "order_id": str, "channel": str, "reason": str,
            "items": list[{sku, quantity, unit_price}],
            "tenant_id": str (opcional), "order_date": str (opcional)
        }
    """

    REQUIRED_FIELDS = ["order_id", "channel", "reason", "items"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #14 - Returns Manager"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s return=%s order=%s channel=%s status=%s",
                        self.name, result.get("return_id"), validated["order_id"],
                        validated["channel"], result.get("status"))
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                raise ValueError(f"Missing required field: {f}")
        if data["channel"] not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel. Valid: {VALID_CHANNELS}")
        if data["reason"] not in VALID_REASONS:
            raise ValueError(f"Invalid reason. Valid: {VALID_REASONS}")
        items = data["items"]
        if not isinstance(items, list) or not items:
            raise ValueError("items must be non-empty list")
        for i, item in enumerate(items):
            if "sku" not in item:
                raise ValueError(f"items[{i}] missing sku")
            if int(item.get("quantity", 0)) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
        return data

    def _calculate_refund(self, items: list, channel: str, reason: str) -> tuple[float, float]:
        gross = sum(float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items)
        fee_pct = RESTOCKING_FEE_PCT.get(channel, 0.0)
        restocking = round(gross * fee_pct, 2) if reason == "no_deseado" else 0.0
        return round(gross - restocking, 2), restocking

    async def _persist(self, ret: Dict, tenant_id: Optional[str]) -> str:
        from src.utils.database import db
        import json
        try:
            row = await db.fetch_one(
                """
                INSERT INTO returns
                    (tenant_id, order_id, channel, reason, items,
                     refund_amount, restocking_fee, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, 'authorized', NOW(), NOW())
                RETURNING id
                """,
                tenant_id,
                ret["order_id"],
                ret["channel"],
                ret["reason"],
                json.dumps(ret["items"]),
                ret["refund_amount"],
                ret["restocking_fee"],
            )
            if row:
                return f"RET-{str(row['id'])[:8].upper()}"
        except Exception as e:
            logger.warning("%s DB persist failed: %s", self.name, e)
        # Fallback ID
        import hashlib
        key = f"{ret['order_id']}{ret['channel']}{datetime.now(timezone.utc).isoformat()}"
        return "RET-" + hashlib.sha256(key.encode()).hexdigest()[:8].upper()

    async def _request_return_label(self, ret: Dict) -> Optional[str]:
        """Requests return shipping label from Agent #25 Skydropx."""
        try:
            from src.agents.erp.agent_25_skydrop_shipping import skydrop_shipping
            result = await skydrop_shipping.execute({
                "action":       "create_label",
                "order_id":     ret["order_id"],
                "origin":       {"name": "Cliente", "city": "México"},
                "destination":  {"name": "KINEXIS Almacén", "city": "México"},
                "package":      {"weight": 1.0, "length": 20, "width": 15, "height": 10},
            })
            if result.get("success"):
                return result.get("data", {}).get("label_url")
        except Exception as e:
            logger.warning("%s label request failed: %s", self.name, e)
        return None

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        channel    = data["channel"]
        reason     = data["reason"]
        items      = data["items"]
        tenant_id  = data.get("tenant_id")
        policy_days = RETURN_POLICY_DAYS[channel]
        net_refund, restocking_fee = self._calculate_refund(items, channel, reason)

        ret = {
            "order_id":      data["order_id"],
            "channel":       channel,
            "reason":        reason,
            "items":         items,
            "items_count":   len(items),
            "status":        "authorized",
            "refund_amount": net_refund,
            "restocking_fee": restocking_fee,
            "policy":        f"{policy_days}_days",
        }

        return_id        = await self._persist(ret, tenant_id)
        return_label_url = await self._request_return_label(ret)

        ret["return_id"]        = return_id
        ret["return_label_url"] = return_label_url
        return ret


returns_manager = Agent14ReturnsManager()
