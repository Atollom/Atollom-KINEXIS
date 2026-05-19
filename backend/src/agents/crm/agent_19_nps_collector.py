"""
Agente #19: NPS Collector
Responsabilidad: Registrar NPS en Supabase y disparar follow-up para detractores
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

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
    if score >= 9:
        return "promoter", "positive"
    elif score >= 7:
        return "passive", "neutral"
    return "detractor", "negative"


def _analyze_sentiment(feedback: str) -> str:
    if not feedback:
        return "neutral"
    words = set(feedback.lower().split())
    pos = words & POSITIVE_KEYWORDS
    neg = words & NEGATIVE_KEYWORDS
    if len(pos) > len(neg):
        return "positive"
    elif len(neg) > len(pos):
        return "negative"
    return "neutral"


def _response_days(sent_at: Optional[str], responded_at: Optional[str]) -> Optional[int]:
    if not sent_at or not responded_at:
        return None
    try:
        s = datetime.fromisoformat(sent_at.replace("Z", "+00:00"))
        r = datetime.fromisoformat(responded_at.replace("Z", "+00:00"))
        return max(0, (r - s).days)
    except (ValueError, TypeError):
        return None


class Agent19NPSCollector:
    """
    NPS Collector — Registra respuestas NPS y dispara follow-up para detractores.

    Input:
        {
            "customer_id": str, "order_id": str, "score": int (0-10),
            "feedback": str (opcional), "tenant_id": str (opcional),
            "customer_email": str (opcional), "customer_name": str (opcional),
            "survey_sent_at": str (opcional), "responded_at": str (opcional)
        }
    """

    REQUIRED_FIELDS = ["customer_id", "order_id", "score"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #19 - NPS Collector"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s customer=%s score=%s category=%s",
                        self.name, validated["customer_id"],
                        validated["score"], result.get("category"))
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
        score = data["score"]
        if not isinstance(score, int) or not (0 <= score <= 10):
            raise ValueError("score must be an integer between 0 and 10")
        return data

    async def _persist(self, record: Dict, tenant_id: Optional[str]) -> None:
        from src.utils.database import db
        try:
            await db.execute(
                """
                INSERT INTO nps_responses
                    (tenant_id, customer_id, order_id, score, category,
                     sentiment, feedback, response_time_days, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                ON CONFLICT (customer_id, order_id) DO UPDATE SET
                    score = EXCLUDED.score, category = EXCLUDED.category,
                    sentiment = EXCLUDED.sentiment, feedback = EXCLUDED.feedback
                """,
                tenant_id,
                record["customer_id"],
                record["order_id"],
                record["nps_score"],
                record["category"],
                record["sentiment"],
                record.get("feedback", ""),
                record.get("response_time_days"),
            )
        except Exception as e:
            logger.warning("%s DB persist failed: %s", self.name, e)

    async def _trigger_followup(self, data: Dict, category: str) -> Dict:
        if category != "detractor":
            return {"triggered": False, "reason": f"category={category}"}
        customer_email = str(data.get("customer_email", "")).strip()
        if not customer_email:
            return {"triggered": False, "reason": "no customer_email provided"}
        try:
            from src.agents.crm.agent_33_follow_up import follow_up
            result = await follow_up.execute({
                "lead_id":    data["customer_id"],
                "lead_name":  data.get("customer_name", "estimado cliente"),
                "email":      customer_email,
                "days_inactive": 1,
                "stage":      "interested",
                "channel":    "email",
            })
            return {"triggered": True, "follow_up_result": result.get("success")}
        except Exception as e:
            logger.warning("%s follow-up trigger failed: %s", self.name, e)
            return {"triggered": False, "reason": str(e)}

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        score     = data["score"]
        feedback  = data.get("feedback", "")
        tenant_id = data.get("tenant_id")
        category, default_sentiment = _classify_nps(score)
        sentiment = _analyze_sentiment(feedback) if feedback else default_sentiment
        resp_days = _response_days(data.get("survey_sent_at"), data.get("responded_at"))

        record = {
            "customer_id":        data["customer_id"],
            "order_id":           data["order_id"],
            "nps_score":          score,
            "category":           category,
            "sentiment":          sentiment,
            "feedback":           feedback,
            "response_time_days": resp_days,
            "action_required":    "follow_up_detractor" if category == "detractor" else None,
            "stored_at":          datetime.now(timezone.utc).isoformat(),
        }

        await self._persist(record, tenant_id)
        record["follow_up"] = await self._trigger_followup(data, category)
        return record


nps_collector = Agent19NPSCollector()
