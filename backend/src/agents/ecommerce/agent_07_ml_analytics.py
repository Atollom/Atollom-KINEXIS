"""
Agente #7: MercadoLibre Analytics
Responsabilidad: Métricas de ventas, productos top y tendencias en ML
"""

import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_PERIODS  = {"today", "week", "month", "quarter"}
VALID_METRICS  = {"sales", "visits", "conversion", "top_products", "revenue"}

PERIOD_DAYS = {"today": 1, "week": 7, "month": 30, "quarter": 90}

# Mock baseline por día (se multiplica por período)
_MOCK_DAILY = {
    "orders": 3.2,
    "revenue": 4850.0,
    "visits": 420.0,
    "questions_answered": 1.8,
}


class Agent07MLAnalytics:
    """
    ML Analytics — Dashboard de métricas para MercadoLibre.

    Input:
        {
            "period":    str  — today | week | month | quarter
            "tenant_id": str  — UUID del tenant
            "metrics":   list — ["sales","visits","conversion","top_products","revenue"]
        }
    Output:
        {
            "period", "days", "metrics": {sales, revenue, visits, conversion_rate,
            top_products, questions}, "alerts", "source"
        }
    """

    REQUIRED_FIELDS = ["period", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #7 - ML Analytics"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s period=%s source=%s", self.name, validated["period"], result.get("source"))
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
        period = data.get("period", "month")
        if period not in VALID_PERIODS:
            period = "month"
        return {
            "period": period,
            "tenant_id": str(data["tenant_id"]),
            "metrics": data.get("metrics", list(VALID_METRICS)),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        period = data["period"]
        tenant_id = data["tenant_id"]

        # Try real ML API via stored credentials
        try:
            from src.utils.database import db
            creds = await db.fetch_one(
                "SELECT access_token, ml_user_id FROM ml_credentials WHERE tenant_id=$1::uuid",
                tenant_id,
            )
            if creds and creds.get("access_token"):
                return await self._fetch_ml_metrics(creds["access_token"], creds["ml_user_id"], period)
        except Exception as exc:
            logger.warning("%s real-data fetch failed: %s — using mock", self.name, exc)

        return self._mock_metrics(period)

    async def _fetch_ml_metrics(self, token: str, ml_user_id: str, period: str) -> Dict[str, Any]:
        import httpx
        days = PERIOD_DAYS[period]
        date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT00:00:00.000-00:00")

        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=12) as client:
            orders_resp = await client.get(
                f"https://api.mercadolibre.com/orders/search",
                params={"seller": ml_user_id, "order.date_created.from": date_from, "limit": 50},
                headers=headers,
            )

        if orders_resp.status_code != 200:
            return self._mock_metrics(period)

        orders = orders_resp.json().get("results", [])
        total_orders = len(orders)
        total_revenue = sum(float(o.get("total_amount", 0)) for o in orders)

        # Top products from order items
        product_counts: Dict[str, int] = {}
        for o in orders:
            for item in o.get("order_items", []):
                title = item.get("item", {}).get("title", "Unknown")
                product_counts[title] = product_counts.get(title, 0) + item.get("quantity", 1)

        top_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "period": period,
            "days": PERIOD_DAYS[period],
            "metrics": {
                "orders": total_orders,
                "revenue": round(total_revenue, 2),
                "avg_order_value": round(total_revenue / total_orders, 2) if total_orders else 0,
                "top_products": [{"name": n, "qty": q} for n, q in top_products],
                "conversion_rate": None,  # requires visits API — not in scope
                "questions": None,
            },
            "alerts": self._generate_alerts(total_orders, total_revenue, PERIOD_DAYS[period]),
            "source": "mercadolibre_api",
        }

    def _mock_metrics(self, period: str) -> Dict[str, Any]:
        days = PERIOD_DAYS[period]
        orders = round(_MOCK_DAILY["orders"] * days)
        revenue = round(_MOCK_DAILY["revenue"] * days, 2)
        visits = round(_MOCK_DAILY["visits"] * days)
        return {
            "period": period,
            "days": days,
            "metrics": {
                "orders": orders,
                "revenue": revenue,
                "avg_order_value": round(revenue / orders, 2) if orders else 0,
                "visits": visits,
                "conversion_rate": round((orders / visits) * 100, 2) if visits else 0,
                "questions": round(_MOCK_DAILY["questions_answered"] * days),
                "top_products": [
                    {"name": "Taladro Percutor 850W (TAL-003)", "qty": round(orders * 0.3)},
                    {"name": "Broca Set 13 piezas (BRC-013)",   "qty": round(orders * 0.22)},
                    {"name": "Amoladora 4.5\" (AMO-045)",       "qty": round(orders * 0.18)},
                ],
            },
            "alerts": self._generate_alerts(orders, revenue, days),
            "source": "mock_data",
        }

    def _generate_alerts(self, orders: int, revenue: float, days: int) -> list:
        alerts = []
        daily_avg = revenue / days if days else 0
        if daily_avg < 3000:
            alerts.append({"type": "warning", "message": f"Revenue diario promedio ${daily_avg:,.0f} MXN está por debajo del objetivo ($3,000)"})
        if orders == 0:
            alerts.append({"type": "critical", "message": "Sin órdenes en el período seleccionado"})
        return alerts
