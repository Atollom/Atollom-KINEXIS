"""Tests for WhatsApp Agent."""

import pytest
from src.agents.meta.agent_wa_whatsapp import AgentWAWhatsApp


@pytest.fixture
def agent():
    return AgentWAWhatsApp()


@pytest.mark.asyncio
async def test_wa_send_message(agent):
    result = await agent.execute({
        "action": "send",
        "phone": "+522221234567",
        "message": "Hola, gracias por tu interés",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["message_id"].startswith("WAMID.")
    assert data["phone"] == "+522221234567"
    assert data["status"] == "sent"
    assert data["conversation_id"].startswith("WA-CONV-")


@pytest.mark.asyncio
async def test_wa_reply_to_conversation(agent):
    result = await agent.execute({
        "action": "reply",
        "phone": "+522221234567",
        "message": "¿En qué más te puedo ayudar?",
        "conversation_id": "WA-CONV-EXISTING",
    })
    assert result["success"] is True
    assert result["data"]["conversation_id"] == "WA-CONV-EXISTING"


@pytest.mark.asyncio
async def test_wa_send_with_template(agent):
    result = await agent.execute({
        "action": "send",
        "phone": "+522221234567",
        "message": "",
        "template": "order_confirmation",
    })
    assert result["success"] is True
    assert result["data"]["has_template"] is True


@pytest.mark.asyncio
async def test_wa_send_with_media(agent):
    result = await agent.execute({
        "action": "send",
        "phone": "+522221234567",
        "message": "Mira este producto",
        "media": {"type": "image", "url": "https://example.com/img.jpg"},
    })
    assert result["success"] is True
    assert result["data"]["has_media"] is True


@pytest.mark.asyncio
async def test_wa_get_conversations(agent):
    result = await agent.execute({"action": "get_conversations"})
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "get_conversations"
    assert "conversations" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_wa_invalid_phone(agent):
    result = await agent.execute({
        "action": "send",
        "phone": "2221234567",  # missing + prefix
        "message": "Hola",
    })
    assert result["success"] is False
    assert "phone" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_wa_rate_limit(agent):
    result = await agent.execute({
        "action": "send",
        "phone": "+522221234567",
        "message": "Test",
        "_simulate_rate_limit": True,
    })
    assert result["success"] is False
    assert "rate_limit" in result["error"].lower()


@pytest.mark.asyncio
async def test_wa_webhook_receive(agent):
    result = await agent.execute({
        "action": "receive",
        "phone": "+522221234567",
        "message": "Quiero hacer un pedido",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "receive"
    assert data["webhook_processed"] is True
