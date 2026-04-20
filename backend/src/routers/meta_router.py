"""
Meta Router
Responsabilidad: Orquestar los 5 agentes Meta según intención y canal
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import time
import logging
from typing import Dict, Any

from src.agents.meta.agent_wa_whatsapp import wa_agent
from src.agents.meta.agent_ig_instagram import ig_agent
from src.agents.meta.agent_fb_facebook import fb_agent
from src.agents.meta.agent_12_ads_manager import ads_manager
from src.agents.meta.agent_content_publisher import content_publisher

logger = logging.getLogger(__name__)

VALID_INTENTS = {"send_message", "manage_ads", "publish_content"}
VALID_CHANNELS = {"whatsapp", "instagram", "facebook"}

MESSAGE_AGENTS = {
    "whatsapp":  wa_agent,
    "instagram": ig_agent,
    "facebook":  fb_agent,
}


class MetaRouter:
    """
    Meta Router — Enrutamiento a agentes de mensajería y marketing Meta.

    Intenciones soportadas:
      send_message    → wa_agent | ig_agent | fb_agent (por canal)
      manage_ads      → ads_manager (#12)
      publish_content → content_publisher
    """

    def __init__(self) -> None:
        self.name = "Meta Router"
        logger.info(f"{self.name} initialized")

    async def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Enruta request al agente Meta correcto."""
        start = time.time()
        try:
            intent = request.get("intent", "")
            if not intent:
                raise ValueError("Missing intent")
            if intent not in VALID_INTENTS:
                raise ValueError(f"Unknown intent: {intent}. Valid: {VALID_INTENTS}")

            data = self._build_data(request)
            agents_called, agent_result = await self._dispatch(intent, request, data)
            ms = round((time.time() - start) * 1000, 2)

            if not agent_result.get("success"):
                return {
                    "success": False,
                    "router": self.name,
                    "intent": intent,
                    "agents_called": agents_called,
                    "error": agent_result.get("error", "Agent execution failed"),
                    "execution_time_ms": ms,
                }

            return {
                "success": True,
                "router": self.name,
                "intent": intent,
                "agents_called": agents_called,
                "result": agent_result.get("data", {}),
                "execution_time_ms": ms,
            }
        except Exception as e:
            logger.error(f"{self.name} routing failed: {e}")
            return {
                "success": False,
                "router": self.name,
                "error": str(e),
                "execution_time_ms": round((time.time() - start) * 1000, 2),
            }

    def _build_data(self, request: Dict[str, Any]) -> Dict[str, Any]:
        return dict(request.get("data", {}))

    async def _dispatch(self, intent: str, request: Dict, data: Dict):
        if intent == "send_message":
            channel = request.get("channel", "")
            if channel not in MESSAGE_AGENTS:
                raise ValueError(f"Invalid channel for send_message: {channel}. Valid: {set(MESSAGE_AGENTS)}")
            agent = MESSAGE_AGENTS[channel]
            r = await agent.execute(data)
            return [agent.name], r

        elif intent == "manage_ads":
            r = await ads_manager.execute(data)
            return [ads_manager.name], r

        else:  # publish_content
            r = await content_publisher.execute(data)
            return [content_publisher.name], r


meta_router = MetaRouter()
