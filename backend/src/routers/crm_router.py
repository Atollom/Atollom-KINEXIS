"""
CRM Router
Responsabilidad: Orquestar los 6 agentes CRM según intención
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import time
import logging
from typing import Dict, Any, List, Tuple

from src.agents.crm.agent_04_b2b_collector import b2b_collector
from src.agents.crm.agent_19_nps_collector import nps_collector
from src.agents.crm.agent_31_lead_scorer import lead_scorer
from src.agents.crm.agent_32_quote_generator import quote_generator
from src.agents.crm.agent_33_follow_up import follow_up
from src.agents.crm.agent_37_support_tickets import support_tickets

logger = logging.getLogger(__name__)

VALID_INTENTS = {
    "capture_lead", "score_lead", "generate_quote",
    "follow_up", "create_ticket", "collect_nps",
}


class CRMRouter:
    """
    CRM Router — Enrutamiento a agentes de leads, cotizaciones y soporte.

    Intenciones soportadas:
      capture_lead   → b2b_collector + lead_scorer (secuencial)
      score_lead     → lead_scorer
      generate_quote → quote_generator
      follow_up      → follow_up
      create_ticket  → support_tickets
      collect_nps    → nps_collector
    """

    def __init__(self) -> None:
        self.name = "CRM Router"
        logger.info(f"{self.name} initialized")

    async def route(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Enruta request al agente CRM correcto."""
        start = time.time()
        try:
            intent = request.get("intent", "")
            if not intent:
                raise ValueError("Missing intent")
            if intent not in VALID_INTENTS:
                raise ValueError(f"Unknown intent: {intent}. Valid: {VALID_INTENTS}")

            data = self._build_data(request)
            agents_called, agent_result = await self._dispatch(intent, data)
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

    async def _dispatch(self, intent: str, data: Dict) -> Tuple[List[str], Dict]:
        if intent == "capture_lead":
            # Sequential: b2b_collector → lead_scorer (combined result)
            agents_called = []
            combined: Dict[str, Any] = {}

            r1 = await b2b_collector.execute(data)
            agents_called.append(b2b_collector.name)
            if not r1.get("success"):
                return agents_called, r1
            combined.update(r1.get("data", {}))

            r2 = await lead_scorer.execute(data)
            agents_called.append(lead_scorer.name)
            if not r2.get("success"):
                return agents_called, r2
            combined.update(r2.get("data", {}))

            return agents_called, {"success": True, "data": combined}

        elif intent == "score_lead":
            r = await lead_scorer.execute(data)
            return [lead_scorer.name], r

        elif intent == "generate_quote":
            r = await quote_generator.execute(data)
            return [quote_generator.name], r

        elif intent == "follow_up":
            r = await follow_up.execute(data)
            return [follow_up.name], r

        elif intent == "create_ticket":
            r = await support_tickets.execute(data)
            return [support_tickets.name], r

        else:  # collect_nps
            r = await nps_collector.execute(data)
            return [nps_collector.name], r


crm_router = CRMRouter()
