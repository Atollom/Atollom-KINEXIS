"""
Agente #20: Customer Segmentation
Responsabilidad: Segmentar clientes por valor, comportamiento y frecuencia de compra
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_MODELS = {"rfm", "value", "behavior", "all"}


class Agent20CustomerSegmentation:
    """
    Customer Segmentation — Clasifica clientes por RFM y valor de negocio.

    Input:
        {
            "model":     str  — rfm | value | behavior | all
            "tenant_id": str
        }
    Output:
        { "model", "segments": [...], "summary", "top_customers", "source" }
    """

    REQUIRED_FIELDS = ["tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #20 - Customer Segmentation"

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
        model = data.get("model", "rfm")
        if model not in VALID_MODELS:
            model = "rfm"
        return {
            "model": model,
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        try:
            from src.utils.database import db
            rows = await db.fetch_all(
                """SELECT customer_id, COUNT(*) AS orders,
                          SUM(total) AS revenue,
                          MAX(created_at) AS last_order
                   FROM orders
                   WHERE tenant_id=$1::uuid
                   GROUP BY customer_id
                   ORDER BY revenue DESC LIMIT 100""",
                tenant_id,
            )
            if rows:
                return self._build_segments(data["model"], [dict(r) for r in rows])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(data["model"])

    def _build_segments(self, model: str, customers: List[Dict]) -> Dict:
        total = len(customers)
        top_20 = int(total * 0.2) or 1
        champions = customers[:top_20]
        at_risk = customers[top_20: top_20 * 3]
        dormant = customers[top_20 * 3:]

        return {
            "model": model,
            "segments": [
                {"name": "Champions", "count": len(champions),
                 "pct": round(len(champions) / total * 100, 1),
                 "avg_revenue": round(sum(float(c.get("revenue", 0)) for c in champions) / max(len(champions), 1), 2)},
                {"name": "At Risk", "count": len(at_risk),
                 "pct": round(len(at_risk) / total * 100, 1),
                 "avg_revenue": round(sum(float(c.get("revenue", 0)) for c in at_risk) / max(len(at_risk), 1), 2)},
                {"name": "Dormant", "count": len(dormant),
                 "pct": round(len(dormant) / total * 100, 1),
                 "avg_revenue": round(sum(float(c.get("revenue", 0)) for c in dormant) / max(len(dormant), 1), 2)},
            ],
            "summary": {"total_customers": total, "model_used": model},
            "top_customers": [
                {"customer_id": c["customer_id"], "orders": c["orders"],
                 "revenue": float(c["revenue"])} for c in champions[:5]
            ],
            "source": "database",
        }

    def _mock_result(self, model: str) -> Dict:
        return {
            "model": model,
            "segments": [
                {"name": "Champions",  "count": 48,  "pct": 12.0, "avg_revenue": 8420.0,  "description": "Alta frecuencia, alta recencia, alto valor"},
                {"name": "Loyal",      "count": 112, "pct": 28.0, "avg_revenue": 3850.0,  "description": "Compran regularmente, buen LTV"},
                {"name": "At Risk",    "count": 96,  "pct": 24.0, "avg_revenue": 2100.0,  "description": "Sin compras en 60+ días"},
                {"name": "Dormant",    "count": 80,  "pct": 20.0, "avg_revenue": 980.0,   "description": "Sin actividad en 90+ días"},
                {"name": "New",        "count": 64,  "pct": 16.0, "avg_revenue": 1200.0,  "description": "Primera compra reciente"},
            ],
            "summary": {
                "total_customers": 400,
                "model_used": model,
                "champions_revenue_share_pct": 52.0,
                "at_risk_recoverable_mxn": 201600.0,
            },
            "top_customers": [
                {"customer_id": "cust-001", "orders": 28, "revenue": 42500.0, "segment": "Champions"},
                {"customer_id": "cust-002", "orders": 21, "revenue": 38200.0, "segment": "Champions"},
                {"customer_id": "cust-003", "orders": 19, "revenue": 31000.0, "segment": "Champions"},
            ],
            "source": "mock_data",
        }
