# src/agents/shopify_orders_agent.py
import logging
from typing import Any, Dict, List, Optional
from src.agents.base_agent import BaseAgent
from src.adapters.shopify_adapter import ShopifyAdapter
from src.adapters.skydrop_adapter import SkyDropAdapter

logger = logging.getLogger(__name__)

class ShopifyOrdersAgent(BaseAgent):
    """
    Agente #11: Shopify Orders Agent.
    Procesa pagos de Shopify, genera etiquetas en SkyDrop y cumple órdenes.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="shopify_orders_agent_v1", supabase_client=supabase_client
        )
        self.shopify_adapter = ShopifyAdapter(tenant_id=tenant_id, db_client=self)
        self.skydrop_adapter = SkyDropAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatcher de eventos de Shopify."""
        event_type = data.get("event_type")
        
        # 1. VERIFICACIÓN HMAC
        signature = data.get("x-shopify-hmac-sha256")
        if signature:
            # Nota: verify_webhook() recibe payload en bytes
            raw_payload = data.get("raw_payload", b"")
            if not await self.shopify_adapter.verify_webhook(raw_payload, signature):
                logger.error("Firma HMAC de Shopify inválida para tenant %s", self.tenant_id)
                return {"status": "failed", "error": "Invalid HMAC"}

        # 2. RUTEO
        if event_type == "order_paid":
            return await self._process_order_paid(data.get("shopify_order_id"), data.get("order_data", {}))
        elif event_type == "fulfillment_request":
            return await self._process_fulfillment(data.get("shopify_order_id"))
        else:
            raise ValueError(f"event_type desconocido: {event_type}")

    async def _process_order_paid(self, shopify_order_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crea registro local y genera etiqueta en SkyDrop."""
        if not shopify_order_id:
            raise ValueError("shopify_order_id es requerido.")

        # 1. INSERT shopify_orders initial status
        try:
            order_record = {
                "tenant_id": self.tenant_id,
                "shopify_order_id": shopify_order_id,
                "status": "pending"
            }
            await self.supabase.table("shopify_orders").insert(order_record).execute()
        except Exception as e:
            if "duplicate key" in str(e).lower():
                logger.info("Orden Shopify %s ya existe.", shopify_order_id)
            else:
                logger.error("Error al guardar orden Shopify %s: %s", shopify_order_id, e)

        # 2. Solicitar guía a SkyDrop
        # Carlos (almacén) requiere peso y dimensiones
        # Si no hay, usar Small Box default: 20x20x20 cm / 1kg
        # Se asume que order_data contiene la info de envío sanitizada
        
        # Lógica de fallback de dimensiones sugerida en S11
        if not order_data.get("weight") or not order_data.get("dimensions"):
            logger.warning("Dimensiones faltantes para Shopify order %s. Usando Small Box default.", shopify_order_id)
            order_data["weight"] = 1.0
            order_data["dimensions"] = {"height": 20, "width": 20, "length": 20}
            # Marcar SKU para Carlos (en logs)
            sku = order_data.get("line_items", [{}])[0].get("sku", "N/A")
            logger.warning("CARLOS_ACTION: Actualizar dimensiones en BD para SKU: %s", sku)

        try:
            label_res = await self.skydrop_adapter.create_shipment(order_data)
            
            # 3. UPDATE status label_created
            await self.supabase.table("shopify_orders")\
                .update({
                    "status": "label_created",
                    "tracking_number": label_res.get("tracking_number"),
                    "tracking_company": label_res.get("carrier"),
                    "label_url": label_res.get("label_url"),
                    "updated_at": self._get_now().isoformat()
                })\
                .eq("shopify_order_id", shopify_order_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()
            
            # Alerta Carlos
            await self._notify_carlos(shopify_order_id, f"Nueva etiqueta SkyDrop: {label_res.get('tracking_number')}")

            return {
                "order_processed": True,
                "label_created": True,
                "tracking_number": label_res.get("tracking_number"),
                "status": "label_created"
            }

        except Exception as e:
            logger.error("Fallo al generar etiqueta SkyDrop para %s: %s", shopify_order_id, e)
            return {
                "order_processed": True,
                "label_created": False,
                "status": "pending",
                "error": str(e)
            }

    async def _process_fulfillment(self, shopify_order_id: str) -> Dict[str, Any]:
        """Lee tracking de BD y marca fulfillment en Shopify."""
        # LEER DE BD — NUNCA DEL PAYLOAD
        res = await self.supabase.table("shopify_orders")\
            .select("tracking_number, tracking_company")\
            .eq("shopify_order_id", shopify_order_id)\
            .eq("tenant_id", self.tenant_id)\
            .single()\
            .execute()
            
        if not res.data:
            return {"fulfillment_confirmed": False, "error": "order_not_found"}
            
        tracking = res.data.get("tracking_number")
        carrier = res.data.get("tracking_company")
        
        if not tracking:
            logger.warning("Sin tracking para fulfill Shopify %s", shopify_order_id)
            return {"fulfillment_confirmed": False, "status": "no_tracking"}

        # Shopify call
        await self.shopify_adapter.fulfill_order(shopify_order_id, tracking, carrier or "Estafeta")
        
        # UPDATE BD
        await self.supabase.table("shopify_orders")\
            .update({"status": "shipped", "updated_at": self._get_now().isoformat()})\
            .eq("shopify_order_id", shopify_order_id)\
            .eq("tenant_id", self.tenant_id)\
            .execute()

        return {"fulfillment_confirmed": True, "status": "shipped"}

    async def _notify_carlos(self, order_id: str, text: str) -> None:
        """Notificación a Carlos vía WhatsApp stub."""
        logger.info("NOTIF_CARLOS: %s | Orden: %s", text, order_id)
