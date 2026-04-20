"""Tests for Agent #2 - Amazon FBA Manager."""

import pytest
from src.agents.ecommerce.agent_02_amazon_fba import Agent02AmazonFBA


@pytest.fixture
def agent():
    return Agent02AmazonFBA()


@pytest.mark.asyncio
async def test_sync_inventory_success(agent):
    result = await agent.execute({
        "action": "sync_inventory",
        "sku": "PROD-001",
        "quantity": 50,
        "warehouse": "amazon_fba_mx",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "sync_inventory"
    assert data["quantity_synced"] == 50
    assert data["status"] == "synced"


@pytest.mark.asyncio
async def test_create_shipment_success(agent):
    result = await agent.execute({
        "action": "create_shipment",
        "sku": "PROD-002",
        "quantity": 100,
        "warehouse": "amazon_fba_us",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "create_shipment"
    assert data["quantity"] == 100
    assert data["status"] == "pending_creation"
    assert "estimated_arrival" in data


@pytest.mark.asyncio
async def test_get_status_success(agent):
    result = await agent.execute({
        "action": "get_status",
        "sku": "PROD-003",
        "warehouse": "amazon_fba_eu",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "get_status"
    assert data["sku"] == "PROD-003"


@pytest.mark.asyncio
async def test_invalid_action_returns_error(agent):
    result = await agent.execute({
        "action": "delete_all",
        "sku": "PROD-001",
        "warehouse": "amazon_fba_mx",
    })
    assert result["success"] is False
    assert "Invalid action" in result["error"]


@pytest.mark.asyncio
async def test_missing_quantity_for_sync_returns_error(agent):
    result = await agent.execute({
        "action": "sync_inventory",
        "sku": "PROD-001",
        "warehouse": "amazon_fba_mx",
    })
    assert result["success"] is False
    assert "quantity" in result["error"]


@pytest.mark.asyncio
async def test_invalid_warehouse_returns_error(agent):
    result = await agent.execute({
        "action": "get_status",
        "sku": "PROD-001",
        "warehouse": "warehouse_desconocido",
    })
    assert result["success"] is False
    assert "warehouse" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_response_contains_timestamp(agent):
    result = await agent.execute({
        "action": "get_status",
        "sku": "SKU-XYZ",
        "warehouse": "amazon_fba_ca",
    })
    assert "timestamp" in result
    assert "agent" in result
