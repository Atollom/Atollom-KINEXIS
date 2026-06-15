"""Agent #25 — Skydropx Shipping"""
import logging
import os
from datetime import datetime

import aiohttp

from src.utils.database import db

logger = logging.getLogger(__name__)

_BASE = "https://api.skydropx.com/v1"


def _headers() -> dict:
    return {
        "Authorization": f"Token token={os.getenv('SKYDROPX_API_KEY', '')}",
        "Content-Type": "application/json",
    }


class SkydropShippingAgent:
    name = "Skydropx Shipping #25"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "calculate_cost")
        try:
            if action == "calculate_cost":
                return await self._calculate_cost(data)
            elif action == "create_shipping_guide":
                return await self._create_guide(tenant_id, data)
            elif action == "get_tracking":
                return await self._get_tracking(data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("SkydropShipping failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _calculate_cost(self, data: dict) -> dict:
        payload = {
            "zipcode_from": data.get("origin", {}).get("zip", ""),
            "zipcode_to": data.get("destination", {}).get("zip", ""),
            "parcel": {
                "weight": data.get("package", {}).get("weight_kg", 1),
                "height": data.get("package", {}).get("height_cm", 10),
                "width": data.get("package", {}).get("width_cm", 10),
                "length": data.get("package", {}).get("length_cm", 10),
            },
        }
        api_key = os.getenv("SKYDROPX_API_KEY", "")
        if not api_key:
            return {
                "success": True,
                "data": {
                    "rates": [
                        {"carrier": "estafeta", "service": "standard", "price": 120.0, "days": 3},
                        {"carrier": "dhl", "service": "express", "price": 189.0, "days": 1},
                        {"carrier": "fedex", "service": "standard", "price": 145.0, "days": 2},
                    ],
                    "mode": "estimate",
                },
            }
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{_BASE}/rates", json=payload, headers=_headers()) as resp:
                body = await resp.json()
                if resp.status == 200:
                    rates = [
                        {
                            "carrier": r.get("carrier", {}).get("name", ""),
                            "service": r.get("service_level_name", ""),
                            "price": float(r.get("total_pricing", 0)),
                            "days": r.get("days", "?"),
                            "rate_id": r.get("id"),
                        }
                        for r in body.get("data", [])
                    ]
                    return {"success": True, "data": {"rates": rates}}
                return {"success": False, "error": body.get("message", f"HTTP {resp.status}"), "data": {}}

    async def _create_guide(self, tenant_id: str, data: dict) -> dict:
        payload = {
            "consignment": {
                "address_from": {
                    "province": data.get("origin", {}).get("state", ""),
                    "city": data.get("origin", {}).get("city", ""),
                    "name": data.get("origin", {}).get("name", ""),
                    "zip": data.get("origin", {}).get("zip", ""),
                    "country": "MX",
                    "street1": data.get("origin", {}).get("street", ""),
                    "phone": data.get("origin", {}).get("phone", ""),
                },
                "address_to": {
                    "province": data.get("destination", {}).get("state", ""),
                    "city": data.get("destination", {}).get("city", ""),
                    "name": data.get("destination", {}).get("name", ""),
                    "zip": data.get("destination", {}).get("zip", ""),
                    "country": "MX",
                    "street1": data.get("destination", {}).get("street", ""),
                    "phone": data.get("destination", {}).get("phone", ""),
                    "email": data.get("destination", {}).get("email", ""),
                },
                "parcel": {
                    "weight": data.get("package", {}).get("weight_kg", 1),
                    "height": data.get("package", {}).get("height_cm", 10),
                    "width": data.get("package", {}).get("width_cm", 10),
                    "length": data.get("package", {}).get("length_cm", 10),
                    "description": data.get("package", {}).get("description", "Mercancia"),
                },
                "rate_id": data.get("rate_id"),
            }
        }
        api_key = os.getenv("SKYDROPX_API_KEY", "")
        if not api_key:
            tracking = f"SKY{int(datetime.now().timestamp())}"
            guide_url = f"https://skydropx.com/guides/{tracking}.pdf"
            await db.execute(
                "INSERT INTO skydrop_labels (tenant_id, tracking_number, carrier, label_url, created_at) "
                "VALUES ($1,$2,$3,$4,NOW())",
                tenant_id, tracking, data.get("carrier", ""), guide_url,
            )
            return {"success": True, "data": {"tracking_number": tracking, "guide_url": guide_url, "mode": "sandbox"}}

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{_BASE}/shipments", json=payload, headers=_headers()) as resp:
                body = await resp.json()
                if resp.status in (200, 201):
                    tracking = body.get("tracking_number", "")
                    guide_url = body.get("label_url", "")
                    await db.execute(
                        "INSERT INTO skydrop_labels (tenant_id, tracking_number, carrier, label_url, created_at) "
                        "VALUES ($1,$2,$3,$4,NOW())",
                        tenant_id, tracking, data.get("carrier", ""), guide_url,
                    )
                    return {"success": True, "data": {"tracking_number": tracking, "guide_url": guide_url}}
                return {"success": False, "error": body.get("message", f"HTTP {resp.status}"), "data": {}}

    async def _get_tracking(self, data: dict) -> dict:
        tracking = data.get("tracking_number", "")
        api_key = os.getenv("SKYDROPX_API_KEY", "")
        if not api_key:
            return {"success": True, "data": {"tracking_number": tracking, "status": "in_transit", "mode": "sandbox"}}
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{_BASE}/shipments/tracking?tracking_number={tracking}", headers=_headers()
            ) as resp:
                body = await resp.json()
                if resp.status == 200:
                    return {"success": True, "data": body}
                return {"success": False, "error": body.get("message", f"HTTP {resp.status}"), "data": {}}


skydrop_shipping = SkydropShippingAgent()
