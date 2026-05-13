"""
Skydropx Service — Shipping label generation for SHOPIFY orders only.

Scope:
  ✅ Shopify orders → Skydropx
  ❌ Mercado Libre  → Mercado Envíos API (own system)
  ❌ Amazon         → Buy Shipping / FBA API (own system)
"""
import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp

logger = logging.getLogger(__name__)

_ENV = os.getenv("SKYDROPX_ENVIRONMENT", "test")

if _ENV == "live":
    _BASE_URL = "https://api.skydropx.com/v1"
    _API_KEY = os.getenv("SKYDROPX_API_KEY_LIVE", "")
else:
    _BASE_URL = "https://api-demo.skydropx.com/v1"
    _API_KEY = os.getenv("SKYDROPX_API_KEY_TEST", "")

if not _API_KEY:
    logger.warning("Skydropx API key not configured (env=%s)", _ENV)


class SkydropxService:
    """Skydropx API client — Shopify shipping only."""

    def __init__(self) -> None:
        self.base_url = _BASE_URL
        self.headers = {
            "Authorization": f"Token {_API_KEY}",
            "Content-Type": "application/json",
        }
        self._timeout = aiohttp.ClientTimeout(total=30)
        logger.info("SkydropxService ready (env=%s, Shopify-only)", _ENV)

    # ── Rates ─────────────────────────────────────────────────────────────────

    async def get_rates(
        self,
        zip_from: str,
        zip_to: str,
        parcel: Dict[str, float],
        carriers: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Quote shipping rates for a Shopify parcel.

        Args:
            parcel: {"weight": kg, "height": cm, "width": cm, "length": cm}
        Returns:
            [{"carrier", "service_level", "price", "currency", "days", "rate_id"}]
        """
        payload: Dict[str, Any] = {
            "zip_from": zip_from,
            "zip_to": zip_to,
            "parcel": parcel,
        }
        if carriers:
            payload["carriers"] = carriers

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/rates",
                headers=self.headers,
                json=payload,
                timeout=self._timeout,
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"Skydropx /rates {resp.status}: {text}")
                data = await resp.json()

        rates = [
            {
                "carrier": r.get("provider"),
                "service_level": r.get("service_level_name"),
                "price": r.get("total_pricing"),
                "currency": r.get("currency", "MXN"),
                "days": r.get("days"),
                "rate_id": r.get("rate_id"),
            }
            for r in data.get("data", [])
        ]
        logger.info("Skydropx returned %d rates (%s → %s)", len(rates), zip_from, zip_to)
        return rates

    # ── Shipments ─────────────────────────────────────────────────────────────

    async def create_shipment(
        self,
        rate_id: str,
        address_from: Dict[str, str],
        address_to: Dict[str, str],
        parcel: Dict[str, float],
        shopify_order_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a Shopify shipment and return tracking + label URL.

        address_from / address_to keys:
          name, company?, street1, city, province, zip, country, phone, email
        """
        payload: Dict[str, Any] = {
            "rate_id": rate_id,
            "address_from": address_from,
            "address_to": address_to,
            "parcels": [parcel],
            "consignment_note_class_code": "53131600",
            "consignment_note_packaging_code": "1H1",
        }
        if shopify_order_id:
            payload["reference"] = f"SHOPIFY-{shopify_order_id}"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/shipments",
                headers=self.headers,
                json=payload,
                timeout=self._timeout,
            ) as resp:
                if resp.status not in (200, 201):
                    text = await resp.text()
                    raise RuntimeError(f"Skydropx /shipments {resp.status}: {text}")
                data = await resp.json()

        s = data.get("data", {})
        logger.info("Shopify shipment created: id=%s tracking=%s", s.get("id"), s.get("tracking_number"))
        return {
            "id": s.get("id"),
            "tracking_number": s.get("tracking_number"),
            "tracking_url": s.get("tracking_url_provider"),
            "label_url": s.get("label_url"),
            "carrier": s.get("provider"),
            "status": s.get("status"),
            "price": s.get("total_pricing"),
            "created_at": s.get("created_at"),
            "order_reference": shopify_order_id,
        }

    async def get_shipment(self, shipment_id: str) -> Dict[str, Any]:
        """Fetch shipment status + tracking."""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/shipments/{shipment_id}",
                headers=self.headers,
                timeout=self._timeout,
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"Skydropx GET /shipments/{shipment_id} {resp.status}: {text}")
                data = await resp.json()

        s = data.get("data", {})
        return {
            "id": s.get("id"),
            "tracking_number": s.get("tracking_number"),
            "tracking_url": s.get("tracking_url_provider"),
            "label_url": s.get("label_url"),
            "carrier": s.get("provider"),
            "status": s.get("status"),
        }

    async def cancel_shipment(self, shipment_id: str) -> bool:
        """Cancel a Shopify shipment."""
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{self.base_url}/shipments/{shipment_id}",
                headers=self.headers,
                timeout=self._timeout,
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise RuntimeError(f"Skydropx DELETE /shipments/{shipment_id} {resp.status}: {text}")
        logger.info("Shopify shipment %s cancelled", shipment_id)
        return True


skydropx_service = SkydropxService()
