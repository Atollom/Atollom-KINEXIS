"""
Agente #9: Shopify Analytics
Responsabilidad: Métricas de tienda Shopify — tráfico, conversión, ventas
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_PERIODS = {"today", "week", "month", "quarter"}
PERIOD_DAYS   = {"today": 1, "week": 7, "month": 30, "quarter": 90}


class Agent09ShopifyAnalytics:
    """
    Shopify Analytics — conversion funnel, abandoned carts, top products.

    Input:  { "period": str, "tenant_id": str }
    Output: { "period", "metrics": {...}, "source" }
    """

    REQUIRED_FIELDS = ["period", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #9 - Shopify Analytics"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = self._mock_metrics(validated["period"])
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        period = data.get("period", "month")
        if period not in VALID_PERIODS:
            period = "month"
        return {"period": period, "tenant_id": str(data.get("tenant_id", ""))}

    def _mock_metrics(self, period: str) -> Dict[str, Any]:
        days = PERIOD_DAYS[period]
        sessions = round(180 * days)
        orders   = round(0.9 * days)
        revenue  = round(2100.0 * days, 2)
        return {
            "period": period, "days": days,
            "metrics": {
                "sessions": sessions, "orders": orders, "revenue": revenue,
                "conversion_rate": round((orders / sessions) * 100, 2) if sessions else 0,
                "avg_order_value": round(revenue / orders, 2) if orders else 0,
                "abandoned_carts": round(sessions * 0.15),
                "new_customers_pct": 62.0,
                "top_products": [
                    {"handle": "taladro-850w",  "name": "Taladro 850W", "qty": round(orders * 0.35)},
                    {"handle": "set-brocas-13", "name": "Set Brocas 13pz", "qty": round(orders * 0.25)},
                ],
            },
            "source": "mock_data — conecta Shopify OAuth para datos reales",
        }
