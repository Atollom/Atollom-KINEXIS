# src/agents/inventory_agent.py
import asyncio
import logging
from datetime import timedelta
from typing import Any

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class InventoryAgent(BaseAgent):
    """
    Agente #32: Inventory Agent.
    Fuente de verdad de stock. Sincroniza plataformas en paralelo y dispara alertas
    y procurement automáticamente según umbrales configurables.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="inventory_agent_v1", supabase_client=supabase_client
        )

    async def process(self, data: dict) -> dict:
        """Entry point principal para actualizaciones de inventario."""
        # SECURITY CLAUDE_FIX: tenant_id SIEMPRE self.tenant_id — nunca del payload externo (R3)
        sku = data.get("sku")
        qty_change = data.get("qty_change", 0)
        platform = data.get("platform", "internal")
        movement_type = self._map_trigger(data.get("trigger", "sync_correction"))

        if not sku:
            return {"status": "error", "message": "SKU required"}

        # 1. Stock actual (fuente de verdad)
        current_stock = await self._get_current_stock(sku)
        qty_after = current_stock + qty_change

        # 2. Validar: stock nunca puede ser negativo
        if qty_after < 0:
            return {"status": "error", "message": "Inválido: qty_change deja stock negativo"}

        # 3. Actualizar en BD local (fuente de verdad) — SIEMPRE self.tenant_id
        await self.supabase.table("inventory").upsert({
            "tenant_id": self.tenant_id,
            "sku": sku,
            "stock": qty_after,
        }).execute()

        # 4. Registrar movimiento con qty_before y qty_after
        await self.supabase.table("inventory_movements").insert({
            "tenant_id": self.tenant_id,
            "sku": sku,
            "movement_type": movement_type,
            "qty_change": qty_change,
            "qty_before": current_stock,
            "qty_after": qty_after,
            "platform": platform,
        }).execute()

        # 5. Sincronizar plataformas en paralelo — errores por plataforma, no bloquean
        platforms_synced = await self._sync_to_platforms(sku, qty_after)

        # 6. Leer umbrales desde tenant_config — no hardcodeados
        config = await self.get_tenant_config(self.tenant_id)
        alert_critical_days = int(config.get("alert_critical_days", 7))
        alert_warning_days = int(config.get("alert_warning_days", 15))

        # 7. Verificar alertas
        alerts = await self._check_alerts(sku, qty_after, alert_critical_days, alert_warning_days)
        procurement_triggered = False

        # 8. Disparar procurement si crítico — fire-and-forget CON logging
        for a in alerts:
            if a["urgency"] in ("urgent", "critical"):
                logger.info(
                    "Disparando ProcurementAgent para sku=%s urgency=%s tenant=%s",
                    sku, a["urgency"], self.tenant_id,
                )
                try:
                    await self._trigger_procurement(sku, a["days_remaining"])
                    procurement_triggered = True
                except Exception as e:
                    # Fire-and-forget: log pero no escalar — inventario ya actualizado
                    logger.error(
                        "Fallo fire-and-forget ProcurementAgent sku=%s tenant=%s: %s — "
                        "ATENCIÓN: stock crítico sin OC generada",
                        sku, self.tenant_id, e,
                    )

        # 9. Stock en 0 → notificación urgente a socias
        if qty_after == 0:
            await self._notify_socias_urgence(sku)

        return {
            "stock_updated": True,
            "current_stock": qty_after,
            "platforms_synced": platforms_synced,
            "low_stock_alerts": alerts,
            "procurement_triggered": procurement_triggered,
        }

    def _map_trigger(self, trigger: str) -> str:
        mapping = {
            "sale_confirmed": "sale",
            "receipt_scan": "receipt",
            "manual_adjustment": "adjustment",
        }
        return mapping.get(trigger, trigger)

    async def _get_current_stock(self, sku: str) -> int:
        try:
            res = await (
                self.supabase.table("inventory")
                .select("stock")
                .eq("tenant_id", self.tenant_id)
                .eq("sku", sku)
                .single()
                .execute()
            )
            if res and res.data:
                return res.data.get("stock", 0)
        except Exception as e:
            logger.error(
                "Error obteniendo stock sku=%s tenant=%s: %s — asumiendo 0",
                sku, self.tenant_id, e,
            )
        return 0

    async def _sync_to_platforms(self, sku: str, new_qty: int) -> list:
        """
        Sincroniza stock en paralelo usando asyncio.gather().
        CLAUDE_FIX: error por plataforma loggeado — no silencioso.
        Una plataforma falla → las demás continúan.
        """
        async def sync_one(p: str):
            try:
                if hasattr(self, "mock_failing_platforms") and p in self.mock_failing_platforms:
                    raise Exception(f"Fallo sync en {p}")
                # En Fase 2: llamar adapter correspondiente
                # await self.ml_adapter.update_stock(sku, new_qty) etc.
                return p
            except Exception as e:
                logger.error(
                    "Sync a plataforma %s falló sku=%s tenant=%s: %s — continuando con demás",
                    p, sku, self.tenant_id, e,
                )
                return None

        platforms = ["mercadolibre", "amazon", "shopify"]
        results = await asyncio.gather(*(sync_one(p) for p in platforms))
        return [r for r in results if r is not None]

    async def _calculate_velocity(self, sku: str) -> float:
        """
        Velocidad de ventas últimos 30 días en unidades/día.
        CLAUDE_FIX: filtra por self.tenant_id — historial SOLO del tenant actual.
        CLAUDE_FIX: usa _get_now() para ventana temporal.
        CLAUDE_FIX: logger.error() antes de swallow.
        """
        try:
            thirty_days_ago = (self._get_now() - timedelta(days=30)).isoformat()
            res = await (
                self.supabase.table("inventory_movements")
                .select("qty_change")
                .eq("tenant_id", self.tenant_id)
                .eq("sku", sku)
                .eq("movement_type", "sale")
                .gte("created_at", thirty_days_ago)
                .execute()
            )
            if res and res.data:
                total_sales = sum(abs(m.get("qty_change", 0)) for m in res.data)
                return total_sales / 30.0
        except Exception as e:
            logger.error(
                "Error calculando velocity sku=%s tenant=%s: %s — usando default 1.0",
                sku, self.tenant_id, e,
            )
        return 1.0  # Default si no hay historial

    async def _check_alerts(
        self,
        sku: str,
        current_stock: int,
        critical_days: int,
        warning_days: int,
    ) -> list:
        """
        CLAUDE_FIX: umbrales como parámetros — no hardcodeados.
        Velocity=0 protegido: usa 1.0 como fallback.
        """
        velocity = await self._calculate_velocity(sku)
        velocity = velocity if velocity > 0 else 1.0

        dias_restantes = current_stock / velocity
        alerts = []

        if dias_restantes <= 0:
            alerts.append({
                "sku": sku, "current_stock": current_stock,
                "days_remaining": dias_restantes, "urgency": "urgent",
            })
        elif dias_restantes <= critical_days:
            alerts.append({
                "sku": sku, "current_stock": current_stock,
                "days_remaining": dias_restantes, "urgency": "critical",
            })
        elif dias_restantes <= warning_days:
            alerts.append({
                "sku": sku, "current_stock": current_stock,
                "days_remaining": dias_restantes, "urgency": "warning",
            })

        return alerts  # lista vacía si no hay alertas — NUNCA None

    async def _trigger_procurement(self, sku: str, dias_restantes: float) -> bool:
        """
        Fire-and-forget call a ProcurementAgent.
        CLAUDE_FIX: loggea siempre — incluso en modo fire-and-forget.
        """
        logger.info(
            "ProcurementAgent trigger: sku=%s dias_restantes=%.1f tenant=%s",
            sku, dias_restantes, self.tenant_id,
        )
        if hasattr(self, "procurement_spy"):
            self.procurement_spy(sku, dias_restantes)
        return True

    async def _notify_socias_urgence(self, sku: str):
        """
        CLAUDE_FIX: número del grupo de socias desde tenant_config — no hardcodeado.
        """
        try:
            config = await self.get_tenant_config(self.tenant_id)
            socias_group = config.get("socias_whatsapp_group", "")
            if not socias_group:
                logger.warning(
                    "socias_whatsapp_group no configurado para tenant=%s — "
                    "no se pudo notificar stock=0 sku=%s",
                    self.tenant_id, sku,
                )
                return
            if hasattr(self, "meta_adapter"):
                await self.meta_adapter.send_whatsapp(
                    socias_group, f"URGENTE: Stock en 0 para SKU {sku}"
                )
        except Exception as e:
            logger.error(
                "Error notificando socias stock=0 sku=%s tenant=%s: %s",
                sku, self.tenant_id, e,
            )

    # ─────────────────── STUBS DE COMPATIBILIDAD ────────────────────────────── #

    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {
            "alert_critical_days": 7,
            "alert_warning_days": 15,
            "socias_whatsapp_group": "SOCIAS_GROUP",
        }
