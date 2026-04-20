"""
ERP Router
Responsabilidad: Orquestar los 7 agentes ERP según intención
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import time
import logging
from typing import Dict, Any, List, Tuple

from src.agents.erp.agent_05_inventory_monitor import inventory_monitor
from src.agents.erp.agent_13_cfdi_billing import cfdi_billing
from src.agents.erp.agent_16_supplier_evaluator import supplier_evaluator
from src.agents.erp.agent_18_finance_snapshot import finance_snapshot
from src.agents.erp.agent_24_thermal_printer import thermal_printer
from src.agents.erp.agent_25_skydrop_shipping import skydrop_shipping
from src.agents.erp.agent_30_purchase_orders import purchase_orders

logger = logging.getLogger(__name__)

VALID_INTENTS = {
    "check_inventory", "generate_cfdi", "evaluate_supplier",
    "get_finance_snapshot", "print_label", "create_shipment", "create_po",
}

_AGENT_MAP = {
    "check_inventory":     inventory_monitor,
    "generate_cfdi":       cfdi_billing,
    "evaluate_supplier":   supplier_evaluator,
    "get_finance_snapshot": finance_snapshot,
    "print_label":         thermal_printer,
    "create_shipment":     skydrop_shipping,
    "create_po":           purchase_orders,
}


class ERPRouter:
    """
    ERP Router — Enrutamiento a agentes de inventario, facturación y logística.

    Intenciones soportadas:
      check_inventory      → inventory_monitor   (#5)
      generate_cfdi        → cfdi_billing        (#13)
      evaluate_supplier    → supplier_evaluator  (#16)
      get_finance_snapshot → finance_snapshot    (#18)
      print_label          → thermal_printer     (#24)
      create_shipment      → skydrop_shipping    (#25)
      create_po            → purchase_orders     (#30)
    """

    def __init__(self) -> None:
        self.name = "ERP Router"
        logger.info(f"{self.name} initialized")

    async def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Enruta request al agente ERP correcto."""
        start = time.time()
        try:
            intent = request.get("intent", "")
            if not intent:
                raise ValueError("Missing intent")
            if intent not in VALID_INTENTS:
                raise ValueError(f"Unknown intent: {intent}. Valid: {VALID_INTENTS}")

            data = self._build_data(request)
            agent = _AGENT_MAP[intent]
            r = await agent.execute(data)
            ms = round((time.time() - start) * 1000, 2)

            if not r.get("success"):
                return {
                    "success": False,
                    "router": self.name,
                    "intent": intent,
                    "agents_called": [agent.name],
                    "error": r.get("error", "Agent execution failed"),
                    "execution_time_ms": ms,
                }

            return {
                "success": True,
                "router": self.name,
                "intent": intent,
                "agents_called": [agent.name],
                "result": r.get("data", {}),
                "execution_time_ms": ms,
            }
        except Exception as e:
            logger.error(f"{self.name} routing failed: {e}")
            return {
                "success": False,
                "router": self.name,
                "error": str(e),
                "execution_time_ms": round((time.time() - start) * 1000, 2),
            }

    def _build_data(self, request: Dict[str, Any]) -> Dict[str, Any]:
        data = dict(request.get("data", {}))
        if "tenant_id" in request:
            data.setdefault("tenant_id", request["tenant_id"])
        return data


erp_router = ERPRouter()
