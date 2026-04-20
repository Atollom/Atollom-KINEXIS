"""
Agente #2: Amazon FBA Manager
Responsabilidad: Gestionar inventario y envíos Amazon FBA
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"sync_inventory", "create_shipment", "get_status"}
VALID_WAREHOUSES = {"amazon_fba_us", "amazon_fba_mx", "amazon_fba_eu", "amazon_fba_ca"}


class Agent02AmazonFBA:
    """
    Amazon FBA Manager — Gestión de inventario Fulfillment by Amazon.

    Acciones:
      sync_inventory  → Sincroniza stock local con FBA
      create_shipment → Crea inbound shipment a Amazon
      get_status      → Consulta estado de shipment existente

    Input:
        {
            "action":    str   — sync_inventory | create_shipment | get_status
            "sku":       str   — SKU del producto
            "quantity":  int   — Unidades (requerido para sync/create)
            "warehouse": str   — ID de warehouse FBA
        }

    Output:
        {
            "fba_shipment_id":   str   — ID de shipment FBA
            "status":            str   — working | checked_in | closed
            "estimated_arrival": str   — ISO date
        }
    """

    REQUIRED_FIELDS = ["action", "sku", "warehouse"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #2 - Amazon FBA"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta la acción FBA solicitada."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} [{validated['action']}] sku={validated['sku']}")
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

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        sku = str(data["sku"]).strip()
        if not sku:
            raise ValueError("sku cannot be empty")
        data["sku"] = sku

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

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import amazon_sp_api
        client = amazon_sp_api.FBAInboundApi(credentials=...)
        """
        action = data["action"]
        estimated = (datetime.now(timezone.utc) + timedelta(days=10)).date().isoformat()

        if action == "sync_inventory":
            return {
                "action": "sync_inventory",
                "sku": data["sku"],
                "quantity_synced": data.get("quantity", 0),
                "warehouse": data["warehouse"],
                "status": "synced",
                "note": "Amazon SP-API integration pending — Fase 2",
            }
        elif action == "create_shipment":
            return {
                "action": "create_shipment",
                "fba_shipment_id": None,
                "sku": data["sku"],
                "quantity": data.get("quantity", 0),
                "warehouse": data["warehouse"],
                "status": "pending_creation",
                "estimated_arrival": estimated,
                "note": "Amazon SP-API integration pending — Fase 2",
            }
        else:  # get_status
            return {
                "action": "get_status",
                "sku": data["sku"],
                "warehouse": data["warehouse"],
                "status": "unknown",
                "note": "Amazon SP-API integration pending — Fase 2",
            }


amazon_fba = Agent02AmazonFBA()
