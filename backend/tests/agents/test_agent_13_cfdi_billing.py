"""Tests for Agent #13 - CFDI Billing (v2 with totals calculation)."""

import pytest
from src.agents.erp.agent_13_cfdi_billing import Agent13CFDIBilling


@pytest.fixture
def agent():
    return Agent13CFDIBilling()


VALID_ITEMS = [
    {"description": "Producto A", "quantity": 2, "unit_price": 100.0, "tax_rate": 0.16}
]


@pytest.mark.asyncio
async def test_cfdi_generate_valid_invoice(agent):
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Público en General",
        "items": VALID_ITEMS,
        "payment_method": "03",
        "payment_form": "PUE",
        "use": "G03",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["uuid"] is not None
    assert data["folio"].startswith("F-")
    assert data["status"] == "pending_timbrado"


@pytest.mark.asyncio
async def test_cfdi_invalid_rfc(agent):
    result = await agent.execute({
        "customer_rfc": "INVALIDO",
        "customer_name": "Empresa",
        "items": VALID_ITEMS,
        "payment_method": "03",
    })
    assert result["success"] is False
    assert "RFC" in result["error"]


@pytest.mark.asyncio
async def test_cfdi_calculate_totals_correctly(agent):
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa SA",
        "items": [{"description": "Item", "quantity": 2, "unit_price": 100.0, "tax_rate": 0.16}],
        "payment_method": "03",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["subtotal"] == 200.0
    assert data["tax"] == 32.0
    assert data["total"] == 232.0


@pytest.mark.asyncio
async def test_cfdi_multiple_items(agent):
    items = [
        {"description": "A", "quantity": 1, "unit_price": 500.0, "tax_rate": 0.16},
        {"description": "B", "quantity": 3, "unit_price": 100.0, "tax_rate": 0.16},
    ]
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa SA",
        "items": items,
        "payment_method": "03",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["subtotal"] == 800.0
    assert round(data["tax"], 2) == 128.0
    assert data["total"] == 928.0


@pytest.mark.asyncio
async def test_cfdi_zero_tax_items(agent):
    items = [{"description": "Exento", "quantity": 1, "unit_price": 1000.0, "tax_rate": 0.0}]
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa SA",
        "items": items,
        "payment_method": "01",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["tax"] == 0.0
    assert data["total"] == 1000.0


@pytest.mark.asyncio
async def test_cfdi_payment_method_validation(agent):
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa",
        "items": VALID_ITEMS,
        "payment_method": "99",
    })
    assert result["success"] is False
    assert "payment_method" in result["error"]


@pytest.mark.asyncio
async def test_cfdi_use_validation(agent):
    result = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa",
        "items": VALID_ITEMS,
        "payment_method": "03",
        "use": "ZZZ",
    })
    assert result["success"] is False
    assert "use" in result["error"]


@pytest.mark.asyncio
async def test_cfdi_folio_increments(agent):
    r1 = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa A",
        "items": VALID_ITEMS,
        "payment_method": "03",
    })
    r2 = await agent.execute({
        "customer_rfc": "XAXX010101000",
        "customer_name": "Empresa B",
        "items": VALID_ITEMS,
        "payment_method": "03",
    })
    assert r1["success"] is True
    assert r2["success"] is True
    assert r1["data"]["folio"] != r2["data"]["folio"]
