# src/agents/cfdi_billing_agent.py
import logging
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from src.adapters.facturapi_adapter import FacturapiAdapter, _SKU_SAFE
from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

_CENTAVOS = Decimal("0.01")


class CFDIBillingAgent(BaseAgent):
    """
    Agente #36: CFDI Billing Agent.
    Orquestador de facturación electrónica 4.0.
    Reglas fiscales Kap Tools: KTO2202178K8 | Régimen 601 | CP 72973.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="cfdi_billing_agent_v1", supabase_client=supabase_client
        )
        self.facturapi = FacturapiAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Procesa solicitud de facturación de principio a fin.
        Orden crítico: timbrar → storage → BD → notificar cliente.
        Si storage falla → BD NO se escribe.
        """
        # 1. Cargar configuración extendida del tenant
        config = await self._get_cfdi_config()
        if not config:
            raise RuntimeError(
                f"Configuración CFDI no encontrada para tenant {self.tenant_id}"
            )

        # 2. Validar y preparar RFC del receptor
        rfc = data.get("customer_rfc", "XAXX010101000")
        name = data.get("customer_name", "PUBLICO EN GENERAL")

        # 3. Resolver kits — Decimal para precisión fiscal (R8)
        items = data.get("items", [])
        if not items:
            raise ValueError("Lista de productos vacía.")
        resolved_items = await self._resolve_kits(items)

        # 4. Calcular total con Decimal
        total_decimal = sum(
            Decimal(str(item.get("price", 0))) * Decimal(str(item.get("quantity", 1)))
            for item in resolved_items
        )
        total = float(total_decimal)
        if total <= 0:
            raise ValueError(f"No se puede timbrar una factura con total {total}.")

        # 5. Obtener/crear Customer en Facturapi
        customer = await self.facturapi.create_customer(
            rfc=rfc,
            name=name,
            email=data.get("customer_email"),
            zip_code=data.get("customer_zip", config["cp_expedicion"]),
            tax_regime=data.get("customer_tax_regime", "616"),
        )

        # 6. Decidir autonomía — threshold desde tenant_config, NO hardcodeado (R14)
        threshold = float(config.get("autonomy_threshold_mxn", 10000.0))
        autonomy_result = await self._apply_autonomy(total, threshold)
        if autonomy_result == "NOTIFY":
            await self.meta_adapter.send_whatsapp(
                to_number=config.get("warehouse_whatsapp", ""),
                message=(
                    f"Alerta Facturacion: Orden {data.get('order_id')} "
                    f"por ${total:,.2f} requiere revision antes de timbrar."
                ),
            )
            raise RuntimeError(
                f"Factura de ${total:,.2f} requiere aprobacion manual (Autonomy Rule)."
            )

        # 7. Crear Factura (retry interno en FacturapiAdapter)
        invoice = await self.facturapi.create_invoice(
            customer_id=customer["id"],
            items=resolved_items,
            payment_form=data.get("forma_pago", "01"),
            payment_method=data.get("metodo_pago", "PUE"),
            uso_cfdi=data.get("uso_cfdi", "G03"),
        )

        # 8. Descargar XML + PDF en paralelo
        files = await self.facturapi.download_files(invoice["id"])

        # 9. ORDEN CRÍTICO: Storage ANTES de BD.
        # Si storage falla → excepción → BD no se escribe — CFDI no queda huérfano.
        urls = await self._save_to_storage(
            files["xml"],
            files["pdf"],
            invoice["uuid"],
        )

        # 10. Registrar en cfdi_records solo si storage tuvo éxito
        record_id = await self._register_cfdi({
            "order_id": data.get("order_id"),
            "folio": data.get("folio"),
            "uuid": invoice["uuid"],
            "facturapi_id": invoice["id"],
            "total": total,
            "subtotal": total / 1.16,
            "customer_rfc": rfc,
            "customer_name": name,
            "customer_email": data.get("customer_email"),
            "customer_zip": data.get("customer_zip", config["cp_expedicion"]),
            "xml_url": urls["xml"],
            "pdf_url": urls["pdf"],
            "status": "TIMBRADO",
        })

        # 11. Envío best-effort al cliente — si falla NO escala (CFDI ya timbrado)
        if config.get("auto_invoice_b2b") or data.get("customer_email"):
            try:
                await self._send_to_customer(
                    customer_email=data.get("customer_email"),
                    pdf_url=urls["pdf"],
                    xml_url=urls["xml"],
                )
            except Exception as e:
                logger.error(
                    "Fallo best-effort enviando CFDI al cliente tenant=%s: %s — no escalar",
                    self.tenant_id, e,
                )

        return {
            "status": "success",
            "cfdi_uuid": invoice["uuid"],
            "record_id": record_id,
            "total": total,
            "urls": urls,
            "autonomy": autonomy_result,
        }

    # ───────────────────────── KITS ──────────────────────────────────────── #

    async def _resolve_kits(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        R8: Desglosa kits en componentes individuales consultando BD.
        CLAUDE_FIX: usa Decimal para precios — float da errores de redondeo fiscales.
        SECURITY_FIX: SKU sanitizado antes de query a BD.
        """
        resolved = []
        for item in items:
            raw_sku = item.get("sku", "")
            # SECURITY_FIX: sanitizar SKU antes de query — previene path traversal
            sku = _SKU_SAFE.sub("", raw_sku)

            if sku.startswith("KIT"):
                try:
                    res = await (
                        self.supabase.table("kit_components")
                        .select(
                            "component_sku, quantity, "
                            "product_sat_keys(description, sat_key, unit_key)"
                        )
                        .eq("kit_sku", sku)  # usa sku sanitizado
                        .execute()
                    )
                    components = res.data or []

                    if not components:
                        logger.warning(
                            "Kit %s sin componentes — facturando kit completo (RIESGO FISCAL)",
                            sku,
                        )
                        resolved.append(item)
                        continue

                    # CLAUDE_FIX: Decimal para división de precios fiscales
                    original_price = Decimal(str(item["price"]))
                    total_qty = sum(c["quantity"] for c in components)
                    unit_price = (original_price / total_qty).quantize(
                        _CENTAVOS, ROUND_HALF_UP
                    )

                    comp_items = []
                    for comp in components:
                        sat = comp.get("product_sat_keys", {}) or {}
                        comp_items.append({
                            "description": (
                                f"{sat.get('description', 'Componente')} (Parte de {sku})"
                            ),
                            "product_key": sat.get("sat_key", "01010101"),
                            "price": float(unit_price),
                            "quantity": item["quantity"] * comp["quantity"],
                            "unit_key": sat.get("unit_key", "H87"),
                        })

                    # CLAUDE_FIX: ajuste al último item para suma exacta
                    assigned = unit_price * (total_qty - 1)
                    last_price = (original_price - assigned).quantize(
                        _CENTAVOS, ROUND_HALF_UP
                    )
                    comp_items[-1]["price"] = float(last_price)
                    resolved.extend(comp_items)

                except Exception as e:
                    logger.error("Error resolviendo kit %s: %s", sku, e)
                    resolved.append(item)  # Fallback conservador
            else:
                if "description" not in item:
                    item["description"] = raw_sku or "Producto"
                if "product_key" not in item:
                    item["product_key"] = "01010101"
                resolved.append(item)
        return resolved

    # ───────────────────────── STORAGE ───────────────────────────────────── #

    async def _save_to_storage(
        self, _xml_bytes: bytes, _pdf_bytes: bytes, cfdi_uuid: str
    ) -> Dict[str, str]:
        """
        Guarda XML + PDF en Storage PRIVADO y retorna Signed URLs (30 días).
        ORDEN CRÍTICO: debe ejecutar ANTES de _register_cfdi().
        Si falla → excepción propagada → BD no se escribe.
        """
        bucket = "cfdi-documents"
        base_path = f"{self.tenant_id}/{cfdi_uuid}"

        # Stub Fase 1 — en producción: supabase.storage.from_(bucket).upload() + create_signed_url()
        # Signed URL expira en 30 días = 2592000 segundos
        logger.info(
            "Guardando CFDI %s en storage bucket=%s (stub Fase 1)", cfdi_uuid, bucket
        )
        return {
            "xml": f"https://supabase.co/storage/signed/{base_path}/cfdi.xml?token=mock&expires=2592000",
            "pdf": f"https://supabase.co/storage/signed/{base_path}/cfdi.pdf?token=mock&expires=2592000",
        }

    # ───────────────────────── BD ────────────────────────────────────────── #

    async def _register_cfdi(self, cfdi_data: Dict[str, Any]) -> str:
        """
        Inserta en cfdi_records. Solo se llama si _save_to_storage() tuvo éxito.
        Usa self.tenant_id — nunca parámetro externo (R3).
        """
        try:
            res = await self.supabase.table("cfdi_records").insert({
                "tenant_id": self.tenant_id,  # R3: siempre self.tenant_id
                "uuid": cfdi_data["uuid"],
                "folio": cfdi_data.get("folio"),
                "facturapi_id": cfdi_data["facturapi_id"],
                "order_id": cfdi_data.get("order_id"),
                "total": cfdi_data["total"],
                "customer_rfc": cfdi_data["customer_rfc"],
                "customer_name": cfdi_data["customer_name"],
                "xml_url": cfdi_data["xml_url"],
                "pdf_url": cfdi_data["pdf_url"],
                "status": "TIMBRADO",
                "timbrado_at": datetime.now().isoformat(),
            }).execute()
            return res.data[0]["id"]
        except Exception as e:
            logger.error("Error registrando CFDI en BD tenant=%s: %s", self.tenant_id, e)
            raise RuntimeError("Error de persistencia CFDI")

    # ───────────────────────── AUTONOMÍA ─────────────────────────────────── #

    async def _apply_autonomy(self, total: float, threshold: float = 10000.0) -> str:
        """
        CLAUDE_FIX: threshold viene de tenant_config (parámetro), no hardcodeado.
        FULL si total < threshold. NOTIFY si >= threshold → socias deben aprobar.
        """
        if total < threshold:
            return "FULL"
        return "NOTIFY"

    # ───────────────────────── CONFIG ────────────────────────────────────── #

    async def _get_cfdi_config(self) -> Optional[Dict[str, Any]]:
        """Obtiene configuración extendida del tenant desde cfdi_tenant_config_ext."""
        try:
            res = await (
                self.supabase.table("cfdi_tenant_config_ext")
                .select("*")
                .eq("tenant_id", self.tenant_id)
                .single()
                .execute()
            )
            return res.data
        except Exception as e:
            logger.error("Error cargando CFDI config tenant=%s: %s", self.tenant_id, e)
            return None

    # ───────────────────────── NOTIFICACIÓN ──────────────────────────────── #

    async def _send_to_customer(
        self,
        customer_email: Optional[str],
        pdf_url: str,
        xml_url: str,
    ) -> bool:
        """
        Envío best-effort al cliente.
        Si falla → log error, NO escalar (CFDI ya fue timbrado y guardado).
        """
        try:
            logger.info(
                "Enviando CFDI a %s (pdf=%s, xml=%s)",
                customer_email, pdf_url, xml_url,
            )
            # Integración con Resend en Fase 2
            return True
        except Exception as e:
            logger.error(
                "Fallo al enviar CFDI a cliente %s: %s — no escalar", customer_email, e
            )
            return False

    # ── Stubs de compatibilidad con FacturapiAdapter/MetaAdapter ─────────── #
    # CLAUDE_FIX: retornar {} para activar MOCK_MODE correctamente.
    # "MOCK_KEY" como valor haría que el adapter intentara llamar a Facturapi real.
    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}  # {} → activa MOCK_MODE en adapters (antes retornaba "MOCK_KEY" erróneo)

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {}

    async def get_vault_secret(self, _tenant_id: str, _secret_name: str) -> dict:
        return {}
