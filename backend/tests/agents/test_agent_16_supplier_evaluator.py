"""Tests for Agent #16 - Supplier Evaluator."""

import pytest
from src.agents.erp.agent_16_supplier_evaluator import Agent16SupplierEvaluator

SUPPLIER_A = {
    "id": "SUPP-001",
    "name": "Proveedor A",
    "price_per_unit": 45.0,
    "delivery_days": 5,
    "rating": 4.8,
}
SUPPLIER_B = {
    "id": "SUPP-002",
    "name": "Proveedor B",
    "price_per_unit": 42.0,
    "delivery_days": 15,
    "rating": 4.2,
}


@pytest.fixture
def agent():
    return Agent16SupplierEvaluator()


@pytest.mark.asyncio
async def test_supplier_evaluate_by_cost(agent):
    # Use suppliers with large price gap so cost priority clearly wins
    cheap = {"id": "SUPP-C1", "name": "Budget", "price_per_unit": 20.0, "delivery_days": 8, "rating": 4.0}
    premium = {"id": "SUPP-C2", "name": "Premium", "price_per_unit": 80.0, "delivery_days": 7, "rating": 4.5}
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [cheap, premium],
        "priority": "cost",
    })
    assert result["success"] is True
    rec = result["data"]["recommendation"]
    assert rec["supplier_id"] == "SUPP-C1"


@pytest.mark.asyncio
async def test_supplier_evaluate_by_speed(agent):
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [SUPPLIER_A, SUPPLIER_B],
        "priority": "speed",
    })
    assert result["success"] is True
    # Speed priority → fastest (SUPP-001 at 5 days) should win
    rec = result["data"]["recommendation"]
    assert rec["supplier_id"] == "SUPP-001"


@pytest.mark.asyncio
async def test_supplier_evaluate_by_quality(agent):
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [SUPPLIER_A, SUPPLIER_B],
        "priority": "quality",
    })
    assert result["success"] is True
    # Quality priority → highest rating (SUPP-001 at 4.8) should win
    rec = result["data"]["recommendation"]
    assert rec["supplier_id"] == "SUPP-001"


@pytest.mark.asyncio
async def test_supplier_recommend_best(agent):
    result = await agent.execute({
        "action": "recommend",
        "suppliers": [SUPPLIER_A, SUPPLIER_B],
        "priority": "quality",
    })
    assert result["success"] is True
    data = result["data"]
    assert "recommendation" in data
    assert data["recommendation"]["score"] > 0


@pytest.mark.asyncio
async def test_supplier_compare_multiple(agent):
    suppliers = [SUPPLIER_A, SUPPLIER_B, {
        "id": "SUPP-003",
        "name": "Proveedor C",
        "price_per_unit": 50.0,
        "delivery_days": 3,
        "rating": 4.5,
    }]
    result = await agent.execute({
        "action": "compare",
        "suppliers": suppliers,
        "priority": "speed",
    })
    assert result["success"] is True
    comparison = result["data"]["comparison"]
    assert len(comparison) == 3
    # Results sorted by score descending
    scores = [c["score"] for c in comparison]
    assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_supplier_missing_required_field(agent):
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [{"id": "SUPP-001", "price_per_unit": 45.0}],  # missing delivery_days, rating
        "priority": "cost",
    })
    assert result["success"] is False
    assert "missing" in result["error"].lower()


@pytest.mark.asyncio
async def test_supplier_no_suppliers_returns_error(agent):
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [],
        "priority": "cost",
    })
    assert result["success"] is False
    assert "suppliers" in result["error"]


@pytest.mark.asyncio
async def test_supplier_invalid_priority_returns_error(agent):
    result = await agent.execute({
        "action": "evaluate",
        "suppliers": [SUPPLIER_A],
        "priority": "luck",
    })
    assert result["success"] is False
    assert "priority" in result["error"].lower() or "Invalid" in result["error"]
