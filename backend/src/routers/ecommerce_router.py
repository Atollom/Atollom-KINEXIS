"""
E-commerce Router
Responsabilidad: Orquestar los 6 agentes E-commerce según intención
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import time
import logging
from typing import Dict, Any

from src.agents.ecommerce.agent_01_ml_fulfillment import ml_fulfillment
from src.agents.ecommerce.agent_02_amazon_fba import amazon_fba
from src.agents.ecommerce.agent_03_shopify_fulfillment import shopify_fulfillment
from src.agents.ecommerce.agent_06_price_manager import price_manager
from src.agents.ecommerce.agent_14_returns_manager import returns_manager
from src.agents.ecommerce.agent_27_ml_questions import ml_questions

logger = logging.getLogger(__name__)

VALID_INTENTS = {"fulfill_order", "update_price", "handle_return", "answer_question"}
VALID_CHANNELS = {"mercadolibre", "amazon", "shopify", "all"}

FULFILL_AGENTS = {
    "mercadolibre": ml_fulfillment,
    "amazon":       amazon_fba,
    "shopify":      shopify_fulfillment,
}


class EcommerceRouter:
    """
    E-commerce Router — Enrutamiento a agentes de fulfillment, precios y atención.

    Intenciones soportadas:
      fulfill_order    → ml_fulfillment | amazon_fba | shopify_fulfillment (por canal)
      update_price     → price_manager  (3 canales simultáneos)
      handle_return    → returns_manager
      answer_question  → ml_questions
    """

    def __init__(self) -> None:
        self.name = "E-commerce Router"
        logger.info(f"{self.name} initialized")

    async def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Enruta request al agente E-commerce correcto."""
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
        data = dict(request.get("data", {}))
        if "tenant_id" in request:
            data.setdefault("tenant_id", request["tenant_id"])
        return data

    async def _dispatch(self, intent: str, request: Dict, data: Dict):
        if intent == "fulfill_order":
            channel = request.get("channel", "")
            if channel not in FULFILL_AGENTS:
                raise ValueError(f"Invalid channel for fulfill_order: {channel}. Valid: {set(FULFILL_AGENTS)}")
            agent = FULFILL_AGENTS[channel]
            r = await agent.execute(data)
            return [agent.name], r

        elif intent == "update_price":
            r = await price_manager.execute(data)
            return [price_manager.name], r

        elif intent == "handle_return":
            r = await returns_manager.execute(data)
            return [returns_manager.name], r

        else:  # answer_question
            r = await ml_questions.execute(data)
            return [ml_questions.name], r


ecommerce_router = EcommerceRouter()
