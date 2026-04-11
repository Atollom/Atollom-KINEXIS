# src/agents/account_manager_agent.py
import logging
from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class AccountManagerAgent(BaseAgent):
    """
    Agente #25: Account Manager Agent.
    Monitorea la salud de cuentas B2B, registra compras y gestiona NPS.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="account_manager_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point compatible con BaseAgent.run()"""
        return await self.execute(data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatcher central según event_type.
        """
        event_type = data.get("event_type")
        account_id = data.get("account_id")

        if not account_id:
            raise ValueError("account_id es requerido.")

        if event_type == "check_health":
            return await self._check_health(account_id)
        elif event_type == "log_purchase":
            amount = data.get("purchase_amount", 0)
            return await self._log_purchase(account_id, amount)
        elif event_type == "send_nps":
            return await self._send_nps(account_id)
        else:
            raise ValueError(f"event_type desconocido: {event_type}")

    async def _check_health(self, account_id: str) -> Dict[str, Any]:
        """
        Calcula y actualiza el health_score de una cuenta.
        """
        try:
            res = await self.supabase.table("b2b_accounts")\
                .select("*")\
                .eq("id", account_id)\
                .eq("tenant_id", self.tenant_id)\
                .single()\
                .execute()
            
            if not res.data:
                raise ValueError(f"Cuenta {account_id} no encontrada para tenant {self.tenant_id}")

            account = res.data
            last_purchase_at = account.get("last_purchase_at")
            
            # Obtener umbrales de configuración (o usar defaults)
            config = await self.get_tenant_config(self.tenant_id)
            days_threshold = config.get("account_health_threshold", 30)

            health_score = await self._calculate_health(last_purchase_at, days_threshold)

            # Actualizar en BD
            await self.supabase.table("b2b_accounts")\
                .update({
                    "health_score": health_score,
                    "updated_at": self._get_now().isoformat()
                })\
                .eq("id", account_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()

            alert_sent = False
            if health_score < 40:
                alert_sent = await self._alert_socias(account, health_score)

            return {
                "health_score": health_score,
                "action_taken": "low_health_alert" if alert_sent else "none",
                "alert_sent": alert_sent
            }
        except Exception as e:
            logger.error("Error en _check_health para cuenta %s: %s", account_id, e)
            raise

    async def _log_purchase(self, account_id: str, amount: Any) -> Dict[str, Any]:
        """
        Registra una nueva compra y recalcula salud.
        """
        try:
            # Asegurar uso de Decimal
            purchase_amount = Decimal(str(amount))
            
            # Obtener cuenta para sumar MRR
            res = await self.supabase.table("b2b_accounts")\
                .select("mrr")\
                .eq("id", account_id)\
                .eq("tenant_id", self.tenant_id)\
                .single()\
                .execute()
            
            current_mrr = Decimal(str(res.data.get("mrr", 0)))
            new_mrr = max(Decimal("0.00"), current_mrr + purchase_amount)  # MRR nunca negativo

            # UPDATE
            now = self._get_now()
            await self.supabase.table("b2b_accounts")\
                .update({
                    "last_purchase_at": now.isoformat(),
                    "mrr": float(new_mrr), # Supabase suele preferir float o string para numeric
                    "updated_at": now.isoformat()
                })\
                .eq("id", account_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()

            # Recalcular salud inmediatamente
            health_data = await self._check_health(account_id)
            
            return {
                "status": "purchase_logged",
                "new_mrr": float(new_mrr),
                "health_score": health_data.get("health_score")
            }
        except Exception as e:
            logger.error("Error en _log_purchase para cuenta %s: %s", account_id, e)
            raise

    async def _send_nps(self, account_id: str) -> Dict[str, Any]:
        """
        Envía encuesta NPS respetando cooldown.
        """
        try:
            res = await self.supabase.table("b2b_accounts")\
                .select("*")\
                .eq("id", account_id)\
                .eq("tenant_id", self.tenant_id)\
                .single()\
                .execute()
            
            account = res.data
            last_nps = account.get("nps_last_sent_at")
            
            # Verificar cooldown
            config = await self.get_tenant_config(self.tenant_id)
            cooldown_days = config.get("nps_cooldown_days", 90)
            
            now = self._get_now()
            if last_nps:
                last_nps_dt = self._parse_iso(last_nps)
                if now < last_nps_dt + timedelta(days=cooldown_days):
                    logger.info("NPS en cooldown para cuenta %s", account_id)
                    return {"nps_sent": False, "reason": "cooldown_active"}

            # Enviar mensaje
            name = account.get("company_name", "cliente")
            phone = account.get("contact_phone")
            
            if not phone:
                return {"nps_sent": False, "reason": "no_phone"}

            msg = (
                f"Hola {name}, en Kap Tools nos importa tu experiencia. "
                "Del 0 al 10, ¿qué tan probable es que nos recomiendes? "
                "Responde con solo el número. ¡Gracias!"
            )
            
            sent = await self.meta_adapter.send_whatsapp(phone, msg)
            
            if sent:
                # Registrar envío y ticket de respuesta pendiente
                await self.supabase.table("nps_responses").insert({
                    "tenant_id": self.tenant_id,
                    "account_id": account_id,
                    "sent_at": now.isoformat()
                }).execute()
                
                await self.supabase.table("b2b_accounts").update({
                    "nps_last_sent_at": now.isoformat()
                }).eq("id", account_id).eq("tenant_id", self.tenant_id).execute()

            return {"nps_sent": sent}
        except Exception as e:
            logger.error("Error en _send_nps para cuenta %s: %s", account_id, e)
            return {"nps_sent": False, "error": str(e)}

    async def _calculate_health(self, last_purchase_at: Optional[str], days_threshold: int) -> int:
        """
        Lógica interna de cálculo de salud.
        """
        if not last_purchase_at:
            return 0
        
        try:
            last_dt = self._parse_iso(last_purchase_at)
            now = self._get_now()
            days_diff = (now - last_dt).days

            # Reglas de negocio (Rangos S9)
            if days_diff <= days_threshold: # default 30
                return 100
            elif days_diff <= 60:
                return 70
            elif days_diff <= 90:
                return 40
            else:
                return 10
        except Exception as e:
            logger.error("Error calculando health score last_purchase=%s: %s", last_purchase_at, e)
            return 50  # Fallback neutro

    async def _alert_socias(self, account: Dict[str, Any], score: int) -> bool:
        """
        Envía alerta de riesgo de churn a socias.
        """
        try:
            config = await self.get_tenant_config(self.tenant_id)
            partners = config.get("partner_whatsapp", [])
            if not isinstance(partners, list):
                partners = [partners] if partners else []

            msg = (
                f"⚠️ *ALERTA CHURN B2B*\n"
                f"Cuenta: {account.get('company_name')}\n"
                f"Health Score: {score}/100\n"
                f"Última compra: {account.get('last_purchase_at')}\n"
                f"Acción requerida: Contacto inmediato."
            )

            for p in partners:
                await self.meta_adapter.send_whatsapp(p, msg)
            return True
        except Exception as e:
            logger.error("Error enviando alerta churn: %s", e)
            return False

    def _parse_iso(self, iso_str: str) -> Any:
        from datetime import datetime
        # Manejar formatos de Supabase
        return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))

    # ── Stubs de compatibilidad ──
    async def get_vault_secrets(self, _tenant_id: str, _keys: List[str]) -> Dict[str, Any]:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> Dict[str, Any]:
        return {
            "account_health_threshold": 30,
            "nps_cooldown_days": 90,
            "partner_whatsapp": ["521234567890"]
        }
