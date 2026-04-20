"""Tests for Agent #25 - Skydrop Shipping."""

import pytest
from src.agents.erp.agent_25_skydrop_shipping import Agent25SkydropShipping

VALID_ADDRESS = {
    "name": "Juan Pérez",
    "street": "Av. Insurgentes 123",
    "city": "Puebla",
    "state": "Puebla",
    "zip": "72000",
    "phone": "2221234567",
}

VALID_PACKAGE = {"weight": 2.5, "length": 30, "width": 20, "height": 15}


@pytest.fixture
def agent():
    return Agent25SkydropShipping()


@pytest.mark.asyncio
async def test_skydrop_create_shipment_success(agent):
    result = await agent.execute({
        "order_id": "ORD-001",
        "carrier": "estafeta",
        "service_level": "standard",
        "package": VALID_PACKAGE,
        "address": VALID_ADDRESS,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["carrier"] == "estafeta"
    assert data["cost"] > 0
    assert "estimated_delivery" in data


@pytest.mark.asyncio
async def test_skydrop_estafeta_cost(agent):
    result = await agent.execute({
        "order_id": "ORD-002",
        "carrier": "estafeta",
        "service_level": "standard",
        "package": {"weight": 1.0, "length": 10, "width": 10, "height": 10},
        "address": VALID_ADDRESS,
    })
    assert result["success"] is True
    # base=65 + 1kg*10 = 75
    assert result["data"]["cost"] == 75.0


@pytest.mark.asyncio
async def test_skydrop_dhl_express_faster(agent):
    std = await agent.execute({
        "order_id": "ORD-003",
        "carrier": "dhl",
        "service_level": "standard",
        "package": VALID_PACKAGE,
        "address": VALID_ADDRESS,
    })
    exp = await agent.execute({
        "order_id": "ORD-004",
        "carrier": "dhl",
        "service_level": "express",
        "package": VALID_PACKAGE,
        "address": VALID_ADDRESS,
    })
    assert std["success"] is True
    assert exp["success"] is True
    assert exp["data"]["estimated_days"] < std["data"]["estimated_days"]
    assert exp["data"]["cost"] > std["data"]["cost"]


@pytest.mark.asyncio
async def test_skydrop_fedex_standard(agent):
    result = await agent.execute({
        "order_id": "ORD-005",
        "carrier": "fedex",
        "service_level": "standard",
        "package": VALID_PACKAGE,
        "address": VALID_ADDRESS,
    })
    assert result["success"] is True
    assert result["data"]["carrier"] == "fedex"


@pytest.mark.asyncio
async def test_skydrop_calculate_cost_by_weight(agent):
    result_light = await agent.execute({
        "order_id": "ORD-006",
        "carrier": "estafeta",
        "service_level": "standard",
        "package": {"weight": 1.0, "length": 10, "width": 10, "height": 10},
        "address": VALID_ADDRESS,
    })
    result_heavy = await agent.execute({
        "order_id": "ORD-007",
        "carrier": "estafeta",
        "service_level": "standard",
        "package": {"weight": 5.0, "length": 30, "width": 20, "height": 15},
        "address": VALID_ADDRESS,
    })
    assert result_heavy["data"]["cost"] > result_light["data"]["cost"]


@pytest.mark.asyncio
async def test_skydrop_invalid_carrier_returns_error(agent):
    result = await agent.execute({
        "order_id": "ORD-008",
        "carrier": "correos_mx",
        "service_level": "standard",
        "package": VALID_PACKAGE,
        "address": VALID_ADDRESS,
    })
    assert result["success"] is False
    assert "carrier" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_skydrop_overweight_package_returns_error(agent):
    result = await agent.execute({
        "order_id": "ORD-009",
        "carrier": "estafeta",
        "service_level": "standard",
        "package": {"weight": 80.0, "length": 100, "width": 100, "height": 100},
        "address": VALID_ADDRESS,
    })
    assert result["success"] is False
    assert "weight" in result["error"].lower() or "max" in result["error"].lower()


@pytest.mark.asyncio
async def test_skydrop_missing_address_field_returns_error(agent):
    bad_address = {"name": "Juan", "street": "Calle 1"}
    result = await agent.execute({
        "order_id": "ORD-010",
        "carrier": "fedex",
        "service_level": "express",
        "package": VALID_PACKAGE,
        "address": bad_address,
    })
    assert result["success"] is False
    assert "address" in result["error"].lower()
