"""
Agente #3: Shopify Fulfillment
Responsabilidad: Cumplir órdenes Shopify — verifica stock, genera guía, actualiza orden
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

REQUIRED_ADDRESS_FIELDS = {"name", "address", "city", "zip"}

SHOPIFY_URL  = os.getenv("SHOPIFY_STORE_URL", "")
SHOPIFY_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN", "")
SHOPIFY_VER  = os.getenv("SHOPIFY_API_VERSION", "2024-04")


def _shopify_headers() -> Dict[str, str]:
    return {"X-Shopify-Access-Token": SHOPIFY_TOKEN, "Content-Type": "application/json"}


class Agent03ShopifyFulfillment:
    """
    Shopify Fulfillment — Cumplimiento automático de órdenes Shopify.

    Flujo:
      1. Verifica stock disponible  → Agent #5 Inventory
      2. Genera guía de envío       → Agent #25 Skydropx
      3. Crea fulfillment en Shopify REST Admin API
      4. Retorna tracking number

    Input:
        {
            "order_id":         str   — ID Shopify numérico o "SH-XXXXXX"
            "items":            list  — [{sku, quantity}]
            "shipping_address": dict  — {name, address, city, zip}
            "tenant_id":        str   (opcional)
        }
    """

    REQUIRED_FIELDS = ["order_id", "items", "shipping_address"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #3 - Shopify Fulfillment"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s order=%s status=%s source=%s",
                        self.name, validated["order_id"],
                        result.get("status"), result.get("source"))
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
        if not str(data["order_id"]).strip():
            raise ValueError("order_id cannot be empty")
        items = data["items"]
        if not isinstance(items, list) or not items:
            raise ValueError("items must be a non-empty list")
        for i, item in enumerate(items):
            if "sku" not in item:
                raise ValueError(f"items[{i}] missing sku")
            if int(item.get("quantity", 0)) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
        addr = data["shipping_address"]
        if not isinstance(addr, dict):
            raise ValueError("shipping_address must be a dict")
        missing = REQUIRED_ADDRESS_FIELDS - set(addr.keys())
        if missing:
            raise ValueError(f"shipping_address missing: {missing}")
        return data

    async def _check_inventory(self, items: List[Dict]) -> Dict[str, bool]:
        """Returns {sku: in_stock} using Agent #5."""
        availability: Dict[str, bool] = {}
        try:
            from src.agents.erp.agent_05_inventory_monitor import inventory_monitor
            for item in items:
                sku = item["sku"]
                res = await inventory_monitor.execute(
                    {"action": "check_stock", "sku": sku, "tenant_id": "shopify"}
                )
                stock_items = res.get("data", {}).get("items", [])
                available = any(
                    i.get("status") not in ("out_of_stock",) for i in stock_items
                )
                availability[sku] = available
        except Exception as e:
            logger.warning("%s inventory check failed: %s", self.name, e)
            availability = {item["sku"]: True for item in items}
        return availability

    async def _get_shipping_label(self, order_id: str, address: Dict) -> Optional[str]:
        """Generates shipping label via Agent #25 Skydropx."""
        try:
            from src.agents.erp.agent_25_skydrop_shipping import skydrop_shipping
            res = await skydrop_shipping.execute({
                "action":      "create_label",
                "order_id":    order_id,
                "origin":      {"name": "KINEXIS Almacén", "city": "México"},
                "destination": address,
                "package":     {"weight": 1.0, "length": 20, "width": 15, "height": 10},
            })
            if res.get("success"):
                return res.get("data", {}).get("tracking_number")
        except Exception as e:
            logger.warning("%s shipping label failed: %s", self.name, e)
        return None

    async def _create_shopify_fulfillment(self, order_id: str, tracking: Optional[str]) -> Optional[str]:
        """Calls Shopify REST Admin API to mark order as fulfilled."""
        if not SHOPIFY_URL or not SHOPIFY_TOKEN:
            return None
        numeric_id = order_id.replace("SH-", "").lstrip("0") or order_id
        url = f"https://{SHOPIFY_URL}/admin/api/{SHOPIFY_VER}/orders/{numeric_id}/fulfillments.json"
        payload: Dict = {"fulfillment": {"notify_customer": True}}
        if tracking:
            payload["fulfillment"]["tracking_number"] = tracking
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, headers=_shopify_headers(), json=payload)
            if resp.status_code in (200, 201):
                fulfillment = resp.json().get("fulfillment", {})
                return str(fulfillment.get("id", ""))
            logger.warning("%s Shopify fulfillment API %s: %s",
                           self.name, resp.status_code, resp.text[:200])
        except Exception as e:
            logger.warning("%s Shopify API call failed: %s", self.name, e)
        return None

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = data["order_id"]
        items    = data["items"]
        address  = data["shipping_address"]

        # 1 — Inventory check
        availability = await self._check_inventory(items)
        unavailable  = [sku for sku, ok in availability.items() if not ok]
        if unavailable:
            return {
                "order_id":    order_id,
                "status":      "partial",
                "unavailable_skus": unavailable,
                "fulfillment_id":   None,
                "tracking_number":  None,
                "source":           "inventory_check",
            }

        # 2 — Shipping label
        tracking = await self._get_shipping_label(order_id, address)

        # 3 — Shopify fulfillment
        fulfillment_id = await self._create_shopify_fulfillment(order_id, tracking)
        source = "shopify_api" if fulfillment_id else "sandbox"

        return {
            "order_id":       order_id,
            "fulfillment_id": fulfillment_id,
            "status":         "fulfilled" if fulfillment_id else "queued_for_fulfillment",
            "tracking_number": tracking,
            "items_count":    len(items),
            "source":         source,
        }


shopify_fulfillment = Agent03ShopifyFulfillment()
