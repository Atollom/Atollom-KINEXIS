"""
Context Manager - Memoria conversacional
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

_MAX_HISTORY = 50


class ContextManager:
    """
    Gestiona contexto conversacional.

    Usa memoria in-memory ahora; Redis en Fase 2.
    """

    def __init__(self):
        self.name = "Context Manager"
        self._memory: Dict[str, Dict[str, Any]] = {}

    async def get_context(self, conversation_id: str) -> Dict[str, Any]:
        """Recupera contexto de conversacion."""
        return self._memory.get(
            conversation_id,
            {"history": [], "entities": {}, "preferences": {}},
        )

    async def save_interaction(
        self,
        conversation_id: str,
        query: str,
        intent: str,
        result: Dict[str, Any],
    ) -> None:
        """Guarda interaccion en historial."""
        if conversation_id not in self._memory:
            self._memory[conversation_id] = {
                "history": [],
                "entities": {},
                "preferences": {},
            }

        self._memory[conversation_id]["history"].append({
            "query": query,
            "intent": intent,
            "result_success": result.get("success"),
            "timestamp": result.get("timestamp"),
        })

        # Ventana deslizante
        history = self._memory[conversation_id]["history"]
        if len(history) > _MAX_HISTORY:
            self._memory[conversation_id]["history"] = history[-_MAX_HISTORY:]


context_manager = ContextManager()
