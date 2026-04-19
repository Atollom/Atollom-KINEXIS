"""
KINEXIS — CFDIBillingAgent
Agente de Facturacion Electronica CFDI 4.0 para Kap Tools SA de CV

Responsabilidades:
  - Generar CFDIs de tipo Ingreso a partir de ordenes (ML, Amazon, Shopify, B2B)
  - Emitir notas de credito (tipo Egreso) por devoluciones
  - Generar complementos de pago (tipo Pago) para ventas PPD
  - Cancelar CFDIs con aprobacion humana cuando corresponde
  - Enviar CFDI (PDF + XML) por email y/o WhatsApp
  - Persistir todos los CFDIs en Supabase con trazabilidad completa

Spec: 01_cfdi_agent_contract.yaml
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from .facturapi_adapter import (
    FacturapiAdapter, CFDIRequest, CFDIResult, CFDIStatus,
    CustomerData, CFDILineItem, CFDIType
)

logger = logging.getLogger("kinexis.agents.cfdi_billing")


# ─── Constantes SAT ───────────────────────────────────────────────────────────

RFC_PUBLICO_GENERAL      = "XAXX010101000"
NOMBRE_PUBLICO_GENERAL   = "PUBLICO EN GENERAL"
USO_CFDI_PUBLICO_GENERAL = "S01"      # Sin efectos fiscales
REGIMEN_SIN_OBLIGACIONES = "616"      # Sin obligaciones fiscales (B2C)

# Monto minimo para requerir RFC real (regla de negocio Kap Tools)
MONTO_MINIMO_RFC_REAL = 2000.0

# Claves SAT mas usadas en el catalogo de Kap Tools
CLAVES_SAT = {
    "herramienta_manual":  "27111701",
    "destornillador":      "27111702",
    "lupa":                "41112901",
    "instrumento_medicion":"41111500",
    "reactivo_quimico":    "12352100",
    "acido_prueba":        "12352107",
    "consumible_relojeria":"44121600",
    "default":             "01010101",
}


# ─── Agente Principal ─────────────────────────────────────────────────────────

class CFDIBillingAgent:
    """
    Agente de facturacion CFDI 4.0 para KINEXIS.

    Uso tipico (invocado por Sales Agent B2B o post-orden):
        agent = CFDIBillingAgent(
            supabase=supabase_client,
            facturapi=adapter,
            tenant_id="uuid-kap-tools"
        )
        result = await agent.invoice_from_order(order_id="ORD-001")
    """

    def __init__(
        self,
        supabase,               # SupabaseAsyncClient
        facturapi: FacturapiAdapter,
        tenant_id: str,
        notifier=None           # Servicio de notificaciones (email/WhatsApp)
    ):
        self.supabase  = supabase
        self.facturapi = facturapi
        self.tenant_id = tenant_id
        self.notifier  = notifier

    # ─── FACTURA DESDE ORDEN ─────────────────────────────────────────────────

    async def invoice_from_order(
        self,
        order_id: str,
        customer_rfc: Optional[str] = None,
        customer_name: Optional[str] = None,
        customer_email: Optional[str] = None,
        customer_zip: Optional[str] = None,
        customer_tax_regime: str = "616",
        uso_cfdi: str = "G03",      # Gastos en general (default B2C)
        forma_pago: str = "03",     # Transferencia bancaria (default)
        metodo_pago: str = "PUE",   # Pago en una exhibicion (default)
        send_to_customer: bool = True
    ) -> CFDIResult:
        """
        Genera un CFDI de Ingreso a partir de una orden existente en Supabase.
        Si no se proporciona RFC, usa XAXX010101000 para montos < $2,000 MXN.
        Para montos >= $2,000 MXN sin RFC, retorna ERROR_VALIDACION.
        """
        # 1. Obtener orden de Supabase
        order = await self._get_order(order_id)
        if not order:
            return CFDIResult(
                status=CFDIStatus.ERROR_VALIDACION,
                error_code="ORDER_NOT_FOUND",
                error_message=f"No se encontro la orden {order_id}",
                requires_human_review=True
            )

        # 2. Validar RFC requerido segun monto
        order_total = order.get("total_mxn", 0)
        if order_total >= MONTO_MINIMO_RFC_REAL and not customer_rfc:
            return CFDIResult(
                status=CFDIStatus.ERROR_VALIDACION,
                error_code="RFC_REQUERIDO",
                error_message=(
                    f"Ordenes >= ${MONTO_MINIMO_RFC_REAL} MXN requieren "
                    f"RFC del cliente para facturacion"
                ),
                requires_human_review=True
            )

        # 3. Configurar datos del receptor
        if not customer_rfc:
            # Factura a Publico General
            customer  = CustomerData(
                rfc=RFC_PUBLICO_GENERAL,
                legal_name=NOMBRE_PUBLICO_GENERAL,
                tax_regime=REGIMEN_SIN_OBLIGACIONES,
                zip_code=customer_zip or "72000",
                email=customer_email
            )
            uso_cfdi = USO_CFDI_PUBLICO_GENERAL
        else:
            customer = CustomerData(
                rfc=customer_rfc.upper().strip(),
                legal_name=customer_name or "CLIENTE",
                tax_regime=customer_tax_regime,
                zip_code=customer_zip or "72000",
                email=customer_email
            )

        # 4. Construir items desde la orden
        items = self._build_items_from_order(order)
        if not items:
            return CFDIResult(
                status=CFDIStatus.ERROR_VALIDACION,
                error_code="NO_ITEMS",
                error_message="La orden no tiene items facturables",
                requires_human_review=True
            )

        # 5. Armar request y timbrar
        platform = order.get("platform", "DIRECTO")
        platform_order_id = order.get("platform_order_id", order_id)

        cfdi_request = CFDIRequest(
            customer=customer,
            items=items,
            uso_cfdi=uso_cfdi,
            forma_pago=forma_pago,
            metodo_pago=metodo_pago,
            cfdi_type=CFDIType.INGRESO,
            notes=f"Pedido {platform_order_id} | Plataforma: {platform}",
            order_id=order_id
        )

        result = await self.facturapi.create_invoice(cfdi_request)

        # 6. Persistir y distribuir si fue exitoso
        if result.status == CFDIStatus.TIMBRADO:
            await self._save_cfdi_record(order_id, result, cfdi_request)
            if result.facturapi_id:
                await self._store_cfdi_files(result)
            if send_to_customer and customer.email:
                await self._send_cfdi_to_customer(result, customer, order)

            logger.info(
                f"CFDI generado | UUID: {result.uuid} | "
                f"Orden: {order_id} | Total: ${result.total} MXN"
            )

        return result

    # ─── NOTA DE CREDITO ─────────────────────────────────────────────────────

    async def create_credit_note(
        self,
        original_cfdi_uuid: str,
        items_to_credit: list,
        reason: str,
        order_id: Optional[str] = None
    ) -> CFDIResult:
        """
        Genera una nota de credito (CFDI Egreso) por devolucion parcial o total.
        Relaciona automaticamente con el CFDI original.
        """
        # Recuperar datos del receptor del CFDI original
        original = await self._get_cfdi_record_by_uuid(original_cfdi_uuid)
        if not original:
            return CFDIResult(
                status=CFDIStatus.ERROR_VALIDACION,
                error_code="ORIGINAL_CFDI_NOT_FOUND",
                error_message=f"No se encontro el CFDI original {original_cfdi_uuid}",
                requires_human_review=True
            )

        customer = CustomerData(
            rfc=original["customer_rfc"],
            legal_name=original["customer_name"],
            tax_regime=original.get("customer_tax_regime", "616"),
            zip_code=original.get("customer_zip", "72000"),
            email=original.get("customer_email")
        )

        items = [
            CFDILineItem(
                sku=item["sku"],
                description=f"Devolucion: {item['description']}",
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                clave_sat=item.get("clave_sat", CLAVES_SAT["default"]),
                clave_unidad_sat=item.get("clave_unidad", "H87"),
                iva_rate=item.get("iva_rate", 0.16)
            )
            for item in items_to_credit
        ]

        cfdi_request = CFDIRequest(
            customer=customer,
            items=items,
            uso_cfdi="G02",     # Devoluciones, descuentos o bonificaciones
            forma_pago="03",
            metodo_pago="PUE",
            cfdi_type=CFDIType.EGRESO,
            notes=f"Nota de credito por: {reason}",
            cfdi_relacionado_uuid=original_cfdi_uuid,
            order_id=order_id
        )

        result = await self.facturapi.create_invoice(cfdi_request)

        if result.status == CFDIStatus.TIMBRADO:
            await self._save_cfdi_record(
                order_id or original_cfdi_uuid,
                result,
                cfdi_request,
                cfdi_type="E",
                related_uuid=original_cfdi_uuid
            )

        return result

    # ─── CANCELAR CFDI ───────────────────────────────────────────────────────

    async def cancel_cfdi(
        self,
        cfdi_uuid: str,
        requested_by: str,
        motivo: str = "02",
        cfdi_sustitucion: Optional[str] = None
    ) -> dict:
        """
        Cancela un CFDI. Requiere que el campo approved_for_cancellation = TRUE
        en Supabase (aprobado previamente por un humano).
        """
        record = await self._get_cfdi_record_by_uuid(cfdi_uuid)
        if not record:
            return {"success": False, "message": "CFDI no encontrado en el sistema"}

        if not record.get("approved_for_cancellation"):
            logger.warning(
                f"Cancelacion de {cfdi_uuid} intentada sin aprobacion por {requested_by}"
            )
            return {
                "success": False,
                "message": "La cancelacion requiere aprobacion del administrador.",
                "requires_human_review": True
            }

        # Ejecutar cancelacion ante el SAT via Facturapi
        cancel_result = await self.facturapi.cancel_invoice(
            facturapi_id=record["facturapi_id"],
            motivo=motivo,
            cfdi_sustitucion=cfdi_sustitucion
        )

        # Actualizar status en Supabase si fue exitoso
        if cancel_result["success"]:
            await self.supabase.table("cfdi_records").update({
                "status": cancel_result["status"],
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
                "cancelled_by": requested_by,
                "cancellation_motivo": motivo
            }).eq("uuid", cfdi_uuid).eq("tenant_id", self.tenant_id).execute()

        return cancel_result

    # ─── METODOS PRIVADOS ─────────────────────────────────────────────────────

    async def _get_order(self, order_id: str) -> Optional[dict]:
        response = await (
            self.supabase
            .table("orders")
            .select("*, order_items(*)")
            .eq("id", order_id)
            .eq("tenant_id", self.tenant_id)
            .single()
            .execute()
        )
        return response.data

    def _build_items_from_order(self, order: dict) -> list:
        """Convierte items de la orden a CFDILineItem usando claves SAT del catalogo."""
        items = []
        for item in order.get("order_items", []):
            # Priorizar clave SAT configurada por producto
            clave_sat = (
                item.get("clave_sat_override")
                or CLAVES_SAT.get(item.get("category", "default"), CLAVES_SAT["default"])
            )
            items.append(CFDILineItem(
                sku=item.get("sku", "SKU-GENERICO"),
                description=item.get("product_name", item.get("sku", "Producto")),
                quantity=float(item.get("quantity", 1)),
                unit_price=float(item.get("unit_price_without_tax", item.get("unit_price", 0))),
                clave_sat=clave_sat,
                clave_unidad_sat=item.get("unit_key_sat", "H87"),
                iva_rate=float(item.get("iva_rate", 0.16))
            ))
        return items

    async def _save_cfdi_record(
        self,
        order_id: str,
        result: CFDIResult,
        request: CFDIRequest,
        cfdi_type: str = "I",
        related_uuid: Optional[str] = None
    ):
        """Persiste el registro del CFDI en Supabase con todos sus datos."""
        record = {
            "tenant_id":           self.tenant_id,
            "uuid":                result.uuid,
            "folio":               result.folio,
            "facturapi_id":        result.facturapi_id,
            "order_id":            order_id,
            "cfdi_type":           cfdi_type,
            "status":              result.status.value,
            "total":               result.total,
            "subtotal":            result.subtotal,
            "customer_rfc":        request.customer.rfc,
            "customer_name":       request.customer.legal_name,
            "customer_email":      request.customer.email,
            "customer_tax_regime": request.customer.tax_regime,
            "customer_zip":        request.customer.zip_code,
            "uso_cfdi":            request.uso_cfdi,
            "forma_pago":          request.forma_pago,
            "metodo_pago":         request.metodo_pago,
            "related_cfdi_uuid":   related_uuid,
            "timbrado_at":         result.timbrado_at.isoformat() if result.timbrado_at else None,
            "approved_for_cancellation": False,
            "created_at":          datetime.now(timezone.utc).isoformat()
        }
        await self.supabase.table("cfdi_records").insert(record).execute()
        logger.info(f"CFDI record guardado: UUID {result.uuid}")

    async def _store_cfdi_files(self, result: CFDIResult):
        """Descarga XML y PDF del PAC y los guarda en Supabase Storage."""
        try:
            xml_bytes = await self.facturapi.download_xml(result.facturapi_id)
            pdf_bytes = await self.facturapi.download_pdf(result.facturapi_id)

            xml_path = f"{self.tenant_id}/cfdi/{result.uuid}.xml"
            pdf_path = f"{self.tenant_id}/cfdi/{result.uuid}.pdf"

            # Bucket: "cfdi-documents" — privado, no publico
            await self.supabase.storage.from_("cfdi-documents").upload(
                xml_path, xml_bytes, {"content-type": "application/xml"}
            )
            await self.supabase.storage.from_("cfdi-documents").upload(
                pdf_path, pdf_bytes, {"content-type": "application/pdf"}
            )

            xml_url = self.supabase.storage.from_("cfdi-documents").get_public_url(xml_path)
            pdf_url = self.supabase.storage.from_("cfdi-documents").get_public_url(pdf_path)

            await self.supabase.table("cfdi_records").update({
                "xml_url": xml_url,
                "pdf_url": pdf_url
            }).eq("uuid", result.uuid).eq("tenant_id", self.tenant_id).execute()

            result.xml_url = xml_url
            result.pdf_url = pdf_url

        except Exception as e:
            # No es critico — el CFDI ya esta timbrado
            logger.error(f"Error almacenando archivos CFDI {result.uuid}: {e}")

    async def _send_cfdi_to_customer(
        self,
        result: CFDIResult,
        customer: CustomerData,
        order: dict
    ):
        """Envia el CFDI por email al cliente con PDF y XML adjuntos."""
        if not self.notifier or not customer.email:
            return
        try:
            await self.notifier.send_email(
                to=customer.email,
                subject=f"Factura electronica - Folio {result.folio} | Kap Tools",
                template="cfdi_email",
                context={
                    "customer_name": customer.legal_name,
                    "uuid": result.uuid,
                    "folio": result.folio,
                    "total": result.total,
                    "pdf_url": result.pdf_url,
                    "xml_url": result.xml_url,
                    "order_platform": order.get("platform", "")
                }
            )
            logger.info(f"CFDI {result.uuid} enviado a {customer.email}")
        except Exception as e:
            logger.warning(f"No se pudo enviar CFDI por email: {e}")

    async def _get_cfdi_record_by_uuid(self, uuid: str) -> Optional[dict]:
        response = await (
            self.supabase
            .table("cfdi_records")
            .select("*")
            .eq("uuid", uuid)
            .eq("tenant_id", self.tenant_id)
            .single()
            .execute()
        )
        return response.data
