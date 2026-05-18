"""
Agente #2: Amazon FBA Manager
Responsabilidad: Gestionar inventario y envíos Amazon FBA
Autor: Carlos Cortés (Atollom Labs)
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

VALID_ACTIONS    = {"sync_inventory", "create_shipment", "get_status", "get_orders"}
VALID_WAREHOUSES = {"amazon_fba_us", "amazon_fba_mx", "amazon_fba_eu", "amazon_fba_ca"}

# Realistic sandbox orders for demos
SANDBOX_ORDERS: List[Dict[str, Any]] = [
    {
        "order_id":        "FBA-001-2026",
        "amazon_order_id": "112-7857104-1234567",
        "status":          "shipped",
        "items": [
            {"sku": "TALADRO-800W", "name": "Taladro Eléctrico 800W Percutor", "quantity": 2, "price": 1299.00},
        ],
        "total":  2598.00,
        "customer": {"name": "Cliente Amazon", "city": "Ciudad de México"},
        "tracking": {
            "carrier":            "Amazon Logistics",
            "tracking_number":    "TBA123456789MEX",
            "estimated_delivery": (datetime.now(timezone.utc) + timedelta(days=2)).date().isoformat(),
        },
        "fulfillment_center": "MEX3",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "order_id":        "FBA-002-2026",
        "amazon_order_id": "113-9876543-7654321",
        "status":          "pending",
        "items": [
            {"sku": "SET-BROCAS-12", "name": "Set Brocas Profesional 12 piezas", "quantity": 5, "price": 489.00},
            {"sku": "BROCA-CONC-10", "name": "Broca Concreto 10mm",               "quantity": 10, "price": 89.00},
        ],
        "total":  3335.00,
        "customer": {"name": "Cliente Amazon", "city": "Guadalajara"},
        "fulfillment_center": "MEX3",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "order_id":        "FBA-003-2026",
        "amazon_order_id": "114-1122334-9876543",
        "status":          "delivered",
        "items": [
            {"sku": "COMPRESOR-50L", "name": "Compresor Portátil 50L 2HP", "quantity": 1, "price": 4599.00},
        ],
        "total":  4599.00,
        "customer": {"name": "Cliente Amazon", "city": "Monterrey"},
        "tracking": {
            "carrier":            "Amazon Logistics",
            "tracking_number":    "TBA987654321MEX",
            "estimated_delivery": (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat(),
        },
        "fulfillment_center": "MTY1",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
    },
]


class Agent02AmazonFBA:
    """
    Amazon FBA Manager — Inventario y envíos FBA.

    Acciones:
      get_orders      → Lista órdenes FBA (sandbox o SP-API real)
      sync_inventory  → Sincroniza stock local con FBA
      create_shipment → Crea inbound shipment a Amazon
      get_status      → Consulta estado de shipment existente

    Input:
        {
            "action":    str  — get_orders | sync_inventory | create_shipment | get_status
            "sku":       str  — SKU del producto (requerido excepto get_orders)
            "quantity":  int  — Unidades (requerido para sync/create)
            "warehouse": str  — ID de warehouse FBA (requerido excepto get_orders)
            "limit":     int  — Max órdenes (para get_orders, default 50)
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #2 - Amazon FBA"
        self.environment = os.getenv("ENVIRONMENT", "sandbox")
        logger.info("%s initialized (env=%s)", self.name, self.environment)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s [%s] sku=%s", self.name, validated["action"], validated.get("sku", "—"))
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

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        if data["action"] != "get_orders":
            if "sku" not in data:
                raise ValueError("sku required for this action")
            sku = str(data["sku"]).strip()
            if not sku:
                raise ValueError("sku cannot be empty")
            data["sku"] = sku

            if "warehouse" not in data:
                raise ValueError("warehouse required for this action")
            if data["warehouse"] not in VALID_WAREHOUSES:
                raise ValueError(f"Invalid warehouse. Valid: {VALID_WAREHOUSES}")

            if data["action"] in {"sync_inventory", "create_shipment"}:
                qty = data.get("quantity")
                if qty is None:
                    raise ValueError(f"quantity required for action '{data['action']}'")
                if int(qty) <= 0:
                    raise ValueError("quantity must be > 0")
                data["quantity"] = int(qty)

        return data

    async def _get_orders_sp_api(self, limit: int) -> Optional[List[Dict[str, Any]]]:
        """Try Amazon SP-API real orders. Returns None if credentials missing."""
        try:
            from src.integrations.amazon_integration import amazon_integration
            since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00Z")
            orders = await amazon_integration.get_orders(created_after=since)
            if orders:
                return orders[:limit]
        except Exception as e:
            logger.warning("%s SP-API orders failed: %s", self.name, e)
        return None

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action    = data["action"]
        estimated = (datetime.now(timezone.utc) + timedelta(days=10)).date().isoformat()

        if action == "get_orders":
            limit = int(data.get("limit", 50))

            # Try real SP-API first
            real_orders = await self._get_orders_sp_api(limit)
            if real_orders is not None:
                return {
                    "action": "get_orders",
                    "orders": real_orders[:limit],
                    "count":  len(real_orders[:limit]),
                    "source": "sp_api",
                }

            # Sandbox fallback
            return {
                "action": "get_orders",
                "orders": SANDBOX_ORDERS[:limit],
                "count":  len(SANDBOX_ORDERS),
                "source": "sandbox",
            }

        elif action == "sync_inventory":
            return {
                "action":          "sync_inventory",
                "sku":             data["sku"],
                "quantity_synced": data["quantity"],
                "warehouse":       data["warehouse"],
                "status":          "synced",
                "source":          "sandbox",
                "note":            "SP-API Feeds inventory update available in Frente B",
            }

        elif action == "create_shipment":
            return {
                "action":           "create_shipment",
                "fba_shipment_id":  f"FBA-SHIP-{data['sku']}-{datetime.now(timezone.utc).strftime('%Y%m%d')}",
                "sku":              data["sku"],
                "quantity":         data["quantity"],
                "warehouse":        data["warehouse"],
                "status":           "working",
                "estimated_arrival": estimated,
                "source":           "sandbox",
                "note":             "SP-API Listings Feed integration ready in Frente B",
            }

        else:  # get_status
            return {
                "action":    "get_status",
                "sku":       data["sku"],
                "warehouse": data["warehouse"],
                "status":    "working",
                "source":    "sandbox",
            }


amazon_fba = Agent02AmazonFBA()
