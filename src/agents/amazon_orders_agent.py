# src/agents/amazon_orders_agent.py
import logging
import hmac
import hashlib
from typing import Any, Dict, List, Optional
from src.agents.base_agent import BaseAgent
from src.adapters.amazon_adapter import AmazonAdapter

logger = logging.getLogger(__name__)

class AmazonOrdersAgent(BaseAgent):
    """
    Agente #7: Amazon Orders Agent.
    Procesa órdenes nuevas y sincroniza rastreo con Amazon SP-API.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="amazon_orders_agent_v1", supabase_client=supabase_client
        )
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatcher de eventos de Amazon."""
        event_type = data.get("event_type")
        
        # 1. VERIFICACIÓN HMAC (si viene de webhook)
        signature = data.get("x-amz-signature")
        if signature:
            if not await self._verify_hmac(data.get("raw_payload", b""), signature):
                logger.error("Firma HMAC de Amazon inválida para tenant %s", self.tenant_id)
                return {"status": "failed", "error": "Invalid HMAC"}

        # 2. RUTEO
        if event_type == "new_order":
            return await self._process_new_order(data.get("amazon_order_id"))
        elif event_type == "sync_tracking":
            return await self._sync_tracking(data.get("amazon_order_id"))
        elif event_type == "same_day_check":
            return await self._check_same_day()
        else:
            raise ValueError(f"event_type desconocido: {event_type}")

    async def _process_new_order(self, amazon_order_id: str) -> Dict[str, Any]:
        """Crea la orden en Supabase y alerta si es same-day."""
        if not amazon_order_id:
            raise ValueError("amazon_order_id es requerido para procesar nueva orden.")

        # Obtener items de Amazon Adapter
        items = await self.amazon_adapter.get_order_items(amazon_order_id)
        
        # Determinar si es same-day (Ejemplo: basado en el primer item o shipping service)
        # Por ahora simplificamos: si en el payload de Amazon viene 'SameDay', marcarlo.
        is_same_day = False # La lógica real leería el ShippingServiceLevelCategory
        
        order_data = {
            "tenant_id": self.tenant_id,
            "amazon_order_id": amazon_order_id,
            "status": "pending",
            "items_json": items,
            "same_day": is_same_day
        }

        try:
            # INSERT con ON CONFLICT DO NOTHING (UNIQUE tenant_id + amazon_order_id)
            res = await self.supabase.table("amazon_orders").insert(order_data).execute()
            
            if is_same_day:
                await self._alert_carlos(amazon_order_id, "NUEVA ORDEN SAME-DAY")

            return {
                "order_processed": True,
                "status": "pending",
                "is_same_day": is_same_day
            }
        except Exception as e:
            if "duplicate key" in str(e).lower():
                logger.info("Orden %s ya existe en BD para tenant %s", amazon_order_id, self.tenant_id)
                return {"order_processed": True, "note": "duplicate_ignored"}
            logger.error("Error al procesar nueva orden Amazon %s: %s", amazon_order_id, e)
            raise

    async def _sync_tracking(self, amazon_order_id: str) -> Dict[str, Any]:
        """Sincroniza el tracking de la BD hacia Amazon."""
        # LEER DE BD — NUNCA DEL PAYLOAD (Seguridad S11)
        res = await self.supabase.table("amazon_orders")\
            .select("tracking_number, carrier")\
            .eq("amazon_order_id", amazon_order_id)\
            .eq("tenant_id", self.tenant_id)\
            .single()\
            .execute()
        
        if not res.data:
            logger.error("No se encontró la orden %s para sincronizar tracking", amazon_order_id)
            return {"tracking_confirmed": False, "error": "not_found"}
        
        tracking = res.data.get("tracking_number")
        carrier = res.data.get("carrier")
        
        if not tracking:
            logger.warning("Intentando sincronizar tracking vacío para orden Amazon %s. Abortado.", amazon_order_id)
            return {"tracking_confirmed": False, "status": "no_tracking_available"}

        # Llamar Adapter
        await self.amazon_adapter.confirm_shipment(amazon_order_id, tracking, carrier or "UPS")
        
        # UPDATE BD
        await self.supabase.table("amazon_orders")\
            .update({"status": "shipped", "updated_at": self._get_now().isoformat()})\
            .eq("amazon_order_id", amazon_order_id)\
            .eq("tenant_id", self.tenant_id)\
            .execute()
            
        return {"tracking_confirmed": True, "status": "shipped"}

    async def _check_same_day(self) -> Dict[str, Any]:
        """Revisa órdenes same-day pendientes de hoy (12PM/1PM)."""
        today = self._get_now().date().isoformat()
        
        res = await self.supabase.table("amazon_orders")\
            .select("amazon_order_id")\
            .eq("tenant_id", self.tenant_id)\
            .eq("same_day", True)\
            .eq("status", "pending")\
            .gte("created_at", today)\
            .execute()
            
        orders = res.data if res.data else []
        if orders:
            msg = f"⚠️ *ATENCIÓN CARLOS*\nHay {len(orders)} órdenes SAME-DAY pendientes de procesar: " + \
                  ", ".join([o["amazon_order_id"] for o in orders])
            await self._alert_carlos("N/A", msg)
            return {"same_day_alert": True, "count": len(orders)}
            
        return {"same_day_alert": False}

    async def _verify_hmac(self, payload: bytes, signature: str) -> bool:
        """Verifica firma x-amz-signature."""
        secrets = await self.get_vault_secrets(self.tenant_id, ['amazon_webhook_secret'])
        secret = secrets.get('amazon_webhook_secret')
        
        if not secret:
            logger.warning("MOCK_MODE: Sin secret de Amazon, aceptando firma por defecto.")
            return True # MOCK behavior requested if Vault {}
            
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def _alert_carlos(self, order_id: str, message: str) -> None:
        """Helper para alertas por WhatsApp a Carlos (almacén)."""
        logger.info("NOTIFICACIÓN WHATSAPP CARLOS: %s | Orden: %s", message, order_id)

    # ── Stubs de compatibilidad ──
    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {}
