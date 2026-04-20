"""Tests for Agent #14 - Returns Manager."""

import pytest
from src.agents.ecommerce.agent_14_returns_manager import Agent14ReturnsManager

VALID_ITEMS = [{"sku": "PROD-001", "quantity": 1, "unit_price": 500.0}]


@pytest.fixture
def agent():
    return Agent14ReturnsManager()


@pytest.mark.asyncio
async def test_authorize_valid_return_mercadolibre(agent):
    result = await agent.execute({
        "order_id": "ML-ORDER-001",
        "channel": "mercadolibre",
        "reason": "producto_defectuoso",
        "items": VALID_ITEMS,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["status"] == "authorized"
    assert data["refund_amount"] == 500.0
    assert data["restocking_fee"] == 0.0
    assert data["policy"] == "30_days"


@pytest.mark.asyncio
async def test_shopify_restocking_fee_no_deseado(agent):
    result = await agent.execute({
        "order_id": "SH-ORDER-001",
        "channel": "shopify",
        "reason": "no_deseado",
        "items": [{"sku": "PROD-002", "quantity": 2, "unit_price": 200.0}],
    })
    assert result["success"] is True
    data = result["data"]
    assert data["restocking_fee"] == 40.0   # 10% of 400
    assert data["refund_amount"] == 360.0
    assert data["policy"] == "15_days"


@pytest.mark.asyncio
async def test_no_restocking_fee_defective(agent):
    result = await agent.execute({
        "order_id": "SH-ORDER-002",
        "channel": "shopify",
        "reason": "producto_defectuoso",
        "items": [{"sku": "PROD-003", "quantity": 1, "unit_price": 1000.0}],
    })
    assert result["success"] is True
    assert result["data"]["restocking_fee"] == 0.0
    assert result["data"]["refund_amount"] == 1000.0


@pytest.mark.asyncio
async def test_invalid_channel_returns_error(agent):
    result = await agent.execute({
        "order_id": "ORD-001",
        "channel": "walmart",
        "reason": "no_deseado",
        "items": VALID_ITEMS,
    })
    assert result["success"] is False
    assert "channel" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_invalid_reason_returns_error(agent):
    result = await agent.execute({
        "order_id": "ORD-002",
        "channel": "amazon",
        "reason": "me_arrepenti",
        "items": VALID_ITEMS,
    })
    assert result["success"] is False
    assert "reason" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_empty_items_returns_error(agent):
    result = await agent.execute({
        "order_id": "ORD-003",
        "channel": "amazon",
        "reason": "no_deseado",
        "items": [],
    })
    assert result["success"] is False
    assert "items" in result["error"]


@pytest.mark.asyncio
async def test_amazon_return_policy_30_days(agent):
    result = await agent.execute({
        "order_id": "AMZ-ORDER-001",
        "channel": "amazon",
        "reason": "llegó_dañado",
        "items": VALID_ITEMS,
    })
    assert result["success"] is True
    assert result["data"]["policy"] == "30_days"
    assert result["data"]["restocking_fee"] == 0.0
