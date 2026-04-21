"""Tests para Amazon Integration."""

import pytest
from src.integrations.amazon_integration import AmazonIntegration, amazon_integration


@pytest.mark.asyncio
async def test_amazon_singleton_exists():
    assert amazon_integration is not None
    assert amazon_integration.name == "AmazonIntegration"


@pytest.mark.asyncio
async def test_amazon_test_connection_sandbox():
    result = await amazon_integration.test_connection()
    assert result["provider"] == "Amazon SP-API"
    assert result["success"] is True
    assert result["mode"] == "SANDBOX"


@pytest.mark.asyncio
async def test_amazon_get_catalog_items_sandbox():
    items = await amazon_integration.get_catalog_items()
    assert isinstance(items, list)
    assert len(items) > 0
    assert "asin" in items[0]


@pytest.mark.asyncio
async def test_amazon_get_orders_sandbox():
    orders = await amazon_integration.get_orders(created_after="2026-04-01T00:00:00Z")
    assert isinstance(orders, list)
    assert len(orders) > 0
    assert "AmazonOrderId" in orders[0]


@pytest.mark.asyncio
async def test_amazon_get_fba_inventory_sandbox():
    inventory = await amazon_integration.get_fba_inventory()
    assert isinstance(inventory, list)
    assert len(inventory) > 0
    assert "asin" in inventory[0]
    assert "totalQuantity" in inventory[0]


@pytest.mark.asyncio
async def test_amazon_create_fba_shipment_sandbox():
    result = await amazon_integration.create_fba_shipment(
        shipment_name="Test Shipment",
        items=[{"sku": "AMZ-SKU-001", "quantity": 10}],
        ship_from_address={"name": "Almacen", "addressLine1": "Calle 1"},
    )
    assert "ShipmentId" in result
    assert result["ShipmentStatus"] == "WORKING"


def test_amazon_sandbox_url():
    assert "sandbox" in amazon_integration._get_sandbox_url()
    assert "sandbox" not in amazon_integration._get_production_url()
