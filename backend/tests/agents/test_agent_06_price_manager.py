"""Tests for Agent #6 - Price Manager x3."""

import pytest
from src.agents.ecommerce.agent_06_price_manager import Agent06PriceManager


@pytest.fixture
def agent():
    return Agent06PriceManager()


@pytest.mark.asyncio
async def test_fixed_strategy_all_channels(agent):
    result = await agent.execute({
        "sku": "PROD-001",
        "base_price": 100.0,
        "channels": ["ml", "amazon", "shopify"],
        "strategy": "fixed",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["channels_updated"] == 3
    for ch in ["ml", "amazon", "shopify"]:
        assert data["updates"][ch]["new_price"] == 100.0


@pytest.mark.asyncio
async def test_competitive_strategy_applies_margins(agent):
    result = await agent.execute({
        "sku": "PROD-002",
        "base_price": 1000.0,
        "channels": ["ml", "amazon", "shopify"],
        "strategy": "competitive",
    })
    assert result["success"] is True
    updates = result["data"]["updates"]
    assert updates["ml"]["new_price"] == 1050.0
    assert updates["amazon"]["new_price"] == 1080.0
    assert updates["shopify"]["new_price"] == 1000.0


@pytest.mark.asyncio
async def test_single_channel_ml(agent):
    result = await agent.execute({
        "sku": "PROD-003",
        "base_price": 500.0,
        "channels": ["ml"],
    })
    assert result["success"] is True
    assert result["data"]["channels_updated"] == 1
    assert "ml" in result["data"]["updates"]


@pytest.mark.asyncio
async def test_duplicate_channels_deduplicated(agent):
    result = await agent.execute({
        "sku": "PROD-004",
        "base_price": 200.0,
        "channels": ["ml", "ml", "shopify"],
    })
    assert result["success"] is True
    assert result["data"]["channels_updated"] == 2


@pytest.mark.asyncio
async def test_invalid_channel_returns_error(agent):
    result = await agent.execute({
        "sku": "PROD-005",
        "base_price": 100.0,
        "channels": ["walmart"],
    })
    assert result["success"] is False
    assert "Invalid channels" in result["error"]


@pytest.mark.asyncio
async def test_negative_price_returns_error(agent):
    result = await agent.execute({
        "sku": "PROD-006",
        "base_price": -50.0,
        "channels": ["ml"],
    })
    assert result["success"] is False
    assert "base_price" in result["error"]


@pytest.mark.asyncio
async def test_invalid_strategy_returns_error(agent):
    result = await agent.execute({
        "sku": "PROD-007",
        "base_price": 100.0,
        "channels": ["ml"],
        "strategy": "magic",
    })
    assert result["success"] is False
    assert "strategy" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_dynamic_strategy_returns_base_price(agent):
    result = await agent.execute({
        "sku": "PROD-008",
        "base_price": 300.0,
        "channels": ["shopify"],
        "strategy": "dynamic",
    })
    assert result["success"] is True
    assert result["data"]["updates"]["shopify"]["new_price"] == 300.0
