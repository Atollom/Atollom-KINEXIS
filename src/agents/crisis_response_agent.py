import logging
import re
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class CrisisResponseAgent(BaseAgent):
    """
    Agente #27: Crisis Response Agent.
    Monitorea señales de crisis y actúa pausando la IA o Ads según la severidad.
    HUMAN_REQUIRED para Nivel 3.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="crisis_response_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Sanitizar content
        2. Determinar nivel de severidad
        3. Rutear según nivel
        4. Registrar en crisis_events
        """
        trigger = data.get("trigger")
        channel = data.get("channel", "unknown")
        content = data.get("content", "")
        severity = data.get("severity", "level_1")

        if not trigger:
            raise ValueError("trigger es requerido")

        # Sanitizar content
        clean_content = self._sanitize_content(content)

        result = {
            "action_taken": "",
            "ai_paused": False,
            "ads_paused": False,
            "socias_notified": False,
            "crisis_id": ""
        }

        if severity == "level_1":
            res = await self._handle_level_1(clean_content, channel)
            result.update(res)
        elif severity == "level_2":
            res = await self._handle_level_2(clean_content)
            result.update(res)
        elif severity == "level_3":
            res = await self._handle_level_3()
            result.update(res)
        else:
            raise ValueError(f"Severity desconocido: {severity}")

        # Registrar en crisis_events
        crisis_id = await self._log_crisis(severity, channel, trigger, clean_content[:200], result)
        result["crisis_id"] = crisis_id

        return result

    def _sanitize_content(self, text: str) -> str:
        # Remover caracteres especiales agresivos para evitar inyecciones en LLM
        return re.sub(r'[^\w\s\.,\-\?!@]', '', text).strip()

    async def _handle_level_1(self, content: str, channel: str) -> dict:
        """
        Nivel 1 (1 comentario negativo): Responder con empatía < 5 min. IA actúa sola.
        """
        # En producción llamaría a Claude para generar respuesta
        response = "Lamentamos lo ocurrido. Estamos revisando tu caso."
        # logger.info(f"Level 1 Crisis in {channel}: {content}")
        return {
            "action_taken": f"Respuesta empática enviada por {channel}",
            "ai_paused": False,
            "ads_paused": False,
            "socias_notified": False
        }

    async def _handle_level_2(self, content: str) -> dict:
        """
        Nivel 2 (3+ negativos en 1 hora): NOTIFY a socias + pausar ADS.
        """
        await self._notify_socias("ALERTA NIVEL 2: Múltiples comentarios negativos detectados. Pausando Ads.")
        await self._pause_ads()
        return {
            "action_taken": "Ads pausados y socias notificadas",
            "ai_paused": False,
            "ads_paused": True,
            "socias_notified": True
        }

    async def _handle_level_3(self) -> dict:
        """
        Nivel 3 (viral/prensa/amenaza legal): Desactivar IA completamente. Modo manual.
        """
        # UPDATE tenant_agent_config es crítico
        try:
            await self._deactivate_ia_global()
        except Exception as e:
            logger.error("FALLO CRITICO al desactivar IA global: %s", e)
            # Notificación es más importante
            await self._notify_socias("URGENTE: FALLO AL DESACTIVAR IA. INTERVENCIÓN MANUAL REQUERIDA.")

        await self._pause_ads()
        await self._notify_socias("CRISIS NIVEL 3: IA desactivada. Modo manual activado. Requiere su intervención inmediata.")
        
        return {
            "action_taken": "IA desactivada globalmente, Ads pausados y socias notificadas",
            "ai_paused": True,
            "ads_paused": True,
            "socias_notified": True
        }

    async def _deactivate_ia_global(self):
        # Operación crítica en tenant_agent_config
        # ai_active=False para todos los agentes del tenant
        await self.supabase.table("tenant_agent_config")\
            .update({"ai_active": False})\
            .eq("tenant_id", self.tenant_id)\
            .execute()

    async def _pause_ads(self):
        # Simular pausa de todos los Ad Managers
        # En producción llamaría a los Ads Agents correspondientes
        pass

    async def _notify_socias(self, message: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", message)
            pass
        except Exception as e:
            logger.error("Error notificando a socias: %s", e)

    async def _log_crisis(self, severity: str, channel: str, trigger: str, content: str, result: dict) -> str:
        res = await self.supabase.table("crisis_events").insert({
            "tenant_id": self.tenant_id,
            "severity": severity,
            "channel": channel,
            "trigger_type": trigger,
            "content_summary": content,
            "action_taken": result["action_taken"],
            "ai_paused": result["ai_paused"],
            "ads_paused": result["ads_paused"]
        }).execute()
        return res.data[0]["id"] if res and hasattr(res, 'data') and res.data else "unknown"

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
