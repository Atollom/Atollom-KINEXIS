import logging
from typing import Any, Dict, Optional
from decimal import Decimal
from datetime import timedelta

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class NPSSatisfactionAgent(BaseAgent):
    """
    Agente #31: NPS & Satisfaction Agent.
    Envía encuestas post-entrega y procesa resultados.
    Cooldown de 90 días entre encuestas por cliente.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="nps_satisfaction_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        post_delivery → _send_survey()
        manual_send → _send_survey()
        response_received → _process_response()
        """
        trigger = data.get("trigger")
        contact = data.get("customer_contact")
        order_id = data.get("order_id")

        if not trigger:
            raise ValueError("trigger requerido")

        if trigger in ["post_delivery", "manual_send"]:
            if not contact: raise ValueError("customer_contact requerido")
            sent = await self._send_survey(contact, order_id)
            return {
                "survey_sent": sent,
                "score_recorded": False,
                "promoter_type": None,
                "action_triggered": False
            }

        elif trigger == "response_received":
            score = data.get("nps_score")
            if score is None: raise ValueError("nps_score requerido")
            if not contact: raise ValueError("customer_contact requerido")
            return await self._process_response(int(score), contact)

        else:
            raise ValueError(f"Unknown trigger: {trigger}")

    async def _send_survey(self, contact: str, order_id: str) -> bool:
        # 1. Verificar cooldown desde tenant_config (default 90 días)
        config = await self.get_tenant_config(self.tenant_id)
        cooldown_days = config.get("nps_cooldown_days", 90)
        cutoff = self._get_now() - timedelta(days=cooldown_days)
        last_survey = await self._query_last_survey(contact, cutoff)
        
        if last_survey:
            logger.info("Cliente %s en cooldown de NPS. No se envía encuesta.", contact)
            return False

        # 2. Enviar por WhatsApp (Simulado)
        # await self.meta_adapter.send_whatsapp(contact, "¿Del 0 al 10 qué tan probable es que nos recomiendes?")
        
        # 3. Registrar encuesta enviada
        await self.supabase.table("nps_surveys").insert({
            "tenant_id": self.tenant_id,
            "order_id": order_id,
            "customer_contact": contact,
            "status": "sent",
            "sent_at": self._get_now().isoformat()
        }).execute()
        
        return True

    async def _process_response(self, score: int, contact: str) -> dict:
        if not (0 <= score <= 10):
            raise ValueError(f"Score NPS inválido: {score}. Debe ser 0-10.")

        # Clasificar
        promoter_type = "passive"
        action_triggered = False
        
        if score <= 6:
            promoter_type = "detractor"
            action_triggered = True
            await self._trigger_support_handoff(contact, score)
        elif score >= 9:
            promoter_type = "promoter"
            await self._send_thank_you(contact)

        # Update nps_surveys
        # Buscamos la encuesta más reciente enviada a este contacto
        await self.supabase.table("nps_surveys")\
            .update({
                "status": "responded",
                "score": score,
                "promoter_type": promoter_type,
                "responded_at": self._get_now().isoformat()
            })\
            .eq("tenant_id", self.tenant_id)\
            .eq("customer_contact", contact)\
            .eq("status", "sent")\
            .execute()

        # Check average
        avg = await self._check_nps_average()
        if avg < Decimal("7.0"):
            await self._notify_socias(f"Alerta: NPS promedio crítico ({avg}).")

        return {
            "survey_sent": False,
            "score_recorded": True,
            "promoter_type": promoter_type,
            "action_triggered": action_triggered
        }

    async def _query_last_survey(self, contact: str, cutoff: Any) -> Optional[Dict]:
        res = await self.supabase.table("nps_surveys").select("*")\
            .eq("tenant_id", self.tenant_id)\
            .eq("customer_contact", contact)\
            .gte("sent_at", cutoff.isoformat())\
            .limit(1)\
            .execute()
        return res.data[0] if res and hasattr(res, 'data') and res.data else None

    async def _check_nps_average(self) -> Decimal:
        cutoff = (self._get_now() - timedelta(days=30)).isoformat()
        res = await self.supabase.table("nps_surveys").select("score")\
            .eq("tenant_id", self.tenant_id)\
            .eq("status", "responded")\
            .gte("responded_at", cutoff)\
            .execute()
        
        scores = [r["score"] for r in res.data if r.get("score") is not None] if res and hasattr(res, 'data') else []
        if not scores: return Decimal("10.0") # Default high if no data
        
        avg = Decimal(sum(scores)) / Decimal(len(scores))
        return avg.quantize(Decimal("0.1"))

    async def _trigger_support_handoff(self, contact: str, score: int):
        # mock
        pass

    async def _send_thank_you(self, contact: str):
        # mock
        pass

    async def _notify_socias(self, msg: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception as e:
            logger.error("Error notificando socias NPS: %s", e)

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {"nps_cooldown_days": 90}
