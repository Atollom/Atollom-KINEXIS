"""
FacturAPI Integration (FALLBACK CFDI Provider)
Sandbox: sk_test_... keys
Production: sk_live_... keys
Docs: https://www.facturapi.io/docs
"""

import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class FacturapiIntegration(BaseIntegration):
    """
    Cliente FacturAPI v2 (CFDI 4.0).

    Endpoints principales:
      GET    /v2/organizations
      POST   /v2/invoices
      GET    /v2/invoices/{id}
      DELETE /v2/invoices/{id}
    """

    def _get_sandbox_url(self) -> str:
        return "https://www.facturapi.io"

    def _get_production_url(self) -> str:
        return "https://www.facturapi.io"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.secret_key = cfg.get("secret_key") or os.getenv("FACTURAPI_SECRET_KEY")
        if self.secret_key and self.secret_key.startswith("sk_test_"):
            self.is_sandbox = True

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        if self.secret_key:
            headers["Authorization"] = f"Bearer {self.secret_key}"
        return headers

    def _base(self) -> str:
        return self._get_base_url()

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """GET /v2/organizations para verificar la key."""
        if not self.secret_key:
            return {"success": False, "provider": "FacturAPI", "message": "API key not configured"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self._base()}/v2/organizations", headers=self._get_headers()
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        mode = "TEST" if self.secret_key.startswith("sk_test_") else "LIVE"
                        return {
                            "success": True,
                            "provider": "FacturAPI",
                            "message": f"Connected in {mode} mode",
                            "mode": mode,
                            "org_name": data.get("legal_name"),
                        }
                    err = (await resp.json()).get("message", f"HTTP {resp.status}")
                    return {"success": False, "provider": "FacturAPI", "message": err}
        except Exception as e:
            logger.error(f"FacturAPI connection test failed: {e}")
            return {"success": False, "provider": "FacturAPI", "message": str(e)}

    # ── Invoice creation ──────────────────────────────────────────────────────

    async def create_invoice(
        self,
        customer_rfc: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        payment_form: str = "03",
        payment_method: str = "PUE",
        use: str = "G03",
    ) -> Dict[str, Any]:
        """
        POST /v2/invoices — Crea y timbra CFDI 4.0.

        Items format:
        [{"product": {"description": "...", "product_key": "01010101",
                      "price": 100.0}, "quantity": 2}]
        """
        payload = {
            "customer": {"legal_name": customer_name, "tax_id": customer_rfc},
            "items": items,
            "payment_form": payment_form,
            "use": use,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/v2/invoices", headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status in (200, 201):
                    return {
                        "success": True,
                        "provider": "facturapi",
                        "uuid": data.get("uuid"),
                        "folio_number": data.get("folio_number"),
                        "serie": data.get("series"),
                        "total": data.get("total"),
                        "subtotal": data.get("subtotal"),
                        "pdf_url": data.get("pdf_custom_link") or data.get("pdf_original_link"),
                        "xml_url": data.get("xml_original_link"),
                        "verification_url": data.get("verification_url"),
                        "status": data.get("status"),
                        "timbrado_at": data.get("created_at"),
                    }
                return {
                    "success": False,
                    "provider": "facturapi",
                    "error": data.get("message", "Unknown error"),
                }

    async def create_invoice_for_rfc(
        self,
        issuer_rfc: str,
        issuer_name: str,
        customer_rfc: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        payment_form: str = "03",
        payment_method: str = "PUE",
        use: str = "G03",
    ) -> Dict[str, Any]:
        """
        Crea factura con RFC emisor específico.

        FacturAPI usa Organizations para multi-RFC. En la integración base
        se usa la organization configurada en la API key. Para multi-RFC
        verdadero se necesitarían organizations separadas por tenant.

        El issuer_rfc se registra en el campo customer del CFDI;
        la organization que aparece como emisor depende de la API key.
        """
        logger.info(f"FacturAPI invoice: issuer={issuer_rfc} ({issuer_name}) → receiver={customer_rfc}")
        payload = {
            "customer": {
                "legal_name": customer_name,
                "tax_id": customer_rfc,
                "tax_system": "601",
                "address": {"zip": "00000"},
            },
            "items": items,
            "payment_form": payment_form,
            "use": use,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/v2/invoices", headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status in (200, 201):
                    return {
                        "success": True,
                        "provider": "facturapi",
                        "provider_invoice_id": data.get("id"),
                        "uuid": data.get("uuid"),
                        "folio_number": data.get("folio_number"),
                        "serie": data.get("series"),
                        "total": data.get("total"),
                        "subtotal": data.get("subtotal"),
                        "pdf_url": data.get("pdf_custom_link") or data.get("pdf_original_link"),
                        "xml_url": data.get("xml_original_link"),
                        "verification_url": data.get("verification_url"),
                        "status": data.get("status"),
                        "timbrado_at": data.get("created_at"),
                    }
                return {
                    "success": False,
                    "provider": "facturapi",
                    "error": data.get("message", "Unknown error"),
                }

    # ── Read / Cancel ─────────────────────────────────────────────────────────

    async def get_invoice(self, invoice_id: str) -> Dict[str, Any]:
        """GET /v2/invoices/{id}"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/v2/invoices/{invoice_id}", headers=self._get_headers()
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "invoice": data}
                return {"success": False, "error": data.get("message")}

    async def cancel_invoice(
        self,
        invoice_id: str,
        motive: str = "02",
    ) -> Dict[str, Any]:
        """DELETE /v2/invoices/{id}"""
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{self._base()}/v2/invoices/{invoice_id}",
                headers=self._get_headers(),
                json={"motive": motive},
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "status": data.get("status")}
                return {"success": False, "error": data.get("message")}

    # ── Downloads ─────────────────────────────────────────────────────────────

    async def download_pdf(self, invoice_id: str) -> bytes:
        """Descarga PDF via URL embebida en la factura."""
        inv = await self.get_invoice(invoice_id)
        if not inv["success"]:
            raise ValueError("Invoice not found")
        pdf_url = inv["invoice"].get("pdf_custom_link") or inv["invoice"].get("pdf_original_link")
        if not pdf_url:
            raise ValueError("PDF URL not available")
        async with aiohttp.ClientSession() as session:
            async with session.get(pdf_url) as resp:
                if resp.status == 200:
                    return await resp.read()
                raise ValueError(f"Failed to download PDF: HTTP {resp.status}")

    async def download_xml(self, invoice_id: str) -> bytes:
        """Descarga XML via URL embebida en la factura."""
        inv = await self.get_invoice(invoice_id)
        if not inv["success"]:
            raise ValueError("Invoice not found")
        xml_url = inv["invoice"].get("xml_original_link")
        if not xml_url:
            raise ValueError("XML URL not available")
        async with aiohttp.ClientSession() as session:
            async with session.get(xml_url) as resp:
                if resp.status == 200:
                    return await resp.read()
                raise ValueError(f"Failed to download XML: HTTP {resp.status}")


facturapi_integration = FacturapiIntegration()
