# src/agents/sales_b2b_agent.py
import logging
import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

# Sanitiza lead_id/tenant_id antes de usarlos en paths de Storage
_PATH_SAFE = re.compile(r"[^A-Za-z0-9\-_]")

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

_CENTAVOS = Decimal("0.01")

# Signed URL expiry para PDFs de cotización: 15 días = 1,296,000 segundos
_QUOTE_URL_EXPIRES = 1_296_000


class SalesB2BAgent(BaseAgent):
    """
    Agente #22: Sales B2B Agent.
    Gestiona el ciclo de ventas B2B: cotizaciones, seguimiento y confirmación de pedidos.
    Niveles de autonomía: SUPERVISED (requiere aprobación para montos altos).
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="sales_b2b_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point compatible con BaseAgent.run()"""
        return await self.execute(data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Orquestación según la acción solicitada."""
        action = data.get("action", "follow_up")

        if action == "send_quote":
            return await self._generate_and_send_quote(
                lead_id=data.get("lead_id"),
                items=data.get("items", []),
            )
        if action == "confirm_order":
            return await self._confirm_order(
                lead_id=data.get("lead_id"),
                quote_id=data.get("quote_id"),
            )
        if action == "request_invoice":
            success = await self._trigger_cfdi(
                order_id=data.get("order_id"),
                customer_rfc=data.get("customer_rfc"),
            )
            return {"status": "success", "cfdi_triggered": success}

        return await self._send_followup(data.get("lead_id"))

    # ─────────────────────── COTIZACIÓN ─────────────────────────────────────── #

    async def _generate_and_send_quote(
        self, lead_id: str, items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Genera y envía una cotización B2B."""
        quote_items = []
        total_decimal = Decimal("0")

        for item in items:
            sku = item.get("sku")
            qty = item.get("quantity", 1)

            stock = await self._check_inventory(sku)
            if stock < qty:
                raise ValueError(
                    f"Stock insuficiente para SKU {sku}: disponible {stock}, solicitado {qty}"
                )

            price = await self._calculate_b2b_price(sku, qty)
            subtotal = (price * Decimal(str(qty))).quantize(_CENTAVOS, ROUND_HALF_UP)

            quote_items.append({
                "sku": sku,
                "quantity": qty,
                "unit_price": float(price),
                "subtotal": float(subtotal),
            })
            total_decimal += subtotal

        iva = (total_decimal * Decimal("0.16")).quantize(_CENTAVOS, ROUND_HALF_UP)
        total = total_decimal + iva

        # Generar PDF (Stub Fase 1) — Signed URL con expiry 15 días
        pdf_url = await self._generate_quote_pdf(lead_id, quote_items, total)

        valid_until = (self._get_now() + timedelta(days=15)).date()
        quote_id = await self._register_quote({
            "lead_id": lead_id,
            "items": quote_items,
            "subtotal": float(total_decimal),
            "iva": float(iva),
            "total": float(total),
            "pdf_url": pdf_url,
            "valid_until": valid_until.isoformat(),
        })

        await self._schedule_followup(lead_id, hours=48)

        return {
            "status": "success",
            "quote_id": quote_id,
            "total": float(total),
            "pdf_url": pdf_url,
            "deal_stage": "quote_sent",
        }

    # ─────────────────────── PRECIO B2B ─────────────────────────────────────── #

    async def _calculate_b2b_price(self, sku: str, qty: int) -> Decimal:
        """
        Cálculo de precio con margen B2B y descuento por volumen.
        CLAUDE_FIX: margen, descuento Y umbral de volumen vienen de tenant_config.
        CLAUDE_FIX: precio nunca < costo (guard explícito).
        """
        cost = await self._get_product_cost(sku)
        config = await self.get_tenant_config(self.tenant_id)

        min_margin = Decimal(str(config.get("b2b_min_margin", "0.15")))
        price = cost * (Decimal("1") + min_margin)

        # CLAUDE_FIX: umbral de volumen desde config — no hardcodeado en 50
        vol_threshold = int(config.get("b2b_vol_threshold", 50))
        if qty >= vol_threshold:
            vol_discount = Decimal(str(config.get("b2b_vol_discount", "0.05")))
            price = price * (Decimal("1") - vol_discount)

        # CLAUDE_FIX: nunca vender debajo del costo — mínimo 1% de margen
        if price < cost:
            price = cost * Decimal("1.01")

        return price.quantize(_CENTAVOS, ROUND_HALF_UP)

    # ─────────────────────── CONFIRMACIÓN ───────────────────────────────────── #

    async def _confirm_order(self, lead_id: str, quote_id: str) -> Dict[str, Any]:
        """
        Confirma pedido y escala aprobación si es necesario.
        SECURITY: total leído de la cotización en BD — no del payload del cliente.
        CLAUDE_FIX: thresholds desde tenant_config — no hardcodeados.
        """
        quote = await self._get_quote(quote_id)
        if not quote:
            raise ValueError("Cotización no encontrada")

        valid_until = datetime.strptime(quote["valid_until"], "%Y-%m-%d").date()
        if valid_until < self._get_now().date():
            return {"status": "expired", "message": "La cotización ha expirado"}

        # SECURITY: total viene de la cotización en BD (no del payload del cliente)
        total = quote["total"]

        config = await self.get_tenant_config(self.tenant_id)
        # CLAUDE_FIX: thresholds desde config — no hardcodeados
        threshold_both = float(config.get("approval_threshold_both_partners", 50000))
        threshold_one = float(config.get("approval_threshold_one_partner", 15000))

        if total > threshold_both:
            # Requiere aprobación de AMBAS socias — se verificará en approval workflow
            # que sean dos personas distintas (R13 anti-rubber-stamp)
            return {
                "status": "pending_approval",
                "level": "partners_both",
                "human_required": True,
                "required_approvers": 2,
                "note": "Sistema exige 2 aprobaciones de personas distintas",
            }
        if total > threshold_one:
            return {
                "status": "pending_approval",
                "level": "partner_single",
                "human_required": True,
                "required_approvers": 1,
            }

        # Auto-aprobado: crear orden y opcionalmente timbrar CFDI
        if config.get("auto_invoice_b2b"):
            await self._trigger_cfdi(lead_id, "XAXX010101000")

        return {"status": "success", "deal_stage": "won"}

    # ─────────────────────── SEGUIMIENTO ────────────────────────────────────── #

    async def _schedule_followup(self, lead_id: str, hours: int = 48) -> str:
        """
        Agenda seguimiento en horas hábiles.
        CLAUDE_FIX: usa _get_now() — no datetime.now() suelto.
        """
        now = self._get_now()
        scheduled = now + timedelta(hours=hours)

        # Si cae en fin de semana, mover a lunes 9AM
        if scheduled.weekday() >= 5:  # 5=Sáb, 6=Dom
            days_to_monday = 7 - scheduled.weekday()
            scheduled = (scheduled + timedelta(days=days_to_monday)).replace(
                hour=9, minute=0, second=0, microsecond=0
            )

        try:
            await self.supabase.table("followup_queue").insert({
                "tenant_id": self.tenant_id,
                "lead_id": lead_id,
                "agent_id": self.agent_id,
                "scheduled_at": scheduled.isoformat(),
                "status": "pending",
            }).execute()
            return scheduled.isoformat()
        except Exception as e:
            logger.error("Error scheduling followup tenant=%s: %s", self.tenant_id, e)
            return ""

    async def _send_followup(self, lead_id: Optional[str]) -> Dict[str, Any]:
        logger.info("Followup para lead %s tenant=%s", lead_id, self.tenant_id)
        return {"status": "followup_sent", "lead_id": lead_id}

    # ─────────────────────── STUBS / HELPERS ────────────────────────────────── #

    async def _check_inventory(self, _sku: str) -> int:
        return 100  # Mock — InventoryAgent en Fase 2

    def _get_now(self) -> datetime:
        """Retorna la hora actual en CDMX (UTC-6 fijo)."""
        tz_mx = timezone(timedelta(hours=-6))
        return datetime.now(tz_mx)

    async def _get_product_cost(self, _sku: str) -> Decimal:
        return Decimal("100.00")  # Mock — ProcurementAgent en Fase 2

    async def _generate_quote_pdf(
        self, lead_id: str, _items: list, _total: Decimal
    ) -> str:
        """
        Stub Fase 1 — retorna Signed URL con expiry 15 días.
        SECURITY CLAUDE_FIX: lead_id sanitizado antes de usar en path de Storage.
        Previene path traversal: '../../../etc/passwd' → 'etcpasswd'.
        En Fase 2: supabase.storage.from_('quotes').create_signed_url(path, _QUOTE_URL_EXPIRES)
        """
        safe_tenant = _PATH_SAFE.sub("", self.tenant_id)
        safe_lead = _PATH_SAFE.sub("", lead_id)
        base_path = f"{safe_tenant}/{safe_lead}"
        return (
            f"https://supabase.co/storage/signed/quotes/{base_path}/quote.pdf"
            f"?token=mock&expires={_QUOTE_URL_EXPIRES}"
        )

    async def _register_quote(self, data: dict) -> str:
        """
        CLAUDE_FIX: usa self._get_now() para el número de cotización — no datetime.now().
        CLAUDE_FIX: tenant_id siempre self.tenant_id — nunca parámetro externo (R3).
        """
        res = await self.supabase.table("quotes").insert({
            "tenant_id": self.tenant_id,
            "lead_id": data["lead_id"],
            "quote_number": f"QT-{self._get_now().strftime('%Y%m%d')}-001",
            "items": data["items"],
            "subtotal": data["subtotal"],
            "iva": data["iva"],
            "total": data["total"],
            "pdf_url": data["pdf_url"],
            "valid_until": data["valid_until"],
        }).execute()
        return res.data[0]["id"]

    async def _get_quote(self, quote_id: str) -> Optional[dict]:
        """
        SECURITY CLAUDE_FIX: filtra por tenant_id — previene lectura de cotizaciones
        de otro tenant con quote_id conocido (IDOR).
        """
        res = await (
            self.supabase.table("quotes")
            .select("*")
            .eq("id", quote_id)
            .eq("tenant_id", self.tenant_id)  # CLAUDE_FIX: tenant isolation
            .single()
            .execute()
        )
        return res.data

    async def _trigger_cfdi(self, order_id: str, customer_rfc: str) -> bool:
        logger.info(
            "Triggering CFDIBillingAgent for order=%s rfc=%s tenant=%s",
            order_id, customer_rfc, self.tenant_id,
        )
        return True

    # ─────────────────────── STUBS DE COMPATIBILIDAD ────────────────────────── #

    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {
            "b2b_min_margin": "0.20",
            "b2b_vol_discount": "0.10",
            "b2b_vol_threshold": 50,
            "approval_threshold_both_partners": 50000,
            "approval_threshold_one_partner": 15000,
            "auto_invoice_b2b": True,
        }
