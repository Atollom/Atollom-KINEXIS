"""Agent #19 — NPS Collector (stub)"""
import logging
from src.utils.database import db

logger = logging.getLogger(__name__)


class NPSCollectorAgent:
    name = "NPS Collector #19"

    async def execute(self, data):
        tenant_id = data.get("tenant_id")
        score = data.get("score")
        if not tenant_id or score is None:
            return {"success": False, "error": "tenant_id and score required", "data": {}}
        try:
            await db.execute(
                "INSERT INTO nps_responses (tenant_id, score, comment) VALUES ($1, $2, $3)",
                tenant_id, int(score), data.get("comment", ""),
            )
            return {"success": True, "data": {"score": score}}
        except Exception as exc:
            logger.error("NPSCollector failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


nps_collector = NPSCollectorAgent()
