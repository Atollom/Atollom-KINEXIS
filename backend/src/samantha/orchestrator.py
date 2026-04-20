"""
Orchestrator - Ejecuta workflows multi-agente
"""

from typing import Dict, Any
import logging

from src.agents.core.agent_00_guardian import guardian
from src.routers import ecommerce_router, crm_router, erp_router, meta_router

logger = logging.getLogger(__name__)

_ROUTERS = {
    "ecommerce": ecommerce_router,
    "crm":       crm_router,
    "erp":       erp_router,
    "meta":      meta_router,
}


class Orchestrator:
    """
    Orquesta ejecucion de agentes.

    Flujo:
    1. Guardian clasifica modulo
    2. Router del modulo ejecuta agentes
    3. Retorna resultado unificado
    """

    def __init__(self):
        self.name = "Orchestrator"

    async def execute(
        self,
        intent: str,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        tenant_id: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """Ejecuta workflow completo para el intent dado."""

        # Guardian decide a que router enviar
        guardian_result = await guardian.execute({
            "query": intent,
            "tenant_id": tenant_id,
            "user_id": user_id,
        })

        if not guardian_result.get("success"):
            return {
                "success": False,
                "error": guardian_result.get("error", "Guardian classification failed"),
                "agents_called": [guardian_result.get("agent", "Guardian")],
            }

        router_name = guardian_result.get("router", "")
        router = _ROUTERS.get(router_name)

        if not router:
            return {
                "success": False,
                "error": f"No router available for module: {router_name}",
                "agents_called": [],
            }

        router_result = await router.route({
            "intent": intent,
            "data": entities,
            "tenant_id": tenant_id,
            "user_id": user_id,
            "context": context,
        })

        return router_result


orchestrator = Orchestrator()
