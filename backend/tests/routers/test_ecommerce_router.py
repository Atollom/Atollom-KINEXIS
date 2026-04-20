"""Tests for E-commerce Router."""

import pytest
from src.routers.ecommerce_router import EcommerceRouter

SHIPPING_ADDRESS = {"name": "Cliente", "address": "Av. Principal 1", "city": "Puebla", "zip": "72000"}


@pytest.fixture
def router():
    return EcommerceRouter()


@pytest.mark.asyncio
async def test_ecommerce_router_fulfill_ml(router):
    result = await router.route({
        "intent": "fulfill_order",
        "channel": "mercadolibre",
        "tenant_id": "orthocardio",
        "data": {
            "order_id": "ML-ORD-001",
            "items": [{"sku": "SKU-001", "qty": 2}],
            "shipping_address": SHIPPING_ADDRESS,
        },
    })
    assert result["success"] is True
    assert result["router"] == "E-commerce Router"
    assert "Agent #1" in result["agents_called"][0]
    assert "execution_time_ms" in result


@pytest.mark.asyncio
async def test_ecommerce_router_fulfill_amazon(router):
    result = await router.route({
        "intent": "fulfill_order",
        "channel": "amazon",
        "tenant_id": "orthocardio",
        "data": {
            "action": "sync_inventory",
            "sku": "SKU-001",
            "quantity": 50,
            "warehouse": "amazon_fba_mx",
        },
    })
    assert result["success"] is True
    assert "Agent #2" in result["agents_called"][0]


@pytest.mark.asyncio
async def test_ecommerce_router_fulfill_shopify(router):
    result = await router.route({
        "intent": "fulfill_order",
        "channel": "shopify",
        "tenant_id": "orthocardio",
        "data": {
            "order_id": "SH-ORD-001",
            "items": [{"sku": "SKU-001", "quantity": 1}],
            "shipping_address": SHIPPING_ADDRESS,
        },
    })
    assert result["success"] is True
    assert "Agent #3" in result["agents_called"][0]


@pytest.mark.asyncio
async def test_ecommerce_router_update_price(router):
    result = await router.route({
        "intent": "update_price",
        "tenant_id": "orthocardio",
        "data": {
            "sku": "SKU-001",
            "base_price": 299.0,
            "channels": ["ml", "shopify"],
            "strategy": "competitive",
        },
    })
    assert result["success"] is True
    assert "Agent #6" in result["agents_called"][0]
    assert result["result"]["channels_updated"] == 2


@pytest.mark.asyncio
async def test_ecommerce_router_handle_return(router):
    result = await router.route({
        "intent": "handle_return",
        "tenant_id": "orthocardio",
        "data": {
            "order_id": "ML-ORD-002",
            "channel": "mercadolibre",
            "reason": "producto_defectuoso",
            "items": [{"sku": "SKU-001", "quantity": 1, "unit_price": 299.0}],
        },
    })
    assert result["success"] is True
    assert "Agent #14" in result["agents_called"][0]
    assert result["result"]["status"] == "authorized"


@pytest.mark.asyncio
async def test_ecommerce_router_answer_question(router):
    result = await router.route({
        "intent": "answer_question",
        "tenant_id": "orthocardio",
        "data": {
            "question_id": "Q-001",
            "product_id": "MLM12345678",
            "question_text": "¿Cuánto cuesta el envío?",
        },
    })
    assert result["success"] is True
    assert "Agent #27" in result["agents_called"][0]
    assert result["result"]["category"] == "shipping"


@pytest.mark.asyncio
async def test_ecommerce_router_invalid_intent(router):
    result = await router.route({
        "intent": "delete_everything",
        "data": {},
    })
    assert result["success"] is False
    assert "intent" in result["error"].lower() or "Unknown" in result["error"]


@pytest.mark.asyncio
async def test_ecommerce_router_invalid_channel(router):
    result = await router.route({
        "intent": "fulfill_order",
        "channel": "walmart",
        "data": {"order_id": "ORD-001", "items": [], "shipping_address": {}},
    })
    assert result["success"] is False
    assert "channel" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_ecommerce_router_validation_pass(router):
    result = await router.route({
        "intent": "answer_question",
        "data": {
            "question_id": "Q-002",
            "product_id": "MLM00001",
            "question_text": "¿Tienen garantía?",
        },
    })
    assert result["success"] is True
    assert result["result"]["auto_answered"] is True


@pytest.mark.asyncio
async def test_ecommerce_router_validation_fail_missing_field(router):
    result = await router.route({
        "intent": "handle_return",
        "data": {
            "order_id": "ORD-001",
            # missing channel, reason, items
        },
    })
    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_ecommerce_router_execution_time_present(router):
    result = await router.route({
        "intent": "answer_question",
        "data": {
            "question_id": "Q-003",
            "product_id": "MLM99999",
            "question_text": "¿Cuál es el precio?",
        },
    })
    assert "execution_time_ms" in result
    assert result["execution_time_ms"] >= 0
