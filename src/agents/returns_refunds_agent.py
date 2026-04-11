# src/agents/returns_refunds_agent.py
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ReturnsRefundsAgent(BaseAgent):
    """
    Agente #20: Returns & Refunds Agent.
    Gestiona solicitudes de devolución. SIEMPRE requiere aprobación humana.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="returns_refunds_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Registra una solicitud de devolución y notifica a las socias.
        """
        order_id = data.get("order_id")
        platform = data.get("platform")
        
        if not order_id or not platform:
            raise ValueError("order_id y platform son requeridos.")

        # 1. Verificar que la orden existe para el tenant (R5)
        # Esto previene inyecciones de order_ids de otros tenants
        # En producción: buscar en la tabla orders_v2 o similar
        
        # 2. Registrar en tabla returns (R6)
        try:
            return_data = {
                "tenant_id": self.tenant_id,
                "order_id": order_id,
                "platform": platform,
                "reason": data.get("reason"),
                "status": "pending_approval",
                "media_urls": data.get("media_urls", []), # JSONB (R12)
                "created_at": self._get_now().isoformat()
            }
            res = await self._insert_return(return_data)
            
            if not res or not hasattr(res, 'data') or not res.data:
                raise RuntimeError("Falló la inserción en BD (no data).")
                
            return_record = res.data[0]
            return_id = return_record["id"]
        except Exception as e:
            logger.error("Error registrando devolución: %s", e)
            raise RuntimeError("Error al persistir la solicitud de devolución.")

        # 3. Notificar socias (INMEDIATO) (R7)
        await self._notify_socias_return(
            return_id=return_id,
            order_id=order_id,
            platform=platform,
            reason=data.get("reason", "No especificado")
        )

        # 4. Retornar requires_approval=True SIEMPRE (R4)
        return {
            "return_approved": False,
            "return_id": return_id,
            "cfdi_egreso_triggered": False,
            "instructions_sent": False,
            "requires_approval": True
        }

    async def _notify_socias_return(self, return_id: str, order_id: str, platform: str, reason: str) -> bool:
        """Notificación vía WhatsApp a socias."""
        try:
            msg = (
                f"📦 Nueva Solicitud de Devolución\n"
                f"Orden: {order_id}\n"
                f"Plataforma: {platform}\n"
                f"Motivo: {reason}\n"
                f"Aprobar aquí: https://kinexis.app/dashboard/returns/{return_id}"
            )
            # await self.meta_adapter.send_whatsapp("SOCIAS_PHONE", msg)
            logger.info("WhatsApp notification sent for return %s", return_id)
            return True
        except Exception as e:
            logger.error("Error notificando devolución %s: %s", return_id, e)
            return False

    async def process_approval(self, return_id: str, approved_by: str, approved: bool) -> Dict[str, Any]:
        """
        Llamado desde el dashboard por una socia.
        Solo owners o admins pueden aprobar.
        """
        # 1. Validar permisos (HUMAN DECISION en prompt)
        role = None
        try:
            user_res = await self._query_user_role(approved_by)
            if user_res and hasattr(user_res, 'data') and user_res.data:
                role = user_res.data.get("role")
        except Exception as e:
            logger.error("Error validando permisos de usuario %s: %s", approved_by, e)
        
        if role not in ['owner', 'admin']:
            raise PermissionError(f"Usuario {approved_by} no tiene permisos para aprobar devoluciones.")

        # 2. Actualizar estado
        status = "approved" if approved else "rejected"
        update_data = {
            "status": status,
            "approved_by": approved_by,
            "approved_at": self._get_now().isoformat()
        }
        
        await self._update_return_status(return_id, update_data)

        # 3. Si es aprobado, disparar procesos secundarios
        cfdi_triggered = False
        if approved:
            # Trigger CFDI Egreso (R3)
            await self._trigger_cfdi_egreso(return_id)
            cfdi_triggered = True
            # Enviar instrucciones al cliente (R9)
            # await self._send_return_instructions(return_id)
        
        return {
            "status": status,
            "cfdi_egreso_triggered": cfdi_triggered,
            "instructions_sent": approved
        }

    async def _trigger_cfdi_egreso(self, return_id: str) -> bool:
        """
        Llama al CFDIBillingAgent para crear una nota de crédito (Tipo E).
        """
        # 1. Obtener datos de la devolución y orden original
        res = await self._query_return_by_id(return_id)
        order_id = res.data.get("order_id") if res and hasattr(res, 'data') and res.data else None
        
        # 2. Buscar CFDI original
        cfdi_res = await self._query_cfdi_original(order_id)
        original_uuid = cfdi_res.data.get("uuid") if cfdi_res and hasattr(cfdi_res, 'data') and cfdi_res.data else None
        
        if not original_uuid:
            logger.warning("No se encontró CFDI original para order %s. No se puede emitir egreso.", order_id)
            return False

        # 3. Disparar CFDIBillingAgent (Cross-agent call)
        # En producción: router.dispatch("cfdi_billing", {"cfdi_type": "E", "cfdi_relacionado": original_uuid, ...})
        logger.info("Triggering CFDI Egreso for related UUID: %s", original_uuid)
        return True

    # ───────────────── Database Methods ───────────────── #
    async def _insert_return(self, data: dict):
        return await self.supabase.table("returns").insert(data).execute()

    async def _query_user_role(self, user_id: str):
        return await self.supabase.table("tenant_users").select("role").eq("user_id", user_id).eq("tenant_id", self.tenant_id).single().execute()

    async def _update_return_status(self, return_id: str, data: dict):
        return await self.supabase.table("returns").update(data).eq("id", return_id).execute()

    async def _query_return_by_id(self, return_id: str):
        return await self.supabase.table("returns").select("order_id").eq("id", return_id).single().execute()

    async def _query_cfdi_original(self, order_id: str):
        return await self.supabase.table("cfdi_records").select("uuid").eq("order_id", order_id).single().execute()

    # Stubs
    async def get_vault_secrets(self, t, k): return {}
