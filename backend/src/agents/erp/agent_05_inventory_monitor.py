"""
Agente #5: Inventory Monitor
Responsabilidad: Alertar stock bajo y sugerir reorden automático
Autor: Carlos Cortés (Atollom Labs)
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

CRITICAL_PCT = 0.25

VALID_ACTIONS = {"check_stock", "get_alerts", "suggest_reorder"}

MOCK_INVENTORY: Dict[str, Dict[str, Any]] = {
    "SKU-001": {"current": 4,   "minimum": 20, "reorder_qty": 150, "warehouse": "principal"},
    "SKU-002": {"current": 15,  "minimum": 20, "reorder_qty": 100, "warehouse": "principal"},
    "SKU-003": {"current": 50,  "minimum": 20, "reorder_qty": 80,  "warehouse": "principal"},
    "SKU-004": {"current": 0,   "minimum": 10, "reorder_qty": 50,  "warehouse": "secundario"},
    "SKU-005": {"current": 100, "minimum": 30, "reorder_qty": 120, "warehouse": "principal"},
}


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

    Fuente de datos: tabla `inventory` en Supabase (asyncpg).
    Fallback: MOCK_INVENTORY si la BD no está disponible o sin datos.

    Input:
        {
            "action":    str  — check_stock | get_alerts | suggest_reorder
            "tenant_id": str  — (requerido para aislamiento multi-tenant)
            "sku":       str  — (opcional) SKU específico
            "warehouse": str  — (opcional) filtrar por almacén
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #5 - Inventory Monitor"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                "%s action=%s alerts=%s source=%s",
                self.name, validated["action"],
                result.get("total_alerts", result.get("total_items", 0)),
                result.get("source", "unknown"),
            )
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
        if "sku" in data:
            sku = str(data["sku"]).strip().upper()
            if not sku:
                raise ValueError("sku cannot be empty")
            data["sku"] = sku
        return data

    def _build_alert(self, sku: str, current: int, minimum: int, reorder_qty: int, warehouse: str) -> Dict[str, Any]:
        status = _classify_status(current, minimum)
        return {
            "sku": sku,
            "current_stock": current,
            "minimum_stock": minimum,
            "warehouse": warehouse,
            "status": status,
            "suggestion": f"order_{reorder_qty}_units" if status != "ok" else None,
        }

    async def _fetch_from_supabase(self, tenant_id: Optional[str], sku: Optional[str], warehouse: Optional[str]) -> List[Dict[str, Any]]:
        from src.utils.database import db

        where_clauses = []
        params: list = []
        idx = 1

        if tenant_id:
            where_clauses.append(f"tenant_id = ${idx}")
            params.append(tenant_id)
            idx += 1
        if sku:
            where_clauses.append(f"UPPER(sku) = ${idx}")
            params.append(sku.upper())
            idx += 1
        if warehouse:
            where_clauses.append(f"LOWER(warehouse) = ${idx}")
            params.append(warehouse.lower())
            idx += 1

        where = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        rows = await db.fetch_all(
            f"""
            SELECT
                sku,
                COALESCE(quantity, stock_quantity, 0)      AS current,
                COALESCE(minimum_stock, reorder_point, 10) AS minimum,
                COALESCE(reorder_quantity, 50)             AS reorder_qty,
                COALESCE(warehouse, warehouse_id, 'principal') AS warehouse
            FROM inventory
            {where}
            ORDER BY sku
            """,
            *params,
        )
        return [dict(r) for r in rows] if rows else []

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data["action"]
        sku = data.get("sku")
        warehouse = data.get("warehouse")
        tenant_id = data.get("tenant_id")

        # Try real Supabase data
        inventory_rows: List[Dict[str, Any]] = []
        source = "mock"
        try:
            rows = await self._fetch_from_supabase(tenant_id, sku, warehouse)
            if rows:
                inventory_rows = rows
                source = "supabase"
        except Exception as db_err:
            logger.warning("%s Supabase query failed (%s) — using mock data", self.name, db_err)

        # Fallback to MOCK_INVENTORY
        if not inventory_rows:
            mock = MOCK_INVENTORY
            if sku:
                if sku not in mock:
                    raise ValueError(f"SKU not found: {sku}")
                mock = {sku: mock[sku]}
            if warehouse:
                mock = {k: v for k, v in mock.items() if v["warehouse"] == warehouse}
            inventory_rows = [
                {"sku": k, "current": v["current"], "minimum": v["minimum"],
                 "reorder_qty": v["reorder_qty"], "warehouse": v["warehouse"]}
                for k, v in mock.items()
            ]

        alerts = [
            self._build_alert(
                r["sku"], int(r.get("current", 0)), int(r.get("minimum", 10)),
                int(r.get("reorder_qty", 50)), str(r.get("warehouse", "principal"))
            )
            for r in inventory_rows
        ]

        if action == "check_stock":
            return {"action": action, "items": alerts, "total_items": len(alerts), "source": source}

        elif action == "get_alerts":
            alert_items = [a for a in alerts if a["status"] != "ok"]
            return {"action": action, "alerts": alert_items, "total_alerts": len(alert_items), "source": source}

        else:  # suggest_reorder
            reorder = [a for a in alerts if a["status"] in {"critical", "out_of_stock", "low"}]
            return {"action": action, "reorder_suggestions": reorder, "total_suggestions": len(reorder), "source": source}


inventory_monitor = Agent05InventoryMonitor()
