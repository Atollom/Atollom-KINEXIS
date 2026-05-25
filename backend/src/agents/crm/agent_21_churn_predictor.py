"""
Agente #21: Churn Predictor
Responsabilidad: Predecir probabilidad de abandono de clientes
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class Agent21ChurnPredictor:
    """
    Churn Predictor — Identifica clientes en riesgo de abandono.

    Input:
        {
            "days_threshold": int  — días sin compra para considerar en riesgo (default 60)
            "tenant_id":      str
        }
    Output:
        { "at_risk": [...], "churn_rate_pct", "alerts", "recommended_actions", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #21 - Churn Predictor"

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
        threshold = int(data.get("days_threshold", 60))
        return {
            "days_threshold": max(14, min(180, threshold)),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        threshold = data["days_threshold"]
        try:
            from src.utils.database import db
            rows = await db.fetch_all(
                """SELECT customer_id, COUNT(*) AS orders,
                          SUM(total) AS lifetime_value,
                          MAX(created_at) AS last_order,
                          NOW() - MAX(created_at) AS days_since
                   FROM orders
                   WHERE tenant_id=$1::uuid
                   GROUP BY customer_id
                   HAVING NOW() - MAX(created_at) > ($2 || ' days')::INTERVAL
                   ORDER BY lifetime_value DESC LIMIT 50""",
                tenant_id, str(threshold),
            )
            if rows:
                return self._build_result(threshold, [dict(r) for r in rows])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(threshold)

    def _build_result(self, threshold: int, at_risk: List[Dict]) -> Dict:
        def _risk_level(days) -> str:
            if isinstance(days, timedelta):
                days = days.days
            if days > 120:
                return "critical"
            if days > 90:
                return "high"
            return "medium"

        enriched = []
        for r in at_risk[:20]:
            days_val = r.get("days_since")
            days_int = days_val.days if isinstance(days_val, timedelta) else threshold
            enriched.append({
                "customer_id": r["customer_id"],
                "lifetime_value": float(r.get("lifetime_value", 0)),
                "orders": r["orders"],
                "days_inactive": days_int,
                "risk_level": _risk_level(days_int),
            })

        total_at_risk = len(at_risk)
        alerts = []
        if total_at_risk > 10:
            total_ltv = sum(float(r.get("lifetime_value", 0)) for r in at_risk)
            alerts.append({"type": "high", "message": f"{total_at_risk} clientes en riesgo — ${total_ltv:,.0f} MXN de LTV en peligro"})

        return {
            "days_threshold": threshold,
            "at_risk_count": total_at_risk,
            "at_risk": enriched,
            "alerts": alerts,
            "recommended_actions": [
                "Campaña de reactivación con descuento 15% para clientes de alto LTV",
                "Email automatizado con productos relacionados a compras previas",
                "Llamada de seguimiento para clientes con LTV > $10,000 MXN",
            ],
            "source": "database",
        }

    def _mock_result(self, threshold: int) -> Dict:
        return {
            "days_threshold": threshold,
            "at_risk_count": 43,
            "churn_rate_pct": 10.8,
            "at_risk": [
                {"customer_id": "cust-089", "lifetime_value": 18500.0, "orders": 12, "days_inactive": 78, "risk_level": "high"},
                {"customer_id": "cust-124", "lifetime_value": 12300.0, "orders": 8,  "days_inactive": 95, "risk_level": "critical"},
                {"customer_id": "cust-203", "lifetime_value": 9800.0,  "orders": 6,  "days_inactive": 67, "risk_level": "medium"},
                {"customer_id": "cust-317", "lifetime_value": 7400.0,  "orders": 5,  "days_inactive": 110,"risk_level": "critical"},
                {"customer_id": "cust-412", "lifetime_value": 5600.0,  "orders": 4,  "days_inactive": 72, "risk_level": "high"},
            ],
            "alerts": [
                {"type": "high", "message": "43 clientes sin compras en 60+ días — $380,000 MXN de LTV en riesgo"},
                {"type": "info", "message": "Tasa de churn mensual estimada: 10.8% — benchmark industria: 8%"},
            ],
            "recommended_actions": [
                "Campaña de reactivación con descuento 15% para los 10 clientes de mayor LTV",
                "Email automatizado con 'Te extrañamos' + productos relacionados",
                "Llamada de seguimiento para clientes con LTV > $10,000 MXN",
            ],
            "source": "mock_data",
        }
