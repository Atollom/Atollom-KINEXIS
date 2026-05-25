"""
Agente #23: Customer LTV Calculator
Responsabilidad: Calcular el valor de vida del cliente y proyectar ingresos futuros
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class Agent23CustomerLTV:
    """
    Customer LTV Calculator — Calcula LTV histórico y proyectado por cliente.

    Input:
        {
            "customer_id": str  — (opcional) cliente específico; si se omite, top 20
            "projection_months": int — meses a proyectar (default 12)
            "tenant_id": str
        }
    Output:
        { "customer_id", "historical_ltv", "projected_ltv", "segment", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #23 - Customer LTV"

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
        months = int(data.get("projection_months", 12))
        return {
            "customer_id": data.get("customer_id"),
            "projection_months": max(1, min(60, months)),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        customer_id = data.get("customer_id")
        months = data["projection_months"]

        try:
            from src.utils.database import db
            if customer_id:
                row = await db.fetch_one(
                    """SELECT COUNT(*) AS orders,
                              SUM(total) AS revenue,
                              MIN(created_at) AS first_order,
                              MAX(created_at) AS last_order
                       FROM orders
                       WHERE tenant_id=$1::uuid AND customer_id=$2""",
                    tenant_id, customer_id,
                )
                if row and row["orders"]:
                    return self._build_single(customer_id, dict(row), months)
            else:
                rows = await db.fetch_all(
                    """SELECT customer_id, COUNT(*) AS orders,
                              SUM(total) AS revenue,
                              MIN(created_at) AS first_order,
                              MAX(created_at) AS last_order
                       FROM orders
                       WHERE tenant_id=$1::uuid
                       GROUP BY customer_id
                       ORDER BY revenue DESC LIMIT 20""",
                    tenant_id,
                )
                if rows:
                    return self._build_top(months, [dict(r) for r in rows])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(customer_id, months)

    def _build_single(self, customer_id: str, row: Dict, months: int) -> Dict:
        revenue = float(row.get("revenue", 0))
        orders = int(row.get("orders", 1))
        first = row.get("first_order")
        last = row.get("last_order")

        lifespan_months = 12
        if first and last and hasattr(first, "timestamp"):
            diff = (last - first).days
            lifespan_months = max(1, diff // 30)

        avg_order = revenue / orders
        purchase_freq = orders / max(lifespan_months, 1)
        projected = avg_order * purchase_freq * months

        segment = "Champion" if revenue > 30000 else ("Loyal" if revenue > 10000 else "Standard")

        return {
            "customer_id": customer_id,
            "historical_ltv": round(revenue, 2),
            "projected_ltv": round(projected, 2),
            "avg_order_value": round(avg_order, 2),
            "purchase_frequency_per_month": round(purchase_freq, 2),
            "lifespan_months": lifespan_months,
            "projection_months": months,
            "segment": segment,
            "source": "database",
        }

    def _build_top(self, months: int, customers: List[Dict]) -> Dict:
        top = []
        for r in customers:
            revenue = float(r.get("revenue", 0))
            orders = int(r.get("orders", 1))
            avg_order = revenue / orders
            top.append({
                "customer_id": r["customer_id"],
                "historical_ltv": round(revenue, 2),
                "projected_ltv": round(avg_order * (orders / 12) * months, 2),
                "orders": orders,
            })
        return {"top_customers": top, "projection_months": months, "source": "database"}

    def _mock_result(self, customer_id: Optional[str], months: int) -> Dict:
        if customer_id:
            return {
                "customer_id": customer_id,
                "historical_ltv": 38500.0,
                "projected_ltv": round(38500.0 / 18 * months, 2),
                "avg_order_value": 2800.0,
                "purchase_frequency_per_month": 0.76,
                "lifespan_months": 18,
                "projection_months": months,
                "segment": "Champion",
                "clv_tier": "platinum",
                "source": "mock_data",
            }
        return {
            "projection_months": months,
            "portfolio_total_ltv": 1842000.0,
            "projected_portfolio_ltv": round(1842000.0 / 24 * months, 2),
            "top_customers": [
                {"customer_id": "cust-001", "historical_ltv": 42500.0, "projected_ltv": round(42500.0 / 24 * months, 2), "segment": "Champion"},
                {"customer_id": "cust-002", "historical_ltv": 38200.0, "projected_ltv": round(38200.0 / 24 * months, 2), "segment": "Champion"},
                {"customer_id": "cust-003", "historical_ltv": 29800.0, "projected_ltv": round(29800.0 / 24 * months, 2), "segment": "Loyal"},
                {"customer_id": "cust-004", "historical_ltv": 22100.0, "projected_ltv": round(22100.0 / 24 * months, 2), "segment": "Loyal"},
                {"customer_id": "cust-005", "historical_ltv": 18700.0, "projected_ltv": round(18700.0 / 24 * months, 2), "segment": "Loyal"},
            ],
            "source": "mock_data",
        }
