"""Tests for Agent #5 - Inventory Monitor."""

import pytest
from src.agents.erp.agent_05_inventory_monitor import Agent05InventoryMonitor


@pytest.fixture
def agent():
    return Agent05InventoryMonitor()


@pytest.mark.asyncio
async def test_check_stock_ok_sku(agent):
    result = await agent.execute({"action": "check_stock", "sku": "SKU-003"})
    assert result["success"] is True
    items = result["data"]["items"]
    assert len(items) == 1
    assert items[0]["sku"] == "SKU-003"
    assert items[0]["status"] == "ok"


@pytest.mark.asyncio
async def test_check_stock_critical_sku(agent):
    result = await agent.execute({"action": "check_stock", "sku": "SKU-001"})
    assert result["success"] is True
    item = result["data"]["items"][0]
    assert item["status"] == "critical"
    assert item["current_stock"] < item["minimum_stock"]


@pytest.mark.asyncio
async def test_check_stock_low_warning(agent):
    result = await agent.execute({"action": "check_stock", "sku": "SKU-002"})
    assert result["success"] is True
    item = result["data"]["items"][0]
    assert item["status"] == "low"


@pytest.mark.asyncio
async def test_check_stock_out_of_stock(agent):
    result = await agent.execute({"action": "check_stock", "sku": "SKU-004"})
    assert result["success"] is True
    item = result["data"]["items"][0]
    assert item["status"] == "out_of_stock"
    assert item["current_stock"] == 0


@pytest.mark.asyncio
async def test_get_all_alerts(agent):
    result = await agent.execute({"action": "get_alerts"})
    assert result["success"] is True
    data = result["data"]
    assert "alerts" in data
    assert data["total_alerts"] >= 1
    for alert in data["alerts"]:
        assert alert["status"] != "ok"


@pytest.mark.asyncio
async def test_suggest_reorder_returns_suggestions(agent):
    result = await agent.execute({"action": "suggest_reorder"})
    assert result["success"] is True
    data = result["data"]
    assert "reorder_suggestions" in data
    assert data["total_suggestions"] >= 1
    for suggestion in data["reorder_suggestions"]:
        assert suggestion["suggestion"] is not None
        assert "order_" in suggestion["suggestion"]


@pytest.mark.asyncio
async def test_invalid_action_returns_error(agent):
    result = await agent.execute({"action": "delete_all"})
    assert result["success"] is False
    assert "Invalid action" in result["error"]


@pytest.mark.asyncio
async def test_invalid_sku_returns_error(agent):
    result = await agent.execute({"action": "check_stock", "sku": "SKU-NONEXISTENT"})
    assert result["success"] is False
    assert "SKU not found" in result["error"]
