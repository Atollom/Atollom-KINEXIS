"""Tests for Agent #27 - ML Questions Handler."""

import pytest
from src.agents.ecommerce.agent_27_ml_questions import Agent27MLQuestions


@pytest.fixture
def agent():
    return Agent27MLQuestions()


@pytest.mark.asyncio
async def test_shipping_question_auto_answered(agent):
    result = await agent.execute({
        "question_id": "Q-001",
        "product_id": "MLM12345678",
        "question_text": "¿Hacen envío a Monterrey?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "shipping"
    assert data["auto_answered"] is True
    assert "envío" in data["answer"].lower() or "entrega" in data["answer"].lower()


@pytest.mark.asyncio
async def test_stock_question_auto_answered(agent):
    result = await agent.execute({
        "question_id": "Q-002",
        "product_id": "MLM12345679",
        "question_text": "¿Tienen stock disponible?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "stock"
    assert data["auto_answered"] is True


@pytest.mark.asyncio
async def test_price_question_auto_answered(agent):
    result = await agent.execute({
        "question_id": "Q-003",
        "product_id": "MLM12345680",
        "question_text": "¿Cuánto cuesta el descuento por mayoreo?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "price"
    assert data["auto_answered"] is True


@pytest.mark.asyncio
async def test_unknown_question_escalates(agent):
    result = await agent.execute({
        "question_id": "Q-004",
        "product_id": "MLM12345681",
        "question_text": "¿Puedo recoger en alguna bodega?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "unknown"
    assert data["auto_answered"] is False
    assert "asesor" in data["answer"].lower() or "WhatsApp" in data["answer"]


@pytest.mark.asyncio
async def test_missing_question_id_returns_error(agent):
    result = await agent.execute({
        "product_id": "MLM12345682",
        "question_text": "¿Tienen envío gratis?",
    })
    assert result["success"] is False
    assert "question_id" in result["error"]


@pytest.mark.asyncio
async def test_empty_question_text_returns_error(agent):
    result = await agent.execute({
        "question_id": "Q-006",
        "product_id": "MLM12345683",
        "question_text": "   ",
    })
    assert result["success"] is False
    assert "question_text" in result["error"]


@pytest.mark.asyncio
async def test_invoice_question_auto_answered(agent):
    result = await agent.execute({
        "question_id": "Q-007",
        "product_id": "MLM12345684",
        "question_text": "¿Emiten factura CFDI con RFC?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "invoice"
    assert data["auto_answered"] is True
