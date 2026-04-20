"""Tests for Agent #32 - Quote Generator."""

import pytest
from src.agents.crm.agent_32_quote_generator import Agent32QuoteGenerator

VALID_CUSTOMER = {
    "name": "Ferretería Central",
    "contact": "Juan Pérez",
    "email": "juan@ferreteria.com",
}

SINGLE_ITEM = [
    {"sku": "SKU-001", "description": "Taladro Inalámbrico", "quantity": 10, "unit_price": 450.0}
]

MULTI_ITEMS = [
    {"sku": "SKU-001", "description": "Taladro Inalámbrico", "quantity": 10, "unit_price": 450.0},
    {"sku": "SKU-002", "description": "Sierra Circular",    "quantity": 5,  "unit_price": 1200.0},
]


@pytest.fixture
def agent():
    return Agent32QuoteGenerator()


@pytest.mark.asyncio
async def test_quote_generate_single_item(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": SINGLE_ITEM,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["quote_number"].startswith("COT-")
    assert data["customer_name"] == "Ferretería Central"
    assert data["items_count"] == 1


@pytest.mark.asyncio
async def test_quote_generate_multiple_items(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": MULTI_ITEMS,
    })
    assert result["success"] is True
    assert result["data"]["items_count"] == 2


@pytest.mark.asyncio
async def test_quote_calculate_totals_single(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": SINGLE_ITEM,  # 10 * 450 = 4500
    })
    assert result["success"] is True
    data = result["data"]
    assert data["subtotal"] == 4500.0
    assert data["tax"] == 720.0      # 4500 * 0.16
    assert data["total"] == 5220.0


@pytest.mark.asyncio
async def test_quote_calculate_totals_multiple(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": MULTI_ITEMS,  # 4500 + 6000 = 10500
    })
    assert result["success"] is True
    data = result["data"]
    assert data["subtotal"] == 10500.0
    assert data["tax"] == 1680.0
    assert data["total"] == 12180.0


@pytest.mark.asyncio
async def test_quote_apply_custom_tax_rate(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": SINGLE_ITEM,
        "tax_rate": 0.0,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["tax"] == 0.0
    assert data["total"] == data["subtotal"]


@pytest.mark.asyncio
async def test_quote_payment_terms(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": SINGLE_ITEM,
        "payment_terms": "60_days",
    })
    assert result["success"] is True
    assert result["data"]["payment_terms"] == "60_days"


@pytest.mark.asyncio
async def test_quote_valid_until_specified(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": SINGLE_ITEM,
        "valid_until": "2026-05-21",
    })
    assert result["success"] is True
    assert result["data"]["valid_until"] == "2026-05-21"


@pytest.mark.asyncio
async def test_quote_missing_customer_returns_error(agent):
    result = await agent.execute({"items": SINGLE_ITEM})
    assert result["success"] is False
    assert "customer" in result["error"].lower()


@pytest.mark.asyncio
async def test_quote_zero_quantity_returns_error(agent):
    result = await agent.execute({
        "customer": VALID_CUSTOMER,
        "items": [{"sku": "SKU-001", "quantity": 0, "unit_price": 100.0}],
    })
    assert result["success"] is False
    assert "quantity" in result["error"]
