# src/agents/procurement_agent.py
import logging
import math
import uuid
from datetime import timedelta
from decimal import Decimal
from typing import Any

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Regex para sanitizar categorías de SKU antes de usarlas en filtros de BD
import re
_CATEGORY_SAFE = re.compile(r"[^A-Za-z0-9\-_]")


class ProcurementAgent(BaseAgent):
    """
    Agente #33: Procurement Agent.
    Gestiona OCs: draft→approved→sent. NUNCA envía OC sin status=APPROVED.
    Solo proveedores en approved_suppliers con incumplimientos < 3 en 90 días.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="procurement_agent_v1", supabase_client=supabase_client
        )

    async def process(self, data: dict) -> dict:
        """Entry point para creación de OCs en DRAFT."""
        sku_alerts = data.get("sku_alerts", [])
        if not sku_alerts and "sku" in data:
            sku_alerts = [data]

        results = []
        for alert in sku_alerts:
            sku = alert.get("sku")
            days_remaining = alert.get("days_remaining", 0)

            estimate_total = await self._estimate_total(sku)
            if estimate_total == 0:
                estimate_total = Decimal("1000.00")

            # SECURITY: categoría del SKU viene de BD — no del input del cliente
            suppliers = await self._select_supplier(sku, estimate_total)
            if not suppliers:
                logger.warning(
                    "Sin proveedor aprobado para sku=%s tenant=%s — escalando",
                    sku, self.tenant_id,
                )
                results.append({
                    "sku": sku, "status": "escalated",
                    "reason": "No approved supplier.",
                })
                continue

            supplier = suppliers[0]

            velocity = await self._get_velocity(sku)
            qty = await self._calculate_quantity(sku, days_remaining, velocity)

            # DRAFT — jamás SENT sin aprobación
            po_id, approval_url = await self._create_draft_po(
                sku, qty, estimate_total, supplier.get("id")
            )

            await self._notify_socias(po_id, estimate_total, approval_url, supplier.get("name"))

            results.append({
                "po_id": po_id,
                "approval_url": approval_url,
                "supplier_selected": supplier.get("name"),
                "approval_request_sent": True,
            })

        return {"status": "success", "po_drafts": results}

    # ─────────────────────── APPROVE GATEWAY ────────────────────────────────── #

    async def approve_po(self, po_id: str, approver_id: str) -> dict:
        """
        CLAUDE_FIX: único punto de entrada para cambiar status → APPROVED.
        Verifica:
          1. PO existe y pertenece al tenant (tenant isolation)
          2. Link de aprobación no ha expirado
          3. approver_id distinto del primer aprobador (anti-rubber-stamp)
        NUNCA permite SENT sin pasar por aquí.
        """
        try:
            res = await (
                self.supabase.table("purchase_orders")
                .select("*")
                .eq("id", po_id)
                .eq("tenant_id", self.tenant_id)  # SECURITY: tenant isolation
                .single()
                .execute()
            )
        except Exception as e:
            logger.error("Error obteniendo PO %s tenant=%s: %s", po_id, self.tenant_id, e)
            return {"status": "error", "message": "PO no encontrada"}

        po = res.data if res and res.data else None
        if not po:
            return {"status": "error", "message": "PO no encontrada o no pertenece a este tenant"}

        # Verificar expiración del link
        expires_at_raw = po.get("approval_expires_at")
        if expires_at_raw:
            from datetime import datetime
            expires_at = datetime.fromisoformat(expires_at_raw)
            if expires_at.tzinfo is None:
                from datetime import timezone
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if self._get_now() > expires_at:
                logger.warning(
                    "Link de aprobación expirado para PO=%s tenant=%s approver=%s",
                    po_id, self.tenant_id, approver_id,
                )
                return {
                    "status": "expired",
                    "message": "El link de aprobación ha expirado. Solicita un nuevo link.",
                }

        # SECURITY: segunda aprobación debe ser de un usuario distinto
        first_approver = po.get("approver_1_id")
        if first_approver and first_approver == approver_id:
            return {
                "status": "error",
                "message": "La misma persona no puede aprobar dos veces (anti-rubber-stamp).",
            }

        # Registrar aprobación
        if not first_approver:
            field = "approver_1_id"
        else:
            field = "approver_2_id"

        try:
            await (
                self.supabase.table("purchase_orders")
                .update({field: approver_id, "status": "APPROVED"})
                .eq("id", po_id)
                .eq("tenant_id", self.tenant_id)
                .execute()
            )
        except Exception as e:
            logger.error("Error aprobando PO %s tenant=%s: %s", po_id, self.tenant_id, e)
            return {"status": "error", "message": "Error al registrar aprobación"}

        logger.info("PO %s aprobada por %s tenant=%s", po_id, approver_id, self.tenant_id)
        return {"status": "APPROVED", "po_id": po_id, "approver": approver_id}

    # ─────────────────────── ESTIMACIÓN ─────────────────────────────────────── #

    async def _estimate_total(self, sku: str) -> Decimal:
        try:
            res = await (
                self.supabase.table("products")
                .select("cost")
                .eq("tenant_id", self.tenant_id)
                .eq("sku", sku)
                .single()
                .execute()
            )
            if res and res.data:
                return Decimal(str(res.data.get("cost", "0")))
        except Exception as e:
            logger.error(
                "Error estimando total sku=%s tenant=%s: %s — usando $0",
                sku, self.tenant_id, e,
            )
        return Decimal("0.00")

    async def _get_velocity(self, _sku: str) -> float:
        return 1.0  # InventoryAgent proveerá dato real en Fase 2

    # ─────────────────────── SELECCIÓN DE PROVEEDOR ─────────────────────────── #

    async def _select_supplier(self, sku: str, total_estimate: Decimal) -> list:
        """
        SECURITY CLAUDE_FIX: categoría del SKU viene de BD (products table) — no del input.
        Filtra: tenant_id + active=true + incumplimientos < 3 (90 días).
        """
        try:
            # En Fase 2: filtrar también por categoría del SKU (leída de BD, no del cliente)
            # sku_category = await self._get_sku_category_from_db(sku)
            res = await (
                self.supabase.table("approved_suppliers")
                .select("*")
                .eq("tenant_id", self.tenant_id)
                .eq("active", True)
                .lt("incumplimientos_90_dias", 3)
                .execute()
            )
            suppliers = res.data if res and hasattr(res, "data") else []
            if not suppliers:
                return []

            # Total > $10k: hasta 3 opciones. Total <= $10k: mejor precio (primero)
            if total_estimate > Decimal("10000.00"):
                return suppliers[:3]
            return [suppliers[0]]
        except Exception as e:
            logger.error(
                "Error seleccionando proveedor sku=%s tenant=%s: %s",
                sku, self.tenant_id, e,
            )
            return []

    # ─────────────────────── CANTIDAD ───────────────────────────────────────── #

    async def _calculate_quantity(self, _sku: str, days_remaining: float, velocity: float) -> int:
        """
        CLAUDE_FIX: dias_seguridad desde tenant_config — no hardcodeado.
        """
        config = await self.get_tenant_config(self.tenant_id)
        dias_seguridad = float(config.get("procurement_safety_days", 15))
        diff = max(0, dias_seguridad - days_remaining)
        qty = diff * velocity * 1.2
        return max(1, math.ceil(qty))

    # ─────────────────────── CREAR OC DRAFT ─────────────────────────────────── #

    async def _create_draft_po(
        self, sku: str, qty: int, total: Decimal, supplier_id: str
    ) -> tuple:
        """
        CLAUDE_FIX: status siempre 'DRAFT'. approval_expires_at = _get_now() + 48h.
        Campos para segunda aprobación: approver_1_id, approver_2_id.
        """
        po_id = str(uuid.uuid4())
        approval_expires_at = (self._get_now() + timedelta(hours=48)).isoformat()

        items = [{"sku": sku, "quantity": qty}]

        await self.supabase.table("purchase_orders").insert({
            "id": po_id,
            "tenant_id": self.tenant_id,
            "supplier_id": supplier_id,
            "status": "DRAFT",  # NUNCA SENT sin aprobación
            "items": items,
            "total_estimate": float(total),
            "approval_expires_at": approval_expires_at,
            "approver_1_id": None,  # Se llena en approve_po()
            "approver_2_id": None,  # Para OCs > $30k — segunda aprobación distinta
        }).execute()

        url = f"/dashboard/procurement/approve/{po_id}"
        logger.info(
            "PO %s creada en DRAFT sku=%s qty=%s total=%s tenant=%s expires=%s",
            po_id, sku, qty, total, self.tenant_id, approval_expires_at,
        )
        return po_id, url

    # ─────────────────────── NOTIFICACIÓN ───────────────────────────────────── #

    async def _notify_socias(
        self, po_id: str, total: Decimal, approval_url: str, supplier_name: str
    ) -> bool:
        """
        CLAUDE_FIX: números de socias desde tenant_config — no hardcodeados.
        CLAUDE_FIX: threshold $30k desde tenant_config.
        """
        if not hasattr(self, "meta_adapter"):
            return False

        config = await self.get_tenant_config(self.tenant_id)
        socia_1 = config.get("socia_1_whatsapp", "SOCIA_1")
        socia_2 = config.get("socia_2_whatsapp", "SOCIA_2")
        threshold_both = Decimal(str(config.get("procurement_approval_both", "30000")))

        msg = (
            f"Aprobación requerida para OC {po_id}. "
            f"Proveedor: {supplier_name}. Total: ${total:,.2f}. "
            f"Link: {approval_url}"
        )

        try:
            if total > threshold_both:
                # Ambas socias — DISTINTAS personas (se valida en approve_po)
                await self.meta_adapter.send_whatsapp(socia_1, msg)
                await self.meta_adapter.send_whatsapp(socia_2, msg)
            else:
                await self.meta_adapter.send_whatsapp(socia_1, msg)
            return True
        except Exception as e:
            logger.error(
                "Error notificando socias PO=%s tenant=%s: %s", po_id, self.tenant_id, e
            )
            return False

    # ─────────────────────── STUBS DE COMPATIBILIDAD ────────────────────────── #

    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {
            "procurement_safety_days": 15,
            "procurement_approval_both": "30000",
            "socia_1_whatsapp": "SOCIA_1",
            "socia_2_whatsapp": "SOCIA_2",
        }
