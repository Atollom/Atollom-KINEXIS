"""
Tests para Agent #13 — CFDI Billing
"""

import pytest
from src.agents.erp.agent_13_cfdi_billing import cfdi_billing


VALID_INPUT = {
    "tenant_id": "orthocardio",
    "customer_rfc": "XAXX010101000",
    "customer_name": "PUBLICO EN GENERAL",
    "items": [{"description": "Producto A", "qty": 2, "unit_price": 500.0, "unit_key": "H87"}],
    "total": 1000.0,
    "payment_form": "03",
    "use": "G03",
}


@pytest.mark.asyncio
async def test_cfdi_valid_input_returns_success():
    result = await cfdi_billing.execute(VALID_INPUT)
    assert result["success"] is True
    assert "data" in result


@pytest.mark.asyncio
async def test_cfdi_missing_rfc_raises_error():
    bad = {**VALID_INPUT}
    del bad["customer_rfc"]
    result = await cfdi_billing.execute(bad)
    assert result["success"] is False


@pytest.mark.asyncio
async def test_cfdi_invalid_rfc_raises_error():
    bad = {**VALID_INPUT, "customer_rfc": "INVALID"}
    result = await cfdi_billing.execute(bad)
    assert result["success"] is False
    assert "RFC" in result["error"]


@pytest.mark.asyncio
async def test_cfdi_invalid_payment_form():
    bad = {**VALID_INPUT, "payment_form": "99"}
    result = await cfdi_billing.execute(bad)
    assert result["success"] is False


@pytest.mark.asyncio
async def test_cfdi_empty_items():
    bad = {**VALID_INPUT, "items": []}
    result = await cfdi_billing.execute(bad)
    assert result["success"] is False


@pytest.mark.asyncio
async def test_cfdi_zero_total():
    bad = {**VALID_INPUT, "total": 0}
    result = await cfdi_billing.execute(bad)
    assert result["success"] is False
