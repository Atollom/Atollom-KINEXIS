"""Agent #4 — B2B Collector"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)

_SOURCE_SCORE = {"linkedin": 15, "referral": 20, "web_form": 10, "whatsapp": 12}


def _score(contact: dict, context: dict) -> int:
    score = 40
    val = float(context.get("estimated_value", 0))
    if val >= 100000:
        score += 30
    elif val >= 50000:
        score += 20
    elif val >= 10000:
        score += 10

    score += _SOURCE_SCORE.get(context.get("source", ""), 5)

    if contact.get("company_name"):
        score += 10
    if contact.get("contact_email"):
        score += 5
    if contact.get("phone"):
        score += 5
    if context.get("urgency") == "high":
        score += 10

    return min(score, 100)


class B2BCollectorAgent:
    name = "B2B Collector #4"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        contact = data.get("contact", {})
        context = data.get("context", {})
        source = data.get("source", context.get("source", "web_form"))

        if not contact.get("company_name") and not contact.get("contact_name"):
            return {"success": False, "error": "contact with company_name or contact_name required", "data": {}}

        try:
            score = _score(contact, context)
            tier = "hot" if score >= 70 else "warm" if score >= 40 else "cold"
            next_actions = {
                "hot": ["Llamar en las próximas 2 horas", "Enviar propuesta personalizada"],
                "warm": ["Enviar brochure por email", "Agendar demo en 48h"],
                "cold": ["Añadir a secuencia de nurturing", "Seguimiento en 7 días"],
            }[tier]

            row = await db.fetch_one(
                """INSERT INTO leads
                   (tenant_id, company_name, contact_name, contact_email, phone,
                    deal_stage, source, score, estimated_value, notes, created_at)
                   VALUES ($1,$2,$3,$4,$5,'new',$6,$7,$8,$9,NOW())
                   RETURNING id""",
                tenant_id,
                contact.get("company_name", ""),
                contact.get("contact_name", ""),
                contact.get("contact_email", ""),
                contact.get("phone", ""),
                source,
                score,
                float(context.get("estimated_value", 0)),
                context.get("notes", ""),
            )

            logger.info("B2B lead created: score=%d tier=%s tenant=%s", score, tier, tenant_id)
            return {
                "success": True,
                "data": {
                    "lead_id": str(row["id"]) if row else None,
                    "score": score,
                    "tier": tier,
                    "next_actions": next_actions,
                    "deal_stage": "new",
                },
            }
        except Exception as exc:
            logger.error("B2BCollector failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


b2b_collector = B2BCollectorAgent()
