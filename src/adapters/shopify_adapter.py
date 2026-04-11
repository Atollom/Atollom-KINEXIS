# src/adapters/shopify_adapter.py
import base64
import logging
import hmac
import hashlib
import httpx
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class ShopifyAdapter:
    """
    Wrapper para Shopify Admin REST API.
    Gestión de pedidos, inventario y webhooks.
    """

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db = db_client
        self.timeout = 30.0
        self.mock_mode = False

    async def _get_credentials(self) -> Dict[str, str]:
        """Obtiene credenciales del Vault."""
        keys = ['shopify_access_token', 'shopify_store_url', 'shopify_webhook_secret']
        secrets = await self.db.get_vault_secrets(self.tenant_id, keys)
        
        if not secrets or any(not secrets.get(k) for k in ['shopify_access_token', 'shopify_store_url']):
            self.mock_mode = True
            return {}
            
        return secrets

    async def get_orders(self, status: str = "any") -> List[Dict[str, Any]]:
        """Obtiene órdenes de Shopify."""
        creds = await self._get_credentials()
        if self.mock_mode:
            return [{"id": "S-123", "financial_status": "paid", "fulfillment_status": "null"}]

        url = f"https://{creds['shopify_store_url']}/admin/api/2024-01/orders.json"
        params = {"status": status, "limit": 250}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(
                    url,
                    headers={"X-Shopify-Access-Token": creds['shopify_access_token']},
                    params=params
                )
                res.raise_for_status()
                return res.json().get("orders", [])
        except Exception as e:
            logger.error("Error al obtener órdenes de Shopify para %s: %s", self.tenant_id, e)
            return []

    async def fulfill_order(self, shopify_order_id: str, tracking_number: str, tracking_company: str) -> Dict[str, Any]:
        """Marca una orden como enviada en Shopify."""
        if not tracking_number:
            raise ValueError("tracking_number es requerido para fulfillment.")
            
        whitelist = frozenset(['Estafeta','DHL','FedEx','UPS'])
        if tracking_company not in whitelist:
            raise ValueError(f"Paquetería {tracking_company} no permitida en Shopify Kap Tools.")

        creds = await self._get_credentials()
        if self.mock_mode:
            return {"status": "fulfilled_mock", "id": shopify_order_id}

        # Shopify Admin API v2024-01 usa Fulfillments endpoint
        url = f"https://{creds['shopify_store_url']}/admin/api/2024-01/orders/{shopify_order_id}/fulfillments.json"
        
        # En versiones recientes se crea el fulfillment con tracking info
        payload = {
            "fulfillment": {
                "tracking_info": {
                    "number": tracking_number,
                    "company": tracking_company
                },
                "notify_customer": True
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    url,
                    headers={"X-Shopify-Access-Token": creds['shopify_access_token']},
                    json=payload
                )
                res.raise_for_status()
                return {"status": "success", "data": res.json()}
        except Exception as e:
            logger.error("Error al cumplir orden Shopify %s: %s", shopify_order_id, e)
            raise

    async def update_inventory_level(self, inventory_item_id: str, location_id: str, qty: int) -> Dict[str, Any]:
        """Actualiza stock en Shopify Admin API."""
        if qty < 0:
            raise ValueError("Cantidad negativa de inventario no permitida.")

        creds = await self._get_credentials()
        if self.mock_mode:
            return {"status": "inventory_updated_mock", "id": inventory_item_id}

        url = f"https://{creds['shopify_store_url']}/admin/api/2024-01/inventory_levels/set.json"
        payload = {
            "location_id": location_id,
            "inventory_item_id": inventory_item_id,
            "available": qty
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    url,
                    headers={"X-Shopify-Access-Token": creds['shopify_access_token']},
                    json=payload
                )
                res.raise_for_status()
                return {"status": "success", "data": res.json()}
        except Exception as e:
            logger.error("Error al actualizar inventario Shopify %s: %s", inventory_item_id, e)
            raise

    async def verify_webhook(self, payload: bytes, signature: str) -> bool:
        """Verifica firma HMAC-SHA256 de Shopify."""
        creds = await self._get_credentials()
        secret = creds.get('shopify_webhook_secret')
        
        if not secret:
            logger.warning("MOCK_MODE: Sin webhook secret de Shopify, aceptando firma.")
            return True # MOCK requested if Vault {}
            
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).digest()
        # Shopify firma en base64
        try:
            actual = base64.b64decode(signature)
        except Exception:
            return False
        return hmac.compare_digest(expected, actual)
