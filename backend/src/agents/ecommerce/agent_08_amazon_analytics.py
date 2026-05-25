"""
Agente #8: Amazon Analytics
Responsabilidad: Métricas de ventas FBA, Buy Box y performance en Amazon
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_PERIODS = {"today", "week", "month", "quarter"}
PERIOD_DAYS   = {"today": 1, "week": 7, "month": 30, "quarter": 90}


class Agent08AmazonAnalytics:
    """
    Amazon Analytics — FBA metrics, Buy Box %, session data.

    Input:  { "period": str, "tenant_id": str }
    Output: { "period", "metrics": {...}, "alerts", "source" }
    """

    REQUIRED_FIELDS = ["period", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #8 - Amazon Analytics"

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
        orders   = round(1.8 * days)
        revenue  = round(3200.0 * days, 2)
        sessions = round(280 * days)
        return {
            "period": period, "days": days,
            "metrics": {
                "orders": orders, "revenue": revenue,
                "avg_order_value": round(revenue / orders, 2) if orders else 0,
                "sessions": sessions,
                "buy_box_pct": 72.4,
                "fba_units_sold": round(orders * 1.3),
                "return_rate_pct": 3.1,
                "top_products": [
                    {"asin": "B0XXXXXX01", "name": "Taladro Inalámbrico 20V", "qty": round(orders * 0.4)},
                    {"asin": "B0XXXXXX02", "name": "Set Llaves Mixtas 12pz",  "qty": round(orders * 0.3)},
                ],
            },
            "alerts": [] if orders > 10 else [{"type": "warning", "message": "Pocas ventas en Amazon este período"}],
            "source": "mock_data — conecta SP-API para datos reales",
        }
