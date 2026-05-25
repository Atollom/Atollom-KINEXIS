"""
Agente #35: Social Monitor
Responsabilidad: Monitorear menciones de marca en redes sociales y alertar sobre crisis
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"get_mentions", "get_alerts", "get_sentiment", "get_trending"}


class Agent35SocialMonitor:
    """
    Social Monitor — Monitoreo de menciones de marca y sentimiento en redes sociales.

    Input:
        {
            "action":    str  — get_mentions | get_alerts | get_sentiment | get_trending
            "platform":  str  — instagram | facebook | twitter | all
            "tenant_id": str
        }
    Output:
        { "action", "platform", "mentions": [...], "sentiment_score", "alerts", "source" }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #35 - Social Monitor"

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
        action = data.get("action", "get_mentions")
        if action not in VALID_ACTIONS:
            action = "get_mentions"
        return {
            "action": action,
            "platform": data.get("platform", "all"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Social listening APIs (Meta Graph, etc.) are not connected — mock only
        return self._mock_result(data["action"], data["platform"])

    def _mock_result(self, action: str, platform: str) -> Dict:
        return {
            "action": action,
            "platform": platform,
            "period": "last_7_days",
            "total_mentions": 142,
            "sentiment_score": 72,  # 0-100
            "sentiment_breakdown": {
                "positive": 84,
                "neutral": 37,
                "negative": 21,
            },
            "mentions": [
                {"platform": "instagram", "type": "comment",  "sentiment": "positive", "text": "Excelente calidad de herramientas, ya compré 3 veces!", "reach": 340,  "date": "2026-05-24"},
                {"platform": "facebook",  "type": "review",   "sentiment": "negative", "text": "Tardaron 10 días en entregar, muy mala experiencia.", "reach": 120,  "date": "2026-05-23"},
                {"platform": "instagram", "type": "story_tag", "sentiment": "positive", "text": "@kaptools el taladro es una bestia 💪", "reach": 890, "date": "2026-05-23"},
                {"platform": "facebook",  "type": "comment",  "sentiment": "neutral",  "text": "¿Tienen garantía de 2 años en sus productos?", "reach": 45,   "date": "2026-05-22"},
                {"platform": "instagram", "type": "dm",       "sentiment": "negative", "text": "Compré y nunca llegó mi pedido.", "reach": 0,    "date": "2026-05-22"},
            ],
            "trending_topics": ["garantía", "tiempo de entrega", "calidad", "precio"],
            "alerts": [
                {"type": "warning", "message": "21 menciones negativas esta semana — 15% arriba del promedio"},
                {"type": "high",    "message": "Tema 'tiempo de entrega' mencionado 8 veces negativamente — revisar logística"},
            ],
            "reach_total": 18420,
            "engagements_total": 642,
            "source": "mock_data",
        }
