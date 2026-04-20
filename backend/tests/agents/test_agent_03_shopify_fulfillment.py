"""Tests for Agent #3 - Shopify Fulfillment."""

import pytest
from src.agents.ecommerce.agent_03_shopify_fulfillment import Agent03ShopifyFulfillment

VALID_ADDRESS = {
    "name": "Juan Pérez",
    "address": "Av. Insurgentes 123",
    "city": "CDMX",
    "zip": "06600",
}

VALID_ITEMS = [{"sku": "PROD-001", "quantity": 2}]


@pytest.fixture
def agent():
    return Agent03ShopifyFulfillment()


@pytest.mark.asyncio
async def test_fulfill_order_success(agent):
    result = await agent.execute({
        "order_id": "SH-100001",
        "items": VALID_ITEMS,
        "shipping_address": VALID_ADDRESS,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["order_id"] == "SH-100001"
    assert data["status"] == "queued_for_fulfillment"
    assert data["items_count"] == 1


@pytest.mark.asyncio
async def test_multiple_items(agent):
    items = [
        {"sku": "PROD-001", "quantity": 3},
        {"sku": "PROD-002", "quantity": 1},
    ]
    result = await agent.execute({
        "order_id": "SH-100002",
        "items": items,
        "shipping_address": VALID_ADDRESS,
    })
    assert result["success"] is True
    assert result["data"]["items_count"] == 2


@pytest.mark.asyncio
async def test_missing_order_id_returns_error(agent):
    result = await agent.execute({
        "items": VALID_ITEMS,
        "shipping_address": VALID_ADDRESS,
    })
    assert result["success"] is False
    assert "order_id" in result["error"]


@pytest.mark.asyncio
async def test_empty_items_returns_error(agent):
    result = await agent.execute({
        "order_id": "SH-100003",
        "items": [],
        "shipping_address": VALID_ADDRESS,
    })
    assert result["success"] is False
    assert "items" in result["error"]


@pytest.mark.asyncio
async def test_invalid_quantity_returns_error(agent):
    result = await agent.execute({
        "order_id": "SH-100004",
        "items": [{"sku": "PROD-001", "quantity": 0}],
        "shipping_address": VALID_ADDRESS,
    })
    assert result["success"] is False
    assert "quantity" in result["error"]


@pytest.mark.asyncio
async def test_missing_address_field_returns_error(agent):
    incomplete_address = {"name": "Juan", "address": "Calle 1"}
    result = await agent.execute({
        "order_id": "SH-100005",
        "items": VALID_ITEMS,
        "shipping_address": incomplete_address,
    })
    assert result["success"] is False
    assert "shipping_address" in result["error"]


@pytest.mark.asyncio
async def test_response_contains_agent_metadata(agent):
    result = await agent.execute({
        "order_id": "SH-100006",
        "items": VALID_ITEMS,
        "shipping_address": VALID_ADDRESS,
    })
    assert "timestamp" in result
    assert "Agent #3" in result["agent"]
