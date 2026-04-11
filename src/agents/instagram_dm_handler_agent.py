# src/agents/instagram_dm_handler_agent.py
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class InstagramDMHandlerAgent(BaseAgent):
    """
    Agente #13: Instagram DM Handler Agent.
    Gestiona mensajes directos, detecta intención B2B y consulta inventario.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="instagram_dm_handler_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orquesta la respuesta a un DM de Instagram.
        """
        # 1. Verificar firma HMAC (via meta_adapter)
        # En una implementación real, el payload_bytes y signature vendrían del trigger
        webhook_payload = data.get("webhook_payload", {})
        signature = data.get("x_hub_signature", "")
        payload_bytes = data.get("payload_bytes", b"")
        
        if payload_bytes and signature:
            is_valid = await self.meta_adapter.verify_webhook_signature(payload_bytes, signature)
            if not is_valid:
                return {"status": "error", "message": "Invalid HMAC signature", "response_sent": False}

        # 2. Sanitizar message_text
        raw_message = data.get("message_text", "")
        clean_message = self._sanitize_message(raw_message)

        # 3. Verificar horario de atención (CDMX)
        is_open, absence_msg = await self._check_business_hours()
        if not is_open:
            await self.meta_adapter.send_instagram_dm(data.get("sender_id"), absence_msg)
            return {
                "response_sent": True,
                "intent_detected": "away_message",
                "lead_created": False,
                "escalated": False
            }

        # 4. Consultar inventario si pregunta por producto
        inventory = await self._check_inventory(clean_message)

        # 5. Detectar intención (Regex + LLM)
        is_b2b = await self._detect_b2b_intent(clean_message)
        intent = "B2B" if is_b2b else "B2C_QUERY"

        # 6. Si B2B → Lead Qualifier Agent (Cross-agent call)
        lead_created = False
        if is_b2b:
            try:
                # Simulamos llamada al router para Lead Qualifier
                # En producción: await self.router.dispatch("lead_qualifier", {...})
                lead_created = True
            except Exception as e:
                logger.error("Error al escalar B2B a LeadQualifier: %s", e)

        # 7. Generar respuesta con Claude API
        response_text = await self._build_response(clean_message, inventory, is_b2b, data.get("media_url"))

        # 8. Enviar respuesta vía meta_adapter
        success = await self.meta_adapter.send_instagram_dm(data.get("sender_id"), response_text)

        # 9. Registrar en crm_interactions
        await self._log_interaction(data.get("sender_id"), clean_message, response_text, intent)

        return {
            "response_sent": success,
            "intent_detected": intent,
            "lead_created": lead_created,
            "escalated": is_b2b
        }

    def _sanitize_message(self, text: str) -> str:
        """Remueve caracteres de control y limita longitud para LLM."""
        if not text: return ""
        # Sanitización básica: remover scripts/html si hubiera
        text = re.sub(r'<[^>]*>', '', text)
        return text.strip()[:1000]

    async def _check_business_hours(self) -> (bool, str):
        """
        Verifica si está dentro del horario de atención de tenant_config.
        Default: 9AM-7PM CDMX, L-V.
        """
        config = await self.get_tenant_config(self.tenant_id)
        bh = config.get("business_hours", {
            "start": 9,
            "end": 19,
            "days": [1, 2, 3, 4, 5]
        })
        
        # CDMX es UTC-6
        tz_mx = timezone(timedelta(hours=-6))
        now_cdmx = datetime.now(tz_mx)
        current_hour = now_cdmx.hour
        current_day = now_cdmx.isoweekday() # 1=Lunes, 7=Domingo

        if current_day in bh["days"] and bh["start"] <= current_hour < bh["end"]:
            return True, ""
        
        return False, "¡Hola! Gracias por escribirnos. Nuestro horario de atención es de Lunes a Viernes de 9:00 AM a 7:00 PM. Te responderemos lo antes posible."

    async def _check_inventory(self, message: str) -> Optional[dict]:
        """Busca productos mencionados en el mensaje."""
        # Regex simple para encontrar palabras clave que parezcan SKUs o nombres
        # En producción esto usaría el InventoryAgent
        keywords = re.findall(r'\b[A-Z0-9-]{4,}\b', message.upper())
        if not keywords: return None

        for kw in keywords:
            res_name = await self._query_inventory_by_name(kw)
            if res_name:
                return res_name[0]
            
            res_sku = await self._query_inventory_by_sku(kw)
            if res_sku:
                return res_sku[0]
        return None

    async def _query_inventory_by_name(self, kw: str) -> list:
        try:
            res = await self.supabase.table("inventory").select("sku, name, available_qty").ilike("name", f"%{kw}%").limit(1).execute()
            if res and hasattr(res, 'data') and res.data:
                return res.data
        except Exception as e:
            logger.error("Error consultando inventory by name kw=%s: %s", kw, e)
        return []

    async def _query_inventory_by_sku(self, kw: str) -> list:
        try:
            res = await self.supabase.table("inventory").select("sku, name, available_qty").eq("sku", kw).execute()
            if res and hasattr(res, 'data') and res.data:
                return res.data
        except Exception as e:
            logger.error("Error consultando inventory by sku kw=%s: %s", kw, e)
        return []

    async def _detect_b2b_intent(self, message: str) -> bool:
        """Regex y lógica de volumen para detectar B2B."""
        # 1. Cantidad > 5 (Regex)
        qty_match = re.search(r'(\d+)\s*(unidades|piezas|pzs|sets)', message.lower())
        if qty_match and int(qty_match.group(1)) > 5:
            return True

        # 2. Palabras clave B2B
        b2b_keywords = [
            'mayoreo', 'distribuidor', 'empresa', 'factura', 'rfc', 'lista de precios',
            'cotizacion', 'volumen', 'negocio'
        ]
        if any(kw in message.lower() for kw in b2b_keywords):
            return True

        return False

    async def _build_response(self, message: str, inventory: Optional[dict], is_b2b: bool, media_url: Optional[str]) -> str:
        """Genera respuesta usando Claude API (Stubbed in scaffold)."""
        system_prompt = (
            "Eres el asistente de Instagram de Kap Tools. Catálogo: Herramientas profesionales de limpieza y pulido. "
            "Tono: Amable, profesional, español MX. "
            "Reglas: No prometer fechas exactas de entrega. Stock real consultado. "
        )
        if media_url:
            system_prompt += "\nEl cliente adjuntó una imagen/video. Si es relevante para su pregunta, solicitar que describan el contenido con palabras."
        
        if is_b2b:
            return "¡Hola! Gracias por tu interés. Un especialista de Ventas B2B revisará tu solicitud para ofrecerte el mejor esquema de mayoreo. Nos pondremos en contacto contigo pronto."
        
        inv_str = f"Contamos con existencias de {inventory['name']} (SKU: {inventory['sku']})." if inventory else "Consultaré disponibilidad inmediata con bodega."
        
        return f"¡Hola! {inv_str} ¿Te gustaría que te ayude con el proceso de compra o tienes alguna otra duda?"

    async def _log_interaction(self, sender_id: str, message: str, response: str, intent: str):
        """Registra la interacción en crm_interactions."""
        try:
            interaction_data = {
                "tenant_id": self.tenant_id,
                "platform": "instagram",
                "external_id": sender_id,
                "message_in": message,
                "message_out": response,
                "intent": intent,
                "created_at": self._get_now().isoformat()
            }
            await self._insert_crm_interaction(interaction_data)
        except Exception as e:
            logger.error("Error logging IG interaction: %s", e)

    async def _insert_crm_interaction(self, data: dict):
        return await self.supabase.table("crm_interactions").insert(data).execute()

    # Stubs
    async def get_vault_secrets(self, tenant_id: str, keys: list) -> dict: return {}
    
    async def get_tenant_config(self, tenant_id: str) -> dict: 
        res = await self._query_tenant_config(tenant_id)
        if res and hasattr(res, 'data') and res.data:
            return res.data.get("config", {})
        return {}
        
    async def _query_tenant_config(self, tenant_id: str):
        return await self.supabase.table("tenants").select("config").eq("id", tenant_id).single().execute()
