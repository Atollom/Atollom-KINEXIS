import logging
from typing import Any, Dict, List, Optional
from src.adapters.amazon_adapter import AmazonAdapter
from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class AmazonFBAManagerAgent(BaseAgent):
    """
    Agente #8: Amazon FBA Manager.
    Monitorea inventario FBA y sugiere reorders/envíos.
    NOTIFY mode.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="amazon_fba_manager_agent_v1", supabase_client=supabase_client
        )
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        stock_check → _check_fba_stock()
        create_shipment → _create_shipment_plan()
        """
        trigger = data.get("trigger")
        sku = data.get("sku")

        if not trigger:
            raise ValueError("trigger es obligatorio")

        if trigger == "stock_check":
            if not sku: raise ValueError("sku es obligatorio para stock_check")
            return await self._check_fba_stock(sku)
        
        elif trigger == "create_shipment":
            if not sku: raise ValueError("sku es obligatorio para create_shipment")
            # qty de BD no payload si no viene específico
            qty = data.get("quantity")
            if not qty:
                 # Simular lectura de sugerencia
                 qty = 50
            return await self._create_shipment_plan(sku, int(qty))
            
        elif trigger == "shipment_status":
            return await self._check_shipment_status(data.get("shipment_id"))
            
        else:
            raise ValueError(f"Unknown trigger: {trigger}")

    async def _check_fba_stock(self, sku: str) -> dict:
        # Mock stock check
        # En producción: await self.amazon_adapter.get_fba_inventory(sku)
        stock_qty = 15 # mock
        avg_daily_sales = 2.0 # mock
        
        days_remaining = stock_qty / avg_daily_sales
        
        reorder_needed = False
        alert_type = None
        
        if days_remaining <= 7:
            alert_type = "URGENTE"
            reorder_needed = True
            await self._notify_socias(f"ALERTA FBA URGENTE: {sku} tiene solo {days_remaining} días de stock.")
        elif days_remaining <= 30:
            alert_type = "REORDER_SITUATION"
            reorder_needed = True
            await self._notify_socias(f"Alerta FBA: {sku} tiene {days_remaining} días de stock. Sugerimos reorder.")

        return {
            "fba_stock_levels": {"sku": sku, "qty": stock_qty, "days_remaining": days_remaining},
            "reorder_needed": reorder_needed,
            "alert_type": alert_type
        }

    async def _create_shipment_plan(self, sku: str, qty: int) -> dict:
        # 1. Verificar FNSKU
        fnsku = await self._get_fnsku(sku)
        if not fnsku:
            raise ValueError(f"No se puede crear shipment: SKU {sku} no tiene FNSKU configurado.")

        # 2. amazon_adapter: create_inbound_shipment()
        shipment_res = await self.amazon_adapter.create_inbound_shipment(sku, qty)
        
        # 3. Guardar en fba_shipments
        await self.supabase.table("fba_shipments").insert({
            "tenant_id": self.tenant_id,
            "sku": sku,
            "fnsku": fnsku,
            "quantity": qty,
            "shipment_id": shipment_res.get("shipment_id"),
            "status": "planned"
        }).execute()

        await self._notify_socias(f"Plan de envío FBA creado: {sku} x {qty}. ID: {shipment_res.get('shipment_id')}")

        return {
            "shipment_created": True,
            "shipment_id": shipment_res.get("shipment_id"),
            "fnsku": fnsku
        }

    async def _get_fnsku(self, sku: str) -> Optional[str]:
        res = await self.supabase.table("products").select("fnsku").eq("tenant_id", self.tenant_id).eq("sku", sku).single().execute()
        return res.data.get("fnsku") if res and hasattr(res, 'data') and res.data else None

    async def _check_shipment_status(self, sid: str) -> dict:
        return {"status": "planned"}

    async def _notify_socias(self, msg: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception as e:
            logger.error("Error notificando socias FBA: %s", e)

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
