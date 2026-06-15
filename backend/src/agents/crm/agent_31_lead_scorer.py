"""Agent #31 — Lead Scorer"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


def _compute_score(lead: dict) -> int:
    score = 30

    val = float(lead.get("estimated_value", 0))
    if val >= 500000:
        score += 35
    elif val >= 100000:
        score += 25
    elif val >= 50000:
        score += 15
    elif val >= 10000:
        score += 8

    stage_scores = {"new": 0, "contacted": 10, "qualified": 20, "quoted": 15, "negotiation": 25, "won": 30, "lost": -20}
    score += stage_scores.get(lead.get("deal_stage", "new"), 0)

    if lead.get("contact_email"):
        score += 5
    if lead.get("phone"):
        score += 5
    if lead.get("company_name"):
        score += 5

    source_scores = {"referral": 15, "linkedin": 10, "web_form": 5, "whatsapp": 8}
    score += source_scores.get(lead.get("source", ""), 3)

    return max(0, min(score, 100))


class LeadScorerAgent:
    name = "Lead Scorer #31"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        lead_data = data.get("lead_data", {})
        lead_id = lead_data.get("id") or data.get("lead_id")

        try:
            if lead_id and not lead_data.get("deal_stage"):
                row = await db.fetch_one(
                    "SELECT * FROM leads WHERE id=$1 AND tenant_id=$2", lead_id, tenant_id
                )
                if row:
                    lead_data = dict(row)

            score = _compute_score(lead_data)
            priority = "high" if score >= 70 else "medium" if score >= 40 else "low"
            tier = "hot" if score >= 70 else "warm" if score >= 40 else "cold"

            if lead_id:
                await db.execute(
                    "UPDATE leads SET score=$1, priority=$2 WHERE id=$3 AND tenant_id=$4",
                    score, priority, lead_id, tenant_id,
                )

            return {
                "success": True,
                "data": {
                    "lead_id": str(lead_id) if lead_id else None,
                    "score": score,
                    "priority": priority,
                    "tier": tier,
                    "recommended_action": (
                        "Contactar hoy — lead caliente" if tier == "hot"
                        else "Nutrir y hacer seguimiento en 3 días" if tier == "warm"
                        else "Secuencia de email automatizada"
                    ),
                },
            }
        except Exception as exc:
            logger.error("LeadScorer failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


lead_scorer = LeadScorerAgent()
