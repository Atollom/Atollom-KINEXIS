"""
CFDI Dual Provider
Primary:  Facturama ($2,000 MXN/mes ilimitado)
Fallback: FacturAPI (si Facturama falla)
"""

import logging
from typing import Any, Dict, List, Optional

from .facturama_integration import facturama_integration
from .facturapi_integration import facturapi_integration

logger = logging.getLogger(__name__)

_GENERIC_ITEMS = List[Dict[str, Any]]


class CFDIProvider:
    """
    Proveedor dual de facturacion CFDI 4.0.

    Estrategia:
    1. Intentar con Facturama (primary)
    2. Si falla, usar FacturAPI (fallback)
    3. Si ambos fallan, retornar error con detalle
    """

    def __init__(self):
        self.primary = facturama_integration
        self.fallback = facturapi_integration
        self.name = "CFDI Dual Provider"
        self.stats = {
            "facturama_success": 0,
            "facturama_failed": 0,
            "facturapi_success": 0,
            "facturapi_failed": 0,
        }
        logger.info(f"{self.name} initialized")

    # ── Health ────────────────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """Prueba ambos proveedores."""
        primary_test = await self.primary.test_connection()
        fallback_test = await self.fallback.test_connection()
        return {
            "success": primary_test["success"] or fallback_test["success"],
            "primary": primary_test,
            "fallback": fallback_test,
            "stats": self.stats,
        }

    # ── Invoice creation with automatic fallback ──────────────────────────────

    async def create_invoice(
        self,
        customer_rfc: str,
        customer_name: str,
        items: _GENERIC_ITEMS,
        payment_form: str = "03",
        payment_method: str = "PUE",
        use: str = "G03",
    ) -> Dict[str, Any]:
        """
        Crea factura con fallback automatico.

        Args:
            items: formato generico — ver _convert_to_facturama_format
            payment_form: clave SAT forma de pago (01-30)
            payment_method: PUE | PPD
            use: clave SAT uso CFDI (G01-P01)
        """
        # Intento 1: Facturama (Primary)
        try:
            logger.info("Creating invoice with Facturama (primary)")
            result = await self.primary.create_invoice(
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=self._convert_to_facturama_format(items),
                payment_form=payment_form,
                payment_method=payment_method,
                cfdi_use=use,
            )
            if result["success"]:
                self.stats["facturama_success"] += 1
                logger.info(f"Invoice created with Facturama: {result.get('uuid')}")
                return result
            self.stats["facturama_failed"] += 1
            logger.warning(f"Facturama returned failure: {result.get('error')}")
        except Exception as e:
            self.stats["facturama_failed"] += 1
            logger.error(f"Facturama exception: {e}")

        # Intento 2: FacturAPI (Fallback)
        try:
            logger.warning("Falling back to FacturAPI")
            result = await self.fallback.create_invoice(
                customer_rfc=customer_rfc,
                customer_name=customer_name,
                items=self._convert_to_facturapi_format(items),
                payment_form=payment_form,
                payment_method=payment_method,
                use=use,
            )
            if result["success"]:
                self.stats["facturapi_success"] += 1
                logger.info(f"Invoice created with FacturAPI (fallback): {result.get('uuid')}")
            else:
                self.stats["facturapi_failed"] += 1
                logger.error(f"FacturAPI also failed: {result.get('error')}")
            return result
        except Exception as e:
            self.stats["facturapi_failed"] += 1
            logger.error(f"FacturAPI exception: {e}")
            return {
                "success": False,
                "provider": "none",
                "error": "Both CFDI providers failed",
                "details": str(e),
            }

    # ── Read / Cancel / Download (provider-aware) ─────────────────────────────

    async def get_invoice(self, invoice_id: str, provider: str = "facturama") -> Dict[str, Any]:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.get_invoice(invoice_id)

    async def cancel_invoice(
        self,
        invoice_id: str,
        provider: str = "facturama",
        motive: str = "02",
    ) -> Dict[str, Any]:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.cancel_invoice(invoice_id, motive)

    async def download_pdf(self, invoice_id: str, provider: str = "facturama") -> bytes:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.download_pdf(invoice_id)

    async def download_xml(self, invoice_id: str, provider: str = "facturama") -> bytes:
        target = self.primary if provider == "facturama" else self.fallback
        return await target.download_xml(invoice_id)

    # ── Format converters ─────────────────────────────────────────────────────

    def _convert_to_facturama_format(self, items: _GENERIC_ITEMS) -> _GENERIC_ITEMS:
        """
        Formato generico → Facturama.

        Input:  [{"description", "product_key", "quantity", "unit_price", ...}]
        Output: [{"ProductCode", "Description", "Quantity", "UnitPrice", "TaxObject", "Unit"}]
        """
        return [
            {
                "ProductCode": item.get("product_key", "01010101"),
                "Description": item.get("description", "Producto"),
                "Quantity": item.get("quantity", 1),
                "UnitPrice": item.get("unit_price", 0),
                "TaxObject": item.get("tax_object", "02"),
                "Unit": item.get("unit", "E48"),
            }
            for item in items
        ]

    def _convert_to_facturapi_format(self, items: _GENERIC_ITEMS) -> _GENERIC_ITEMS:
        """
        Formato generico → FacturAPI.

        Output: [{"product": {"description", "product_key", "price"}, "quantity"}]
        """
        return [
            {
                "product": {
                    "description": item.get("description", "Producto"),
                    "product_key": item.get("product_key", "01010101"),
                    "price": item.get("unit_price", 0),
                },
                "quantity": item.get("quantity", 1),
            }
            for item in items
        ]

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """Estadisticas de uso de proveedores."""
        fs = self.stats["facturama_success"]
        ff = self.stats["facturama_failed"]
        rs = self.stats["facturapi_success"]
        rf = self.stats["facturapi_failed"]
        total_success = fs + rs
        total = total_success + ff + rf
        return {
            "total_invoices": total,
            "success_rate": round(total_success / total * 100, 2) if total else 0,
            "facturama": {
                "success": fs,
                "failed": ff,
                "usage_rate": round(fs / total * 100, 2) if total else 0,
            },
            "facturapi": {
                "success": rs,
                "failed": rf,
                "usage_rate": round(rs / total * 100, 2) if total else 0,
            },
        }


cfdi_provider = CFDIProvider()
