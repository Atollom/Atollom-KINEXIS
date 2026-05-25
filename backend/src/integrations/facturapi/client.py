"""
FacturAPI v2 HTTP client — KINEXIS distributor model.

Auth: HTTP Basic Auth with the API key as username, empty password.
User key (FACTURAPI_USER_KEY) creates organizations (one per tenant).
Organization key is stored in tenant record and used for CFDI timbrado.
"""

import os
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://www.facturapi.io/v2"


class FacturapiClient:
    """HTTP client for FacturAPI v2."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FACTURAPI_USER_KEY")
        if not self.api_key:
            raise ValueError("FacturAPI API key not configured (set FACTURAPI_USER_KEY)")

    def _auth(self) -> httpx.BasicAuth:
        return httpx.BasicAuth(username=self.api_key, password="")

    # ── Organizations ─────────────────────────────────────────────────────────

    async def create_organization(
        self,
        legal_name: str,
        tax_id: str,
        tax_system: str,
        zip: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """
        POST /v2/organizations — Creates one organization per tenant RFC.

        Args:
            legal_name: Razón social
            tax_id: RFC (e.g. "ABC123456789")
            tax_system: Régimen fiscal code (e.g. "601")
            zip: Código postal
        Returns:
            FacturAPI organization dict with "id" field
        """
        payload: Dict[str, Any] = {
            "legal_name": legal_name,
            "tax_id": tax_id,
            "tax_system": tax_system,
            "address": {"zip": zip},
        }
        payload.update(kwargs)

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{BASE_URL}/organizations",
                json=payload,
                auth=self._auth(),
            )
            resp.raise_for_status()
            return resp.json()

    async def get_organization(self, org_id: str) -> Dict[str, Any]:
        """GET /v2/organizations/{id}"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{BASE_URL}/organizations/{org_id}",
                auth=self._auth(),
            )
            resp.raise_for_status()
            return resp.json()

    async def list_organizations(self) -> Dict[str, Any]:
        """GET /v2/organizations"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{BASE_URL}/organizations",
                auth=self._auth(),
            )
            resp.raise_for_status()
            return resp.json()

    # ── Organization-scoped invoices ──────────────────────────────────────────

    async def create_invoice(
        self,
        org_key: str,
        customer: Dict[str, Any],
        items: list,
        payment_form: str = "03",
        payment_method: str = "PUE",
        use: str = "G03",
    ) -> Dict[str, Any]:
        """
        POST /v2/invoices using an organization-specific key.

        Args:
            org_key: The organization's secret key (stored per-tenant)
            customer: {legal_name, tax_id, tax_system, address: {zip}}
            items: [{product: {description, product_key, price}, quantity}]
        """
        payload = {
            "customer": customer,
            "items": items,
            "payment_form": payment_form,
            "payment_method": payment_method,
            "use": use,
        }
        org_auth = httpx.BasicAuth(username=org_key, password="")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{BASE_URL}/invoices",
                json=payload,
                auth=org_auth,
            )
            resp.raise_for_status()
            return resp.json()
