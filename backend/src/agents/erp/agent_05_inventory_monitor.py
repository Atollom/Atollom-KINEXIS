"""
Agente #5: Inventory Monitor
Responsabilidad: Alertar stock bajo y sugerir reorden automático
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# Niveles de stock: current < critical_pct * minimum → "critical"
CRITICAL_PCT = 0.25

# Inventario mock — Fase 2: fetch from Supabase
MOCK_INVENTORY: Dict[str, Dict[str, Any]] = {
    "SKU-001": {"current": 4,   "minimum": 20, "reorder_qty": 150, "warehouse": "principal"},
    "SKU-002": {"current": 15,  "minimum": 20, "reorder_qty": 100, "warehouse": "principal"},
    "SKU-003": {"current": 50,  "minimum": 20, "reorder_qty": 80,  "warehouse": "principal"},
    "SKU-004": {"current": 0,   "minimum": 10, "reorder_qty": 50,  "warehouse": "secundario"},
    "SKU-005": {"current": 100, "minimum": 30, "reorder_qty": 120, "warehouse": "principal"},
}

VALID_ACTIONS = {"check_stock", "get_alerts", "suggest_reorder"}


def _classify_status(current: int, minimum: int) -> str:
    if current == 0:
        return "out_of_stock"
    if current < minimum * CRITICAL_PCT:
        return "critical"
    if current < minimum:
        return "low"
    return "ok"


class Agent05InventoryMonitor:
    """
    Inventory Monitor — Alertas de stock bajo y sugerencias de reorden.

    Acciones:
      check_stock    → Verifica nivel de un SKU específico o todos
      get_alerts     → Retorna SKUs en estado critical/low/out_of_stock
      suggest_reorder → Genera sugerencias de compra para SKUs críticos

    Input:
        {
            "action":    str  — check_stock | get_alerts | suggest_reorder
            "sku":       str  — (opcional) SKU específico
            "warehouse": str  — (opcional) filtrar por almacén
        }

    Output:
        {
            "action":       str
            "alerts":       list — [{sku, current_stock, minimum_stock, status, suggestion}]
            "total_alerts": int
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #5 - Inventory Monitor"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verifica stock y genera alertas/sugerencias."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} action={validated['action']} alerts={result.get('total_alerts', 0)}"
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

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        if "sku" in data:
            sku = str(data["sku"]).strip().upper()
            if not sku:
                raise ValueError("sku cannot be empty")
            data["sku"] = sku

        return data

    def _build_alert(self, sku: str, info: Dict[str, Any]) -> Dict[str, Any]:
        status = _classify_status(info["current"], info["minimum"])
        suggestion = None
        if status in {"critical", "out_of_stock", "low"}:
            suggestion = f"order_{info['reorder_qty']}_units"
        return {
            "sku": sku,
            "current_stock": info["current"],
            "minimum_stock": info["minimum"],
            "warehouse": info["warehouse"],
            "status": status,
            "suggestion": suggestion,
        }

    def _get_inventory(self, sku: Optional[str], warehouse: Optional[str]) -> Dict[str, Dict]:
        inventory = MOCK_INVENTORY
        if sku:
            if sku not in inventory:
                raise ValueError(f"SKU not found: {sku}")
            inventory = {sku: inventory[sku]}
        if warehouse:
            inventory = {k: v for k, v in inventory.items() if v["warehouse"] == warehouse}
        return inventory

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Fetch real inventory from Supabase (table: inventory_items)
        - Filter by tenant_id + warehouse
        - Push critical alerts to notification queue
        """
        action = data["action"]
        sku = data.get("sku")
        warehouse = data.get("warehouse")
        inventory = self._get_inventory(sku, warehouse)
        alerts = [self._build_alert(k, v) for k, v in inventory.items()]

        if action == "check_stock":
            return {
                "action": action,
                "items": alerts,
                "total_items": len(alerts),
                "note": "Supabase inventory integration pending — Fase 2",
            }

        elif action == "get_alerts":
            alert_items = [a for a in alerts if a["status"] != "ok"]
            return {
                "action": action,
                "alerts": alert_items,
                "total_alerts": len(alert_items),
                "note": "Supabase inventory integration pending — Fase 2",
            }

        else:  # suggest_reorder
            reorder = [a for a in alerts if a["status"] in {"critical", "out_of_stock", "low"}]
            return {
                "action": action,
                "reorder_suggestions": reorder,
                "total_suggestions": len(reorder),
                "note": "Purchase order auto-creation pending — Fase 2",
            }


inventory_monitor = Agent05InventoryMonitor()
