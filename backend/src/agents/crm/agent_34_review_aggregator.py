"""
Agente #34: Review Aggregator
Responsabilidad: Agregar y analizar reseñas de clientes de múltiples canales
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"get_summary", "get_recent", "get_alerts", "get_by_product"}
VALID_CHANNELS = {"mercadolibre", "amazon", "shopify", "google", "all"}


class Agent34ReviewAggregator:
    """
    Review Aggregator — Consolida y analiza reseñas de todos los canales.

    Input:
        {
            "action":    str  — get_summary | get_recent | get_alerts | get_by_product
            "channel":   str  — mercadolibre | amazon | shopify | google | all
            "sku":       str  — (opcional)
            "tenant_id": str
        }
    Output:
        { "action", "channel", "avg_rating", "reviews": [...], "sentiment", "alerts", "source" }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #34 - Review Aggregator"

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
        action = data.get("action", "get_summary")
        if action not in VALID_ACTIONS:
            action = "get_summary"
        channel = data.get("channel", "all")
        if channel not in VALID_CHANNELS:
            channel = "all"
        return {
            "action": action,
            "channel": channel,
            "sku": data.get("sku"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        try:
            from src.utils.database import db
            rows = await db.fetch_all(
                """SELECT channel, rating, comment, sku, created_at
                   FROM product_reviews
                   WHERE tenant_id=$1::uuid
                   ORDER BY created_at DESC LIMIT 30""",
                tenant_id,
            )
            if rows:
                return self._build_result(data["action"], data["channel"], [dict(r) for r in rows])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(data["action"], data["channel"])

    def _build_result(self, action: str, channel: str, reviews: List[Dict]) -> Dict:
        if channel != "all":
            reviews = [r for r in reviews if r.get("channel") == channel]

        avg_rating = sum(float(r.get("rating", 0)) for r in reviews) / max(len(reviews), 1)
        low_reviews = [r for r in reviews if float(r.get("rating", 5)) <= 3]
        alerts = []
        if avg_rating < 4.0:
            alerts.append({"type": "warning", "message": f"Calificación promedio {avg_rating:.1f} — por debajo del objetivo 4.5"})
        if low_reviews:
            alerts.append({"type": "high", "message": f"{len(low_reviews)} reseñas negativas (≤3 estrellas) pendientes de respuesta"})

        return {
            "action": action, "channel": channel,
            "total_reviews": len(reviews),
            "avg_rating": round(avg_rating, 2),
            "reviews": reviews[:10],
            "sentiment": "positive" if avg_rating >= 4.0 else ("neutral" if avg_rating >= 3.0 else "negative"),
            "alerts": alerts,
            "source": "database",
        }

    def _mock_result(self, action: str, channel: str) -> Dict:
        return {
            "action": action, "channel": channel,
            "total_reviews": 284,
            "avg_rating": 4.3,
            "rating_distribution": {"5": 148, "4": 82, "3": 31, "2": 14, "1": 9},
            "reviews": [
                {"channel": "mercadolibre", "rating": 5, "comment": "Excelente producto, llegó antes de lo esperado.", "sku": "TAL-850W", "date": "2026-05-24"},
                {"channel": "mercadolibre", "rating": 2, "comment": "El empaque llegó dañado, el producto funciona pero decepcionante.", "sku": "BRC-SET-PRO", "date": "2026-05-23"},
                {"channel": "amazon",       "rating": 5, "comment": "Muy buena relación calidad-precio.", "sku": "TAL-850W", "date": "2026-05-22"},
                {"channel": "shopify",      "rating": 4, "comment": "Buen producto, envío un poco lento.", "sku": "AMO-115-850", "date": "2026-05-21"},
                {"channel": "google",       "rating": 1, "comment": "Pésimo servicio al cliente, no resolvieron mi problema.", "sku": None, "date": "2026-05-20"},
            ],
            "sentiment": "positive",
            "top_issues": ["Empaque dañado (8 menciones)", "Tiempo de envío (5 menciones)", "Servicio al cliente (3 menciones)"],
            "alerts": [
                {"type": "high", "message": "23 reseñas negativas (≤3 estrellas) sin respuesta en 7 días"},
                {"type": "info", "message": "'Empaque dañado' — tema recurrente en 8 reseñas este mes"},
            ],
            "source": "mock_data",
        }
