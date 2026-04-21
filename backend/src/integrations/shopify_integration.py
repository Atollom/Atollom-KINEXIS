"""
Shopify Integration
Sandbox: Development Store
Production: Client's store
Docs: https://shopify.dev/docs/api/admin-rest
"""

import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class ShopifyIntegration(BaseIntegration):
    """
    Cliente Shopify Admin REST API.

    Endpoints principales:
      GET  /admin/api/{v}/shop.json
      GET  /admin/api/{v}/products.json
      GET  /admin/api/{v}/orders.json
      POST /admin/api/{v}/orders/{id}/fulfillments.json
      POST /admin/api/{v}/inventory_levels/set.json
    """

    def _get_sandbox_url(self) -> str:
        store = os.getenv("SHOPIFY_STORE_URL", "your-dev-store.myshopify.com")
        return f"https://{store}"

    def _get_production_url(self) -> str:
        store = os.getenv("SHOPIFY_STORE_URL")
        if not store:
            raise ValueError("SHOPIFY_STORE_URL not configured")
        return f"https://{store}"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.store_url = cfg.get("store_url") or os.getenv("SHOPIFY_STORE_URL")
        self.access_token = cfg.get("access_token") or os.getenv("SHOPIFY_ACCESS_TOKEN")
        self.api_version = cfg.get("api_version") or os.getenv("SHOPIFY_API_VERSION", "2024-04")

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        if self.access_token:
            headers["X-Shopify-Access-Token"] = self.access_token
        return headers

    def _api_url(self, path: str) -> str:
        return f"{self._get_base_url()}/admin/api/{self.api_version}/{path}"

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """Test conexion via GET /shop.json"""
        if not self.access_token:
            return {"success": False, "provider": "Shopify", "message": "Access token not configured"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self._api_url("shop.json"), headers=self._get_headers()) as resp:
                    if resp.status == 200:
                        shop = (await resp.json()).get("shop", {})
                        return {
                            "success": True,
                            "provider": "Shopify",
                            "message": f"Connected to {shop.get('name', 'store')}",
                            "mode": "SANDBOX" if self.is_sandbox else "PRODUCTION",
                            "shop_domain": shop.get("domain"),
                        }
                    return {"success": False, "provider": "Shopify", "message": f"HTTP {resp.status}"}
        except Exception as e:
            logger.error(f"Shopify connection test failed: {e}")
            return {"success": False, "provider": "Shopify", "message": str(e)}

    # ── Products ──────────────────────────────────────────────────────────────

    async def get_products(
        self,
        limit: int = 50,
        since_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """GET /products.json"""
        params: Dict[str, Any] = {"limit": limit}
        if since_id:
            params["since_id"] = since_id
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self._api_url("products.json"), headers=self._get_headers(), params=params
            ) as resp:
                return (await resp.json()).get("products", [])

    async def get_product(self, product_id: int) -> Dict[str, Any]:
        """GET /products/{id}.json"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self._api_url(f"products/{product_id}.json"), headers=self._get_headers()
            ) as resp:
                return (await resp.json()).get("product", {})

    # ── Orders ────────────────────────────────────────────────────────────────

    async def get_orders(
        self,
        status: str = "any",
        limit: int = 50,
        since_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """GET /orders.json — status: open | closed | cancelled | any"""
        params: Dict[str, Any] = {"status": status, "limit": limit}
        if since_id:
            params["since_id"] = since_id
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self._api_url("orders.json"), headers=self._get_headers(), params=params
            ) as resp:
                return (await resp.json()).get("orders", [])

    async def get_order(self, order_id: int) -> Dict[str, Any]:
        """GET /orders/{id}.json"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self._api_url(f"orders/{order_id}.json"), headers=self._get_headers()
            ) as resp:
                return (await resp.json()).get("order", {})

    # ── Fulfillments ──────────────────────────────────────────────────────────

    async def create_fulfillment(
        self,
        order_id: int,
        line_items: List[Dict[str, Any]],
        tracking_number: Optional[str] = None,
        tracking_company: Optional[str] = None,
    ) -> Dict[str, Any]:
        """POST /orders/{id}/fulfillments.json"""
        payload: Dict[str, Any] = {
            "fulfillment": {"line_items": line_items, "notify_customer": True}
        }
        if tracking_number:
            payload["fulfillment"]["tracking_number"] = tracking_number
        if tracking_company:
            payload["fulfillment"]["tracking_company"] = tracking_company
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._api_url(f"orders/{order_id}/fulfillments.json"),
                headers=self._get_headers(),
                json=payload,
            ) as resp:
                return (await resp.json()).get("fulfillment", {})

    # ── Inventory ─────────────────────────────────────────────────────────────

    async def update_inventory(
        self,
        inventory_item_id: int,
        location_id: int,
        available: int,
    ) -> Dict[str, Any]:
        """POST /inventory_levels/set.json"""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._api_url("inventory_levels/set.json"),
                headers=self._get_headers(),
                json={
                    "location_id": location_id,
                    "inventory_item_id": inventory_item_id,
                    "available": available,
                },
            ) as resp:
                return (await resp.json()).get("inventory_level", {})


shopify_integration = ShopifyIntegration()
