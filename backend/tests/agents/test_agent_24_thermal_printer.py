"""Tests for Agent #24 - Thermal Printer."""

import pytest
from src.agents.erp.agent_24_thermal_printer import Agent24ThermalPrinter

SHIPPING_DATA = {
    "order_id": "ORD-123",
    "tracking": "EST-2026-042",
    "recipient": "Juan Pérez",
    "address": "Av. Principal 123, Puebla",
}

PRODUCT_DATA = {
    "sku": "PROD-001",
    "name": "Taladro Inalámbrico",
    "price": "1299.00",
}

TICKET_DATA = {
    "order_id": "ORD-124",
    "total": "2598.00",
    "items": [
        {"qty": 2, "name": "Taladro", "price": 1299.0},
    ],
}


@pytest.fixture
def agent():
    return Agent24ThermalPrinter()


@pytest.mark.asyncio
async def test_thermal_shipping_label_zpl(agent):
    result = await agent.execute({
        "type": "shipping_label",
        "format": "zpl",
        "data": SHIPPING_DATA,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["format"] == "zpl"
    assert data["print_ready"] is True
    assert "ORD-123" in data["content"]


@pytest.mark.asyncio
async def test_thermal_shipping_label_pdf(agent):
    result = await agent.execute({
        "type": "shipping_label",
        "format": "pdf",
        "data": SHIPPING_DATA,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["format"] == "pdf"
    assert data["print_ready"] is False


@pytest.mark.asyncio
async def test_thermal_product_label_zpl(agent):
    result = await agent.execute({
        "type": "product_label",
        "format": "zpl",
        "data": PRODUCT_DATA,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["type"] == "product_label"
    assert "PROD-001" in data["content"]


@pytest.mark.asyncio
async def test_thermal_invoice_ticket(agent):
    result = await agent.execute({
        "type": "invoice_ticket",
        "format": "zpl",
        "data": TICKET_DATA,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["type"] == "invoice_ticket"
    assert "ORD-124" in data["content"]


@pytest.mark.asyncio
async def test_thermal_invalid_type_returns_error(agent):
    result = await agent.execute({
        "type": "barcode_only",
        "format": "zpl",
        "data": SHIPPING_DATA,
    })
    assert result["success"] is False
    assert "type" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_thermal_invalid_format_returns_error(agent):
    result = await agent.execute({
        "type": "shipping_label",
        "format": "html",
        "data": SHIPPING_DATA,
    })
    assert result["success"] is False
    assert "format" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_thermal_missing_data_fields_returns_error(agent):
    result = await agent.execute({
        "type": "shipping_label",
        "format": "zpl",
        "data": {"order_id": "ORD-001"},  # missing tracking, recipient, address
    })
    assert result["success"] is False
    assert "missing" in result["error"].lower() or "data" in result["error"]


@pytest.mark.asyncio
async def test_thermal_zpl_syntax_starts_with_xa(agent):
    result = await agent.execute({
        "type": "shipping_label",
        "format": "zpl",
        "data": SHIPPING_DATA,
    })
    assert result["success"] is True
    content = result["data"]["content"]
    assert content.startswith("^XA")
    assert content.endswith("^XZ")
