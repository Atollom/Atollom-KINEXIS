"""
Agente #17: Cash Flow Projector
Responsabilidad: Proyección de flujo de caja a 30/60/90 días
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_HORIZONS = {30, 60, 90}


class Agent17CashflowProjector:
    """
    Cashflow Projector — Proyección de flujo de caja basada en histórico.

    Input:
        {
            "horizon_days": int   — 30 | 60 | 90
            "tenant_id":    str
            "include_scenarios": bool  — optimista/base/pesimista
        }
    Output:
        { "horizon_days", "projection": {...}, "scenarios", "alerts", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #17 - Cashflow Projector"

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
        horizon = int(data.get("horizon_days", 30))
        if horizon not in VALID_HORIZONS:
            horizon = 30
        return {
            "horizon_days": horizon,
            "tenant_id": str(data.get("tenant_id", "")),
            "include_scenarios": bool(data.get("include_scenarios", True)),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        horizon   = data["horizon_days"]

        try:
            from src.utils.database import db
            rows = await db.fetch_all(
                """SELECT DATE_TRUNC('week', created_at) AS week,
                          SUM(total) AS revenue, COUNT(*) AS orders
                   FROM orders
                   WHERE tenant_id=$1::uuid AND created_at > NOW() - INTERVAL '90 days'
                   GROUP BY 1 ORDER BY 1 DESC LIMIT 12""",
                tenant_id,
            )
            if rows:
                weekly_avg = sum(float(r["revenue"]) for r in rows) / len(rows) if rows else 0
                return self._build_projection(horizon, weekly_avg, data["include_scenarios"])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_projection(horizon, data["include_scenarios"])

    def _build_projection(self, horizon: int, weekly_avg: float, scenarios: bool) -> Dict:
        weeks  = horizon // 7
        base   = weekly_avg * weeks
        income = round(base, 2)
        # Estimate expenses at 60% of income (COGS + ops)
        expenses = round(base * 0.60, 2)
        net      = round(income - expenses, 2)

        result = {
            "horizon_days": horizon,
            "projection": {
                "projected_income":   income,
                "projected_expenses": expenses,
                "projected_net":      net,
                "weekly_avg_revenue": round(weekly_avg, 2),
            },
            "alerts": [] if net > 0 else [{"type": "critical", "message": "Flujo de caja proyectado negativo"}],
            "source": "database",
        }
        if scenarios:
            result["scenarios"] = {
                "optimistic": {"income": round(income * 1.2, 2), "net": round(net + income * 0.2, 2)},
                "base":       {"income": income,               "net": net},
                "pessimistic":{"income": round(income * 0.8, 2), "net": round(net - income * 0.2, 2)},
            }
        return result

    def _mock_projection(self, horizon: int, scenarios: bool) -> Dict:
        factor = horizon / 30
        result = {
            "horizon_days": horizon,
            "projection": {
                "projected_income":   round(145000.0 * factor, 2),
                "projected_expenses": round(87000.0 * factor, 2),
                "projected_net":      round(58000.0 * factor, 2),
                "weekly_avg_revenue": 36250.0,
            },
            "alerts": [{"type": "info", "message": f"Proyección positiva para {horizon} días — flujo estimado ${58000.0 * factor:,.0f} MXN"}],
            "source": "mock_data",
        }
        if scenarios:
            base = 145000.0 * factor
            net  = 58000.0 * factor
            result["scenarios"] = {
                "optimistic": {"income": round(base * 1.2, 2), "net": round(net + base * 0.2, 2)},
                "base":       {"income": round(base, 2),       "net": round(net, 2)},
                "pessimistic":{"income": round(base * 0.8, 2), "net": round(net - base * 0.2, 2)},
            }
        return result
