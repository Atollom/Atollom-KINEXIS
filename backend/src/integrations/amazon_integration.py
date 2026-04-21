"""
Amazon SP-API Integration
Sandbox: https://developer-docs.amazon.com/sp-api/docs/sp-api-sandbox
Production: Real seller data
Docs: https://developer-docs.amazon.com/sp-api/
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class AmazonIntegration(BaseIntegration):
    """
    Cliente Amazon SP-API.

    Nota: AWS Signature V4 requerida en produccion.
    En produccion usar: python-amazon-sp-api

    Endpoints principales:
      GET  /catalog/2022-04-01/items
      GET  /orders/v0/orders
      GET  /fba/inventory/v1/summaries
      POST /fba/inbound/v0/shipments
    """

    def _get_sandbox_url(self) -> str:
        return "https://sandbox.sellingpartnerapi-na.amazon.com"

    def _get_production_url(self) -> str:
        return "https://sellingpartnerapi-na.amazon.com"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.seller_id = cfg.get("seller_id") or os.getenv("AMAZON_SELLER_ID")
        self.marketplace_id = cfg.get("marketplace_id") or os.getenv("AMAZON_MARKETPLACE_ID", "ATVPDKIKX0DER")
        self.access_key = cfg.get("access_key") or os.getenv("AMAZON_ACCESS_KEY")
        self.secret_key = cfg.get("secret_key") or os.getenv("AMAZON_SECRET_KEY")
        self.refresh_token = cfg.get("refresh_token") or os.getenv("AMAZON_REFRESH_TOKEN")
        self._access_token: Optional[str] = None

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """En sandbox siempre OK; en produccion verifica credenciales."""
        if self.is_sandbox:
            return {
                "success": True,
                "provider": "Amazon SP-API",
                "message": "Sandbox mode active",
                "mode": "SANDBOX",
            }
        if not all([self.seller_id, self.access_key, self.secret_key]):
            return {
                "success": False,
                "provider": "Amazon SP-API",
                "message": "Missing credentials (AMAZON_SELLER_ID / AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY)",
            }
        return {
            "success": True,
            "provider": "Amazon SP-API",
            "message": "Credentials configured",
            "mode": "PRODUCTION",
        }

    # ── Catalog ───────────────────────────────────────────────────────────────

    async def get_catalog_items(
        self,
        keywords: Optional[str] = None,
        identifiers: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """GET /catalog/2022-04-01/items — sandbox retorna mock."""
        if self.is_sandbox:
            return [
                {
                    "asin": "B08N5WRWNW",
                    "attributes": {
                        "item_name": [{"value": "Example Product (SANDBOX)"}],
                        "brand": [{"value": "Example Brand"}],
                        "list_price": [{"value": 29.99, "currency": "USD"}],
                    },
                    "identifiers": {"marketplaceId": self.marketplace_id},
                }
            ]
        logger.warning("Amazon production catalog API not yet implemented")
        return []

    # ── Orders ────────────────────────────────────────────────────────────────

    async def get_orders(
        self,
        created_after: str,
        created_before: Optional[str] = None,
        order_statuses: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        GET /orders/v0/orders

        Args:
            created_after: ISO 8601 (e.g. "2026-04-01T00:00:00Z")
            order_statuses: ["Pending", "Unshipped", "Shipped", "Canceled"]
        """
        if self.is_sandbox:
            return [
                {
                    "AmazonOrderId": "123-4567890-1234567",
                    "PurchaseDate": "2026-04-21T10:00:00Z",
                    "OrderStatus": "Pending",
                    "FulfillmentChannel": "MFN",
                    "OrderTotal": {"CurrencyCode": "USD", "Amount": "59.99"},
                    "NumberOfItemsShipped": 0,
                    "NumberOfItemsUnshipped": 2,
                }
            ]
        logger.warning("Amazon production orders API not yet implemented")
        return []

    # ── FBA Inventory ─────────────────────────────────────────────────────────

    async def get_fba_inventory(self) -> List[Dict[str, Any]]:
        """GET /fba/inventory/v1/summaries"""
        if self.is_sandbox:
            return [
                {
                    "asin": "B08N5WRWNW",
                    "fnSku": "X001ABC123",
                    "sellerSku": "AMZ-SKU-001",
                    "condition": "NewItem",
                    "totalQuantity": 150,
                    "inboundWorkingQuantity": 0,
                    "inboundShippedQuantity": 0,
                    "inboundReceivingQuantity": 0,
                }
            ]
        logger.warning("Amazon production FBA inventory API not yet implemented")
        return []

    async def create_fba_shipment(
        self,
        shipment_name: str,
        items: List[Dict[str, Any]],
        ship_from_address: Dict[str, str],
    ) -> Dict[str, Any]:
        """POST /fba/inbound/v0/shipments"""
        if self.is_sandbox:
            return {
                "ShipmentId": f"FBA{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "ShipmentName": shipment_name,
                "ShipmentStatus": "WORKING",
                "DestinationFulfillmentCenterId": "PHX3",
            }
        logger.warning("Amazon production FBA shipment API not yet implemented")
        return {}


amazon_integration = AmazonIntegration()
