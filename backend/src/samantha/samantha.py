"""
Samantha - Cerebro Ejecutor Central
Responsabilidad: Orquestar todo el sistema KINEXIS
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .context_manager import context_manager
from .nlp_engine import nlp_engine
from .orchestrator import orchestrator
from .permission_validator import permission_validator
from .response_generator import response_generator

logger = logging.getLogger(__name__)


class Samantha:
    """
    Cerebro ejecutor central de KINEXIS.

    Flujo:
    1. NLP Engine     - Comprende query
    2. Context Manager - Recupera contexto
    3. Permission Validator - Verifica permisos
    4. Orchestrator   - Ejecuta agentes
    5. Context Manager - Guarda interaccion
    6. Response Generator - Formatea respuesta
    """

    def __init__(self):
        self.name = "Samantha"
        self.version = "1.0"
        self.nlp = nlp_engine
        self.context = context_manager
        self.orchestrator = orchestrator
        self.permissions = permission_validator
        self.response = response_generator
        logger.info(f"{self.name} v{self.version} initialized")

    async def process(
        self,
        query: str,
        tenant_id: str,
        user_id: str,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Procesa query del usuario de extremo a extremo.

        Returns:
            {success, samantha_version, query, intent, response,
             agents_called, execution_time_ms, timestamp}
        """
        conv_id = conversation_id or f"{tenant_id}_{user_id}"
        try:
            # 1. Comprender intencion
            intent_data = await self.nlp.understand(query)

            # 2. Recuperar contexto
            ctx = await self.context.get_context(conv_id)

            # 3. Validar permisos
            perm = await self.permissions.validate(
                tenant_id=tenant_id,
                user_id=user_id,
                intent=intent_data["intent"],
            )
            if not perm["allowed"]:
                return {
                    "success": False,
                    "error": "Permission denied",
                    "message": f"No tienes permiso para: {intent_data['intent']}",
                }

            # 4. Ejecutar agentes
            execution = await self.orchestrator.execute(
                intent=intent_data["intent"],
                entities=intent_data["entities"],
                context=ctx,
                tenant_id=tenant_id,
                user_id=user_id,
            )

            # 5. Guardar en historial
            await self.context.save_interaction(
                conv_id,
                query=query,
                intent=intent_data["intent"],
                result=execution,
            )

            # 6. Formatear respuesta
            message = await self.response.generate(
                query=query,
                intent=intent_data,
                result=execution,
                context=ctx,
            )

            return {
                "success": True,
                "samantha_version": self.version,
                "query": query,
                "intent": intent_data["intent"],
                "confidence": intent_data["confidence"],
                "response": message,
                "agents_called": execution.get("agents_called", []),
                "execution_time_ms": execution.get("execution_time_ms", 0),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"Samantha process failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Lo siento, ocurrio un error procesando tu solicitud.",
            }


samantha = Samantha()
