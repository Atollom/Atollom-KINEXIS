"""Agent #19 — NPS Collector"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


def _classify(score: int) -> str:
    if score >= 9:
        return "promoter"
    if score >= 7:
        return "passive"
    return "detractor"


def _sentiment(score: int, comment: str) -> str:
    comment = (comment or "").lower()
    negative = any(w in comment for w in ["malo", "terrible", "pésimo", "nunca", "lento", "error", "falla"])
    if score >= 9 and not negative:
        return "positive"
    if score <= 6 or negative:
        return "negative"
    return "neutral"


class NPSCollectorAgent:
    name = "NPS Collector #19"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        customer_id = data.get("customer_id")
        score = data.get("score")

        if not tenant_id or score is None:
            return {"success": False, "error": "tenant_id and score required", "data": {}}

        try:
            score = int(score)
            if not 0 <= score <= 10:
                return {"success": False, "error": "score must be 0-10", "data": {}}

            category = _classify(score)
            comment = data.get("feedback", data.get("comment", ""))
            sentiment = _sentiment(score, comment)

            await db.execute(
                """INSERT INTO nps_surveys
                   (tenant_id, customer_id, score, promoter_type, comment, sentiment,
                    customer_contact, order_id, status, sent_at, responded_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'responded',NOW(),NOW())""",
                tenant_id,
                str(customer_id) if customer_id else None,
                score,
                category,
                comment,
                sentiment,
                data.get("contact", str(customer_id) if customer_id else ""),
                data.get("order_id"),
            )

            return {
                "success": True,
                "data": {
                    "score": score,
                    "category": category,
                    "sentiment": sentiment,
                    "follow_up_needed": category == "detractor",
                    "suggested_action": (
                        "Contactar inmediatamente para resolver" if category == "detractor"
                        else "Solicitar reseña en Google/Trustpilot" if category == "promoter"
                        else "Monitorear en próxima compra"
                    ),
                },
            }
        except Exception as exc:
            logger.error("NPSCollector failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


nps_collector = NPSCollectorAgent()
