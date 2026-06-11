"""FacturAPI client — thin wrapper around the FacturAPI REST API."""
import logging
import os
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

FACTURAPI_BASE = "https://www.facturapi.io/v2"


class FacturapiClient:
    """Async FacturAPI client. Use org_key for timbrado, user_key for org management."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FACTURAPI_USER_KEY") or os.getenv("FACTURAPI_TEST_KEY")

    def _headers(self, key: Optional[str] = None) -> Dict[str, str]:
        import base64
        k = key or self.api_key or ""
        encoded = base64.b64encode(f"{k}:".encode()).decode()
        return {"Authorization": f"Basic {encoded}", "Content-Type": "application/json"}

    async def create_organization(self, legal_name: str, rfc: str, email: str, **kwargs) -> Dict[str, Any]:
        payload = {"name": legal_name, "legal": {"name": legal_name, "rfc": rfc, "tax_system": kwargs.get("tax_system", "601"), "address": kwargs.get("address", {})}, "email": email}
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(f"{FACTURAPI_BASE}/organizations", json=payload, headers=self._headers())
            r.raise_for_status()
            return r.json()

    async def get_organization(self, org_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(f"{FACTURAPI_BASE}/organizations/{org_id}", headers=self._headers())
            r.raise_for_status()
            return r.json()

    async def create_invoice(self, org_key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{FACTURAPI_BASE}/invoices", json=payload, headers=self._headers(org_key))
            r.raise_for_status()
            return r.json()

    async def cancel_invoice(self, org_key: str, invoice_id: str, motive: str = "02") -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.delete(f"{FACTURAPI_BASE}/invoices/{invoice_id}", json={"motive": motive}, headers=self._headers(org_key))
            r.raise_for_status()
            return r.json()

    async def download_invoice(self, org_key: str, invoice_id: str, fmt: str = "pdf") -> bytes:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(f"{FACTURAPI_BASE}/invoices/{invoice_id}/{fmt}", headers=self._headers(org_key))
            r.raise_for_status()
            return r.content
