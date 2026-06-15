"""Agent #13 — CFDI Billing (FacturAPI CFDI 4.0)"""
import logging
from datetime import datetime

from src.integrations.facturapi_integration import FacturapiIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)


class CFDIBillingAgent:
    name = "CFDI Billing #13"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        receptor_rfc = data.get("receptor_rfc", "").strip().upper()
        receptor_name = data.get("receptor_name", "").strip()
        items = data.get("items", [])

        if not receptor_rfc or not receptor_name:
            return {"success": False, "error": "receptor_rfc and receptor_name required", "data": {}}
        if not items:
            return {"success": False, "error": "items list required", "data": {}}

        try:
            # Load tenant fiscal config
            cfg = await db.fetch_one(
                "SELECT rfc_emisor, nombre_emisor, facturapi_key FROM cfdi_tenant_config_ext WHERE tenant_id=$1",
                tenant_id,
            )
            if not cfg:
                return {"success": False, "error": "Fiscal config not found for this tenant. Configure RFC first.", "data": {}}

            facturapi = FacturapiIntegration({"secret_key": cfg["facturapi_key"]})

            # Build FacturAPI items
            fa_items = []
            for item in items:
                fa_items.append({
                    "product": {
                        "description": item.get("description", "Producto/Servicio"),
                        "product_key": item.get("sat_key", "01010101"),
                        "price": float(item.get("unit_price", 0)),
                        "tax_included": False,
                        "taxes": [{"type": "IVA", "rate": 0.16, "factor": "Tasa"}],
                    },
                    "quantity": int(item.get("quantity", 1)),
                })

            result = await facturapi.create_invoice_for_rfc(
                issuer_rfc=cfg["rfc_emisor"],
                issuer_name=cfg["nombre_emisor"],
                customer_rfc=receptor_rfc,
                customer_name=receptor_name,
                items=fa_items,
                payment_form=data.get("payment_form", "03"),
                payment_method=data.get("payment_method", "PUE"),
                use=data.get("use", "G03"),
            )

            if not result.get("success"):
                return {"success": False, "error": result.get("error", "FacturAPI error"), "data": {}}

            subtotal = sum(
                float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in items
            )
            total = subtotal * 1.16

            await db.execute(
                """INSERT INTO cfdi_records
                   (tenant_id, uuid, folio_number, serie, receptor_rfc, receptor_name,
                    subtotal, iva, total, status, provider, pdf_url, xml_url, created_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'timbrado',$10,$11,$12,NOW())""",
                tenant_id,
                result.get("uuid"),
                result.get("folio_number"),
                result.get("serie"),
                receptor_rfc,
                receptor_name,
                subtotal,
                subtotal * 0.16,
                total,
                "facturapi",
                result.get("pdf_url"),
                result.get("xml_url"),
            )

            logger.info("CFDI timbrado: uuid=%s tenant=%s", result.get("uuid"), tenant_id)
            return {
                "success": True,
                "data": {
                    "uuid": result.get("uuid"),
                    "folio_number": result.get("folio_number"),
                    "serie": result.get("serie"),
                    "subtotal": subtotal,
                    "iva": subtotal * 0.16,
                    "total": total,
                    "pdf_url": result.get("pdf_url"),
                    "xml_url": result.get("xml_url"),
                    "verification_url": result.get("verification_url"),
                    "timbrado_at": datetime.now().isoformat(),
                },
            }
        except Exception as exc:
            logger.error("CFDIBilling failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


cfdi_billing = CFDIBillingAgent()
