# src/agents/import_logistics_agent.py
import logging
from datetime import timedelta
from typing import Any, Dict, List, Optional  # Optional used in _process_receipt signature

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent
from src.agents.inventory_agent import InventoryAgent

logger = logging.getLogger(__name__)

class ImportLogisticsAgent(BaseAgent):
    """
    Agente #35: Import Logistics Agent.
    Gestiona el ciclo de vida de las importaciones desde la OC hasta el almacén.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="import_logistics_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point compatible con BaseAgent.run()"""
        return await self.execute(data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatcher de eventos de logística.
        """
        event_type = data.get("event_type")
        shipment_id = data.get("shipment_id")

        if event_type == "po_approved":
            return await self._create_shipment(data.get("po_id"), data.get("eta_days", 30))
        
        if event_type == "eta_check_cron":
            return {"alerts_triggered": await self._check_eta_alerts()}

        if not shipment_id:
            raise ValueError("shipment_id es requerido para este evento.")

        if event_type == "customs_cleared":
            return await self._update_customs(shipment_id)
        elif event_type == "received":
            return await self._process_receipt(shipment_id, data.get("qty_received"))
        else:
            raise ValueError(f"event_type desconocido: {event_type}")

    async def _create_shipment(self, po_id: str, eta_days: int) -> Dict[str, Any]:
        """
        Crea un registro de importación basado en una OC aprobada.
        """
        try:
            # 1. Leer OC de purchase_orders (SIEMPRE filtrado por tenant_id)
            res = await self.supabase.table("purchase_orders")\
                .select("*")\
                .eq("id", po_id)\
                .eq("tenant_id", self.tenant_id)\
                .single()\
                .execute()
            
            if not res.data:
                raise ValueError(f"OC {po_id} no encontrada.")

            po = res.data
            sku = po.get("sku")
            qty = po.get("qty")

            # 2. Calcular ETA
            now = self._get_now()
            eta = (now + timedelta(days=eta_days)).date()

            # 3. INSERT import_shipments
            shipment_data = {
                "tenant_id": self.tenant_id,
                "po_id": po_id,
                "sku": sku,
                "qty": qty,
                "status": "in_transit",
                "eta": eta.isoformat(),
                "eta_original": eta.isoformat()
            }
            
            ins_res = await self.supabase.table("import_shipments").insert(shipment_data).execute()
            shipment = ins_res.data[0]

            return {
                "shipment_id": shipment.get("id"),
                "status": "in_transit",
                "eta": eta.isoformat()
            }
        except Exception as e:
            logger.error("Error en _create_shipment po=%s: %s", po_id, e)
            raise

    async def _update_customs(self, shipment_id: str) -> Dict[str, Any]:
        """
        Marca la importación como liberada en aduana y notifica al almacén.
        """
        try:
            await self.supabase.table("import_shipments")\
                .update({
                    "status": "customs_cleared",
                    "updated_at": self._get_now().isoformat()
                })\
                .eq("id", shipment_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()
            
            # Notificar Carlos (almacén)
            config = await self.get_tenant_config(self.tenant_id)
            carlos_num = config.get("warehouse_whatsapp")
            
            alert_sent = False
            if carlos_num:
                msg = "Tu importación está en aduana liberada. Estará en el almacén pronto."
                alert_sent = await self.meta_adapter.send_whatsapp(carlos_num, msg)
            
            return {
                "status": "customs_cleared",
                "alert_sent": alert_sent
            }
        except Exception as e:
            logger.error("Error en _update_customs shipment=%s: %s", shipment_id, e)
            raise

    async def _process_receipt(self, shipment_id: str, qty_received: Optional[int] = None) -> Dict[str, Any]:
        """
        Procesa la recepción física, actualiza inventario y verifica discrepancias.
        qty_received: cantidad físicamente recibida (del scanner/WMS). Si None, se asume sin discrepancia.
        qty de BD es SIEMPRE la fuente de verdad para actualizar inventario — nunca del payload.
        """
        try:
            # 1. Leer qty DE LA BASE DE DATOS (Crítico: previene manipulación de stock)
            res = await self.supabase.table("import_shipments")\
                .select("*")\
                .eq("id", shipment_id)\
                .eq("tenant_id", self.tenant_id)\
                .single()\
                .execute()

            if not res.data:
                raise ValueError("Importación no encontrada.")

            shipment = res.data
            sku = shipment.get("sku")
            qty_expected = shipment.get("qty")  # Fuente de verdad: BD

            # 2. Verificar discrepancia ANTES de actualizar inventario
            discrepancy = False
            if qty_received is not None and qty_received != qty_expected:
                discrepancy = True
                logger.warning(
                    "Discrepancia de cantidad shipment=%s tenant=%s sku=%s: esperado=%s recibido=%s",
                    shipment_id, self.tenant_id, sku, qty_expected, qty_received,
                )
                # Escalar a socias (best-effort)
                try:
                    config = await self.get_tenant_config(self.tenant_id)
                    partners = config.get("partner_whatsapp", [])
                    if not isinstance(partners, list):
                        partners = [partners] if partners else []
                    msg = (
                        f"⚠️ DISCREPANCIA EN RECEPCIÓN\n"
                        f"Shipment: {shipment_id}\nSKU: {sku}\n"
                        f"Esperado: {qty_expected} | Recibido: {qty_received}"
                    )
                    for p in partners:
                        await self.meta_adapter.send_whatsapp(p, msg)
                except Exception as notify_err:
                    logger.error("Error notificando discrepancia shipment=%s: %s", shipment_id, notify_err)

            # 3. UPDATE status
            now = self._get_now()
            await self.supabase.table("import_shipments")\
                .update({
                    "status": "received",
                    "received_at": now.isoformat(),
                    "updated_at": now.isoformat()
                })\
                .eq("id", shipment_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()

            # 4. Llamar InventoryAgent con mismo tenant_id — qty SIEMPRE de BD
            inv_agent = InventoryAgent(self.tenant_id, self.supabase)
            inv_res = await inv_agent.process({
                "trigger": "receipt_scan",
                "sku": sku,
                "qty_change": qty_expected,  # qty de BD, nunca del payload
                "platform": "import"
            })

            return {
                "received": True,
                "status": "received",
                "inventory_updated": inv_res.get("stock_updated", False),
                "current_stock": inv_res.get("current_stock"),
                "discrepancy": discrepancy,
            }
        except Exception as e:
            logger.error("Error en _process_receipt shipment=%s: %s", shipment_id, e)
            raise

    async def _check_eta_alerts(self) -> List[str]:
        """
        Revisa retrasos en ETA y envía alertas. Corre como cron 'eta_check_cron'.
        """
        try:
            now = self._get_now().date().isoformat()
            
            # Buscar embarques in_transit con ETA vencida y sin alerta enviada
            res = await self.supabase.table("import_shipments")\
                .select("*")\
                .eq("tenant_id", self.tenant_id)\
                .eq("status", "in_transit")\
                .eq("alert_sent", False)\
                .lt("eta", now)\
                .execute()
            
            delayed_shipments = res.data if res.data else []
            alerts_sent = []

            config = await self.get_tenant_config(self.tenant_id)
            alert_days_threshold = config.get("import_eta_alert_days", 3)
            partners = config.get("partner_whatsapp", [])
            if not isinstance(partners, list):
                partners = [partners] if partners else []

            for s in delayed_shipments:
                # Verificar si el retraso supera el umbral
                eta_dt = self._parse_date(s["eta"])
                if self._get_now().date() > eta_dt + timedelta(days=alert_days_threshold):
                    # Enviar alerta
                    msg = f"⚠️ *ALERTA IMPORTACIÓN RETRASADA*\nSKU: {s['sku']}\nETA original: {s['eta']}\nStatus: {s['status']}"
                    
                    for p in partners:
                        await self.meta_adapter.send_whatsapp(p, msg)
                    
                    # Marcar alerta enviada — tenant_id siempre (IDOR prevention)
                    await self.supabase.table("import_shipments")\
                        .update({"alert_sent": True})\
                        .eq("id", s["id"])\
                        .eq("tenant_id", self.tenant_id)\
                        .execute()

                    # Registrar en routing_logs para auditoría
                    try:
                        await self.supabase.table("routing_logs").insert({
                            "tenant_id": self.tenant_id,
                            "agent": "import_logistics_agent",
                            "event": "eta_alert_sent",
                            "shipment_id": s["id"],
                            "created_at": self._get_now().isoformat(),
                        }).execute()
                    except Exception as log_err:
                        logger.error("Error insertando routing_log shipment=%s: %s", s["id"], log_err)

                    alerts_sent.append(s["id"])

            return alerts_sent
        except Exception as e:
            logger.error("Error en _check_eta_alerts: %s", e)
            return []

    def _parse_date(self, date_str: str) -> Any:
        from datetime import datetime
        return datetime.fromisoformat(date_str).date()

    # ── Stubs de compatibilidad ──
    async def get_vault_secrets(self, _tenant_id: str, _keys: List[str]) -> Dict[str, Any]:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> Dict[str, Any]:
        return {
            "warehouse_whatsapp": "521234567890",
            "import_eta_alert_days": 3,
            "partner_whatsapp": ["521111111111"]
        }
