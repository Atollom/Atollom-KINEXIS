"""
Agente #19: NPS Collector
Responsabilidad: Medir satisfacción (NPS) post-venta automáticamente
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

POSITIVE_KEYWORDS = {
    "excelente", "perfecto", "increíble", "rápido", "puntual", "recomiendo",
    "encantado", "feliz", "satisfecho", "bueno", "genial", "gracias",
}
NEGATIVE_KEYWORDS = {
    "malo", "pésimo", "tardo", "retraso", "daño", "roto", "decepcionado",
    "molesto", "queja", "problema", "falla", "tardó", "tarde", "error",
}


def _classify_nps(score: int) -> tuple[str, str]:
    """Returns (category, sentiment)."""
    if score >= 9:
        return "promoter", "positive"
    elif score >= 7:
        return "passive", "neutral"
    else:
        return "detractor", "negative"


def _analyze_sentiment(feedback: str) -> str:
    if not feedback:
        return "neutral"
    words = set(feedback.lower().split())
    pos_hits = words & POSITIVE_KEYWORDS
    neg_hits = words & NEGATIVE_KEYWORDS
    if len(pos_hits) > len(neg_hits):
        return "positive"
    elif len(neg_hits) > len(pos_hits):
        return "negative"
    return "neutral"


def _calculate_response_days(survey_sent_at: Optional[str], responded_at: Optional[str]) -> Optional[int]:
    if not survey_sent_at or not responded_at:
        return None
    try:
        sent = datetime.fromisoformat(survey_sent_at.replace("Z", "+00:00"))
        responded = datetime.fromisoformat(responded_at.replace("Z", "+00:00"))
        delta = responded - sent
        return max(0, delta.days)
    except (ValueError, TypeError):
        return None


class Agent19NPSCollector:
    """
    NPS Collector — Recolección y análisis de Net Promoter Score post-venta.

    Clasificación NPS:
      Promotor   (9-10) → cliente satisfecho, candidato a referido
      Pasivo     (7-8)  → neutral, oportunidad de mejora
      Detractor  (0-6)  → insatisfecho, requiere seguimiento urgente

    Input:
        {
            "customer_id":    str  — ID del cliente
            "order_id":       str  — ID de la orden
            "score":          int  — 0 a 10
            "feedback":       str  — (opcional) comentario libre
            "survey_sent_at": str  — (opcional) ISO timestamp envío
            "responded_at":   str  — (opcional) ISO timestamp respuesta
        }

    Output:
        {
            "customer_id":     str
            "order_id":        str
            "nps_score":       int
            "category":        str  — promoter | passive | detractor
            "sentiment":       str  — positive | neutral | negative
            "response_time_days": int | None
            "action_required": str | None
            "stored_at":       str
        }
    """

    REQUIRED_FIELDS = ["customer_id", "order_id", "score"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #19 - NPS Collector"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra y analiza respuesta NPS."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} customer={validated['customer_id']} "
                f"score={validated['score']} category={result.get('category')}"
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
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

        score = data["score"]
        if not isinstance(score, int) or not (0 <= score <= 10):
            raise ValueError("score must be an integer between 0 and 10")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Persist NPS response to Supabase (table: nps_responses)
        - Trigger Agent #33 Follow-up for detractors
        - Update customer health score
        - Aggregate NPS metrics by period
        """
        score = data["score"]
        feedback = data.get("feedback", "")
        category, default_sentiment = _classify_nps(score)
        feedback_sentiment = _analyze_sentiment(feedback) if feedback else default_sentiment
        response_days = _calculate_response_days(
            data.get("survey_sent_at"), data.get("responded_at")
        )
        action_required = "follow_up_detractor" if category == "detractor" else None

        return {
            "customer_id": data["customer_id"],
            "order_id": data["order_id"],
            "nps_score": score,
            "category": category,
            "sentiment": feedback_sentiment,
            "feedback": feedback,
            "response_time_days": response_days,
            "action_required": action_required,
            "stored_at": datetime.now(timezone.utc).isoformat(),
            "note": "Supabase NPS persistence & follow-up trigger pending — Fase 2",
        }


nps_collector = Agent19NPSCollector()
