"""Tests for Agent #30 - Purchase Orders."""

import pytest
from src.agents.erp.agent_30_purchase_orders import Agent30PurchaseOrders

VALID_ITEMS = [
    {"sku": "SKU-001", "description": "Taladro Inalámbrico", "quantity": 100, "unit_price": 42.0}
]


@pytest.fixture
def agent():
    return Agent30PurchaseOrders()


@pytest.mark.asyncio
async def test_po_create_order(agent):
    result = await agent.execute({
        "action": "create",
        "supplier_id": "SUPP-001",
        "items": VALID_ITEMS,
        "delivery_date": "2026-05-05",
        "payment_terms": "30_days",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["po_number"].startswith("PO-")
    assert data["status"] == "pending_approval"
    assert data["approver_required"] == "owner"


@pytest.mark.asyncio
async def test_po_calculate_total(agent):
    result = await agent.execute({
        "action": "create",
        "supplier_id": "SUPP-001",
        "items": [{"sku": "SKU-001", "quantity": 100, "unit_price": 42.0}],
    })
    assert result["success"] is True
    assert result["data"]["total"] == 4200.0


@pytest.mark.asyncio
async def test_po_multiple_items_total(agent):
    items = [
        {"sku": "SKU-001", "quantity": 50, "unit_price": 42.0},
        {"sku": "SKU-002", "quantity": 20, "unit_price": 100.0},
    ]
    result = await agent.execute({
        "action": "create",
        "supplier_id": "SUPP-001",
        "items": items,
    })
    assert result["success"] is True
    assert result["data"]["total"] == 4100.0  # 50*42 + 20*100
    assert result["data"]["items_count"] == 2


@pytest.mark.asyncio
async def test_po_approve_order(agent):
    result = await agent.execute({
        "action": "approve",
        "supplier_id": "SUPP-001",
        "items": VALID_ITEMS,
        "po_number": "PO-2026-001",
    })
    assert result["success"] is True
    assert result["data"]["status"] == "approved"
    assert result["data"]["approver_required"] is None


@pytest.mark.asyncio
async def test_po_send_to_supplier(agent):
    result = await agent.execute({
        "action": "send",
        "supplier_id": "SUPP-001",
        "items": VALID_ITEMS,
        "po_number": "PO-2026-001",
    })
    assert result["success"] is True
    assert result["data"]["status"] == "sent_to_supplier"


@pytest.mark.asyncio
async def test_po_empty_supplier_id_returns_error(agent):
    result = await agent.execute({
        "action": "create",
        "supplier_id": "   ",
        "items": VALID_ITEMS,
    })
    assert result["success"] is False
    assert "supplier_id" in result["error"]


@pytest.mark.asyncio
async def test_po_negative_quantity_returns_error(agent):
    result = await agent.execute({
        "action": "create",
        "supplier_id": "SUPP-001",
        "items": [{"sku": "SKU-001", "quantity": -5, "unit_price": 42.0}],
    })
    assert result["success"] is False
    assert "quantity" in result["error"]


@pytest.mark.asyncio
async def test_po_invalid_payment_terms_returns_error(agent):
    result = await agent.execute({
        "action": "create",
        "supplier_id": "SUPP-001",
        "items": VALID_ITEMS,
        "payment_terms": "never",
    })
    assert result["success"] is False
    assert "payment_terms" in result["error"]
