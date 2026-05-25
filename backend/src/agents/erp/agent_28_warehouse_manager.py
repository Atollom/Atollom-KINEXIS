"""
Agente #28: Warehouse Manager
Responsabilidad: Gestión de ubicaciones, movimientos y recepción de almacén
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"get_layout", "check_location", "log_movement", "get_movements", "get_capacity"}
VALID_MOVEMENT_TYPES = {"inbound", "outbound", "transfer", "adjustment"}


class Agent28WarehouseManager:
    """
    Warehouse Manager — Trazabilidad de movimientos y ubicaciones en almacén.

    Input:
        {
            "action":      str  — get_layout | check_location | log_movement | get_movements
            "sku":         str  — (opcional)
            "location":    str  — (opcional) zona/pasillo/posición
            "movement":    dict — (para log_movement) {sku, qty, type, location}
            "tenant_id":   str
        }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #28 - Warehouse Manager"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data.get("action", "get_layout")
        if action not in VALID_ACTIONS:
            action = "get_layout"
        return {
            "action": action,
            "sku": data.get("sku"),
            "location": data.get("location"),
            "movement": data.get("movement"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action    = data["action"]
        tenant_id = data["tenant_id"]

        if action == "get_movements":
            try:
                from src.utils.database import db
                rows = await db.fetch_all(
                    """SELECT sku, quantity, movement_type, location, created_at
                       FROM inventory_movements
                       WHERE tenant_id=$1::uuid ORDER BY created_at DESC LIMIT 20""",
                    tenant_id,
                )
                if rows:
                    return {"action": action, "movements": [dict(r) for r in rows], "source": "database"}
            except Exception as exc:
                logger.warning("%s DB failed: %s", self.name, exc)

        return self._mock_result(action, data.get("sku"), data.get("location"))

    def _mock_result(self, action: str, sku: Optional[str], location: Optional[str]) -> Dict:
        if action == "get_layout":
            return {
                "action": action,
                "zones": [
                    {"zone": "A", "description": "Herramienta eléctrica",  "locations": 24, "occupied": 18, "capacity_pct": 75},
                    {"zone": "B", "description": "Herramienta manual",     "locations": 16, "occupied": 12, "capacity_pct": 75},
                    {"zone": "C", "description": "Accesorios y consumibles","locations": 32, "occupied": 20, "capacity_pct": 62},
                ],
                "total_capacity_pct": 71,
                "source": "mock_data",
            }
        elif action == "get_movements":
            return {
                "action": action,
                "movements": [
                    {"sku": "TAL-003", "quantity": 10, "type": "inbound",  "location": "A-03", "date": "2026-05-24"},
                    {"sku": "BRC-013", "quantity": -5, "type": "outbound", "location": "C-07", "date": "2026-05-24"},
                    {"sku": "AMO-045", "quantity": 8,  "type": "inbound",  "location": "A-05", "date": "2026-05-23"},
                ],
                "source": "mock_data",
            }
        else:
            return {
                "action": action,
                "sku": sku, "location": location or "A-01",
                "stock_at_location": 12,
                "last_movement": "2026-05-24T10:30:00Z",
                "source": "mock_data",
            }
