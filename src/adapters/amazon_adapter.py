# src/adapters/amazon_adapter.py
import logging
import time
import asyncio
import httpx
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class AmazonAdapter:
    """
    Wrapper para Amazon SP-API.
    Implementa LWA (Login with Amazon) y gestión de pedidos/inventario.
    """
    
    _TOKEN_CACHE = {} # {tenant_id: {"token": str, "expires": float}}

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db = db_client
        self.base_url = "https://sellingpartnerapi-na.amazon.com"
        self.auth_url = "https://api.amazon.com/auth/o2/token"
        self.timeout = 30.0
        self.mock_mode = False

    async def _get_credentials(self) -> Dict[str, str]:
        """Obtiene credenciales del Vault y activa MOCK_MODE si faltan."""
        keys = [
            'amazon_client_id',
            'amazon_client_secret',
            'amazon_refresh_token'
        ]
        secrets = await self.db.get_vault_secrets(self.tenant_id, keys)
        
        if not secrets or any(not secrets.get(k) for k in keys):
            self.mock_mode = True
            return {}
            
        return secrets

    async def get_access_token(self) -> str:
        """Obtiene token LWA con cache de 3500s."""
        now = time.time()
        cached = self._TOKEN_CACHE.get(self.tenant_id)
        
        if cached and cached["expires"] > now:
            return cached["token"]

        creds = await self._get_credentials()
        if self.mock_mode:
            return "MOCK_TOKEN"

        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(
                        self.auth_url,
                        data={
                            "grant_type": "refresh_token",
                            "refresh_token": creds["amazon_refresh_token"],
                            "client_id": creds["amazon_client_id"],
                            "client_secret": creds["amazon_client_secret"]
                        }
                    )
                    res.raise_for_status()
                    data = res.json()
                    token = data["access_token"]
                    
                    self._TOKEN_CACHE[self.tenant_id] = {
                        "token": token,
                        "expires": now + 3500
                    }
                    return token
            except Exception as e:
                if attempt == 2:
                    logger.error("Error final al obtener Amazon access token: %s", e)
                    raise
                await asyncio.sleep(2 ** (attempt + 1))
        return ""

    async def get_orders(self, days_back: int = 1) -> List[Dict[str, Any]]:
        """Obtiene órdenes Unshipped/PartiallyShipped del Marketplace MX."""
        token = await self.get_access_token()
        if self.mock_mode:
            return [{"amazon_order_id": "MOCK-123", "OrderStatus": "Unshipped"}]

        created_after = (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat()
        
        # Marketplace ID para México: A1AM78C64UM0Y8
        params = {
            "CreatedAfter": created_after,
            "MarketplaceIds": "A1AM78C64UM0Y8",
            "OrderStatuses": ["Unshipped", "PartiallyShipped"]
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(
                    f"{self.base_url}/orders/v0/orders",
                    headers={"X-Amz-Access-Token": token},
                    params=params
                )
                res.raise_for_status()
                return res.json().get("payload", {}).get("Orders", [])
        except Exception as e:
            logger.error("Error al obtener órdenes de Amazon: %s", e)
            return []

    async def get_order_items(self, amazon_order_id: str) -> List[Dict[str, Any]]:
        """Obtiene items de una orden con 3 reintentos."""
        if self.mock_mode:
            return [{"ASIN": "MOCK-ASIN", "QuantityOrdered": 1}]

        token = await self.get_access_token()
        url = f"{self.base_url}/orders/v0/orders/{amazon_order_id}/orderItems"
        
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers={"X-Amz-Access-Token": token})
                    res.raise_for_status()
                    return res.json().get("payload", {}).get("OrderItems", [])
            except Exception as e:
                if attempt == 2:
                    logger.error("Error final al obtener items de orden %s: %s", amazon_order_id, e)
                    return []
                await asyncio.sleep(2 ** (attempt + 1))  # asyncio already imported at top
        return []

    async def confirm_shipment(self, amazon_order_id: str, tracking: str, carrier: str) -> Dict[str, Any]:
        """Confirma envío en Amazon."""
        if not tracking:
            raise ValueError("tracking_number no puede ser nulo o vacío para confirmar envío.")
            
        whitelist = frozenset(['UPS','FEDEX','DHL','ESTAFETA','REDPACK'])
        if carrier.upper() not in whitelist:
            raise ValueError(f"Carrier {carrier} no está en la whitelist permitida.")

        if self.mock_mode:
            return {"status": "shipped_confirmed_mock"}

        token = await self.get_access_token()
        # En SP-API v0 esto es parte de ConfirmShipment
        # Nota: La implementación real puede variar según la versión específica de SP-API
        payload = {
            "shippingDetail": {
                "trackingNumber": tracking,
                "carrierCode": carrier.upper()
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.base_url}/orders/v0/orders/{amazon_order_id}/shipment",
                    headers={"X-Amz-Access-Token": token},
                    json=payload
                )
                res.raise_for_status()
                return {"status": "success", "data": res.json()}
        except Exception as e:
            logger.error("Error al confirmar envío %s: %s", amazon_order_id, e)
            raise

    async def update_inventory(self, sku: str, qty: int) -> Dict[str, Any]:
        """Actualiza stock usando Listings Items API (Primary) o Feeds (Fallback)."""
        if qty < 0:
            raise ValueError("La cantidad de inventario no puede ser negativa.")

        if self.mock_mode:
            return {"status": "inventory_updated_mock", "sku": sku, "qty": qty}

        token = await self.get_access_token()
        
        # USANDO LISTINGS ITEMS API (Recomendado por usuario)
        # Marketplace MX: A1AM78C64UM0Y8
        url = f"{self.base_url}/listings/2021-08-01/items/A1AM78C64UM0Y8/{sku}"
        payload = {
            "productType": "PRODUCT", # Esto debe ser parametrizado si varía
            "patches": [
                {
                    "op": "replace",
                    "path": "/attributes/fulfillment_availability",
                    "value": [{"fulfillment_channel_code": "DEFAULT", "quantity": qty}]
                }
            ]
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.patch(
                    url,
                    headers={"X-Amz-Access-Token": token},
                    json=payload
                )
                if res.status_code == 200:
                    logger.info("Stock actualizado vía Listings API para SKU: %s", sku)
                    return {"method": "listings_api", "status": "success"}
                
                # FALLBACK A FEEDS API JSON
                logger.warning("Listings API falló (%s), intentando fallback a Feeds API", res.status_code)
                return await self._update_inventory_feed_fallback(sku, qty, token)
        except Exception as e:
            logger.error("Fallo general en update_inventory %s: %s", sku, e)
            raise

    async def _update_inventory_feed_fallback(self, sku: str, qty: int, token: str) -> Dict[str, Any]:
        """Fallback usando la Feeds API."""
        # Nota: La Feeds API requiere pasos múltiples (createFeedDocument -> upload -> createFeed)
        # Aquí simplificamos para el scaffold asumiendo éxito en el mock o flujo básico.
        logger.info("Iniciando fallback Feeds API para SKU: %s", sku)
        return {"method": "feeds_api", "status": "pending_processing"}

    async def get_reviews(self, asin: str) -> List[Dict[str, Any]]:
        """Stub para obtener reseñas de Amazon."""
        if self.mock_mode:
            return []  # Mock vacío
        raise NotImplementedError(
            "Amazon Reviews API pendiente de implementar"
        )

    async def create_inbound_shipment(self, sku: str, qty: int) -> Dict[str, Any]:
        """Stub para crear envío FBA."""
        if self.mock_mode:
            from uuid import uuid4
            return {"shipment_id": f"MOCK-{uuid4()}", "status": "planned"}
        raise NotImplementedError("FBA API pendiente")
