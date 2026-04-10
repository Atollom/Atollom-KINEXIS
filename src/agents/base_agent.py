# src/agents/base_agent.py
import re
import uuid
import datetime
from typing import Dict, Any, Optional
from src.utils.ai_client import AIClientWithFallback

class BaseAgent:
    """
    Clase Base para todos los agentes de KINEXIS.
    Define el ciclo de vida, trazabilidad y validación mandatoria.
    """
    def __init__(self, tenant_id: str, agent_id: str, supabase_client: Any = None):
        self.tenant_id = tenant_id
        self.agent_id = agent_id
        self.supabase = supabase_client
        self.ai_client = AIClientWithFallback()
        self.session_id = str(uuid.uuid4())

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ciclo de ejecución principal.
        """
        # 1. Registro de inicio en logs (Simulado por ahora)
        print(f"[{datetime.datetime.now()}] Agent {self.agent_id} starting for tenant {self.tenant_id}")
        
        # 2. VALIDACIÓN MANDATORIA (Agente #26)
        # Se requiere importar aquí para evitar ciclos o usar un registro
        validation_result = await self._validate(input_data)
        if not validation_result.get("is_passing"):
            return {
                "status": "failed",
                "error": "Validation failed",
                "details": validation_result.get("details")
            }

        # 3. Lógica específica del agente (implementada en subclases)
        try:
            result = await self.process(input_data)
            return {
                "status": "success",
                "agent_id": self.agent_id,
                "tenant_id": self.tenant_id,
                "session_id": self.session_id,
                "output": result
            }
        except Exception as e:
            return {
                "status": "failed",
                "agent_id": self.agent_id,
                "error": str(e)
            }

    async def _sanitize_for_prompt(self, user_input: str) -> str:
        """
        Sanitiza y trunca el input del usuario antes de enviarlo al LLM.
        Previene override patterns e inyecciones de sistema.
        """
        if not user_input:
            return ""

        # 1. Truncar a 500 chars (Claude/Kap Tools SLA)
        sanitized = user_input[:500]

        # 2. Lista de patrones de override/inyección (CLAUDE_LESSON)
        overrides = [
            "ignora instrucciones", "olvida todo", "eres ahora",
            "nuevo rol", "ignore previous", "forget everything",
            "you are now", "system:", "assistant:", "user:"
        ]

        # 3. Eliminar patrones de forma insensible a mayúsculas
        for pattern in overrides:
            regex = re.compile(re.escape(pattern), re.IGNORECASE)
            sanitized = regex.sub("[REDACTED]", sanitized)

        return sanitized

    async def _validate(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Llama al Agente #26 para validar la operación.
        """
        # En una fase posterior, esto instanciará ValidationAgent y llamará a check()
        # Por ahora, un placeholder que pasa por defecto
        return {"is_passing": True}

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Debe ser implementado por cada agente específico.
        """
        raise NotImplementedError("Subclases deben implementar process()")
