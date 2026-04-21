"""
Facturama Integration (PRIMARY CFDI Provider)
Sandbox: https://apisandbox.facturama.mx/
Production: https://api.facturama.mx/
Docs: https://apisandbox.facturama.mx/guias
Precio: $2,000 MXN/mes = Timbres ilimitados
"""

import base64
import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class FacturamaIntegration(BaseIntegration):
    """
    Cliente Facturama API (CFDI 4.0).

    Endpoints principales:
      GET    /api/3/profiles
      POST   /api/3/cfdis
      GET    /api/3/cfdis/{id}
      DELETE /api/3/cfdis/{id}
      GET    /api/3/cfdis/{id}/pdf
      GET    /api/3/cfdis/{id}/xml
    """

    def _get_sandbox_url(self) -> str:
        return "https://apisandbox.facturama.mx"

    def _get_production_url(self) -> str:
        return "https://api.facturama.mx"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.user = cfg.get("user") or os.getenv("FACTURAMA_USER")
        self.password = cfg.get("password") or os.getenv("FACTURAMA_PASSWORD")
        if os.getenv("FACTURAMA_SANDBOX", "true").lower() == "true":
            self.is_sandbox = True

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        if self.user and self.password:
            creds = base64.b64encode(f"{self.user}:{self.password}".encode()).decode()
            headers["Authorization"] = f"Basic {creds}"
        return headers

    def _base(self) -> str:
        return self._get_base_url()

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """GET /api/3/profiles para verificar Basic Auth."""
        if not all([self.user, self.password]):
            return {"success": False, "provider": "Facturama", "message": "Credentials not configured"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self._base()}/api/3/profiles", headers=self._get_headers()) as resp:
                    if resp.status == 200:
                        return {
                            "success": True,
                            "provider": "Facturama",
                            "message": "Connected successfully",
                            "mode": "SANDBOX" if self.is_sandbox else "PRODUCTION",
                        }
                    err = (await resp.json()).get("Message", f"HTTP {resp.status}")
                    return {"success": False, "provider": "Facturama", "message": err}
        except Exception as e:
            logger.error(f"Facturama connection test failed: {e}")
            return {"success": False, "provider": "Facturama", "message": str(e)}

    # ── Invoice creation ──────────────────────────────────────────────────────

    async def create_invoice(
        self,
        customer_rfc: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        payment_form: str = "03",
        payment_method: str = "PUE",
        cfdi_use: str = "G03",
    ) -> Dict[str, Any]:
        """
        POST /api/3/cfdis — Crea y timbra CFDI 4.0.

        Items format:
        [{"ProductCode": "01010101", "Description": "...",
          "Quantity": 1, "UnitPrice": 100.0, "TaxObject": "02"}]

        Args:
            payment_form: Clave SAT forma de pago (01-30)
            payment_method: PUE | PPD
            cfdi_use: Clave SAT uso CFDI (G01-P01)
        """
        payload = {
            "Receiver": {"Rfc": customer_rfc, "Name": customer_name, "CfdiUse": cfdi_use},
            "CfdiType": "I",
            "PaymentForm": payment_form,
            "PaymentMethod": payment_method,
            "Items": items,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/api/3/cfdis", headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status in (200, 201):
                    stamp = data.get("Complement", {}).get("TaxStamp", {})
                    return {
                        "success": True,
                        "provider": "facturama",
                        "uuid": stamp.get("Uuid"),
                        "folio_number": data.get("Folio"),
                        "serie": data.get("Serie"),
                        "total": data.get("Total"),
                        "subtotal": data.get("Subtotal"),
                        "status": "valid",
                        "timbrado_at": data.get("Date"),
                    }
                return {
                    "success": False,
                    "provider": "facturama",
                    "error": data.get("Message", "Unknown error"),
                    "details": data.get("ModelState", {}),
                }

    # ── Read / Cancel ─────────────────────────────────────────────────────────

    async def get_invoice(self, cfdi_id: str) -> Dict[str, Any]:
        """GET /api/3/cfdis/{id}"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/api/3/cfdis/{cfdi_id}", headers=self._get_headers()
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "invoice": data}
                return {"success": False, "error": data.get("Message")}

    async def cancel_invoice(
        self,
        cfdi_id: str,
        motive: str = "02",
        substitution_uuid: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        DELETE /api/3/cfdis/{id}

        Args:
            motive: 01-04 (clave SAT de cancelacion)
        """
        params: Dict[str, Any] = {"motive": motive}
        if substitution_uuid:
            params["substitution"] = substitution_uuid
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{self._base()}/api/3/cfdis/{cfdi_id}",
                headers=self._get_headers(),
                params=params,
            ) as resp:
                if resp.status == 200:
                    return {"success": True, "message": "Invoice cancelled"}
                data = await resp.json()
                return {"success": False, "error": data.get("Message")}

    # ── Downloads ─────────────────────────────────────────────────────────────

    async def download_pdf(self, cfdi_id: str) -> bytes:
        """GET /api/3/cfdis/{id}/pdf"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/api/3/cfdis/{cfdi_id}/pdf", headers=self._get_headers()
            ) as resp:
                if resp.status == 200:
                    return await resp.read()
                raise ValueError(f"Failed to download PDF: HTTP {resp.status}")

    async def download_xml(self, cfdi_id: str) -> bytes:
        """GET /api/3/cfdis/{id}/xml"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/api/3/cfdis/{cfdi_id}/xml", headers=self._get_headers()
            ) as resp:
                if resp.status == 200:
                    return await resp.read()
                raise ValueError(f"Failed to download XML: HTTP {resp.status}")


facturama_integration = FacturamaIntegration()
