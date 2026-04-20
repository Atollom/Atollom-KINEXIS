"""Tests for Instagram Agent."""

import pytest
from src.agents.meta.agent_ig_instagram import AgentIGInstagram


@pytest.fixture
def agent():
    return AgentIGInstagram()


@pytest.mark.asyncio
async def test_ig_send_message(agent):
    result = await agent.execute({
        "action": "send",
        "instagram_id": "1234567890",
        "message": "Gracias por tu mensaje",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["message_id"].startswith("IGM-")
    assert data["instagram_id"] == "1234567890"
    assert data["status"] == "sent"
    assert data["conversation_id"].startswith("IG-CONV-")


@pytest.mark.asyncio
async def test_ig_reply_to_dm(agent):
    result = await agent.execute({
        "action": "reply",
        "instagram_id": "1234567890",
        "message": "Claro, con gusto te ayudo",
        "conversation_id": "IG-CONV-EXISTING",
    })
    assert result["success"] is True
    assert result["data"]["conversation_id"] == "IG-CONV-EXISTING"


@pytest.mark.asyncio
async def test_ig_send_with_media(agent):
    result = await agent.execute({
        "action": "send",
        "instagram_id": "1234567890",
        "message": "Mira nuestro catálogo",
        "media": {"type": "image", "url": "https://example.com/catalog.jpg"},
    })
    assert result["success"] is True
    assert result["data"]["has_media"] is True


@pytest.mark.asyncio
async def test_ig_get_messages(agent):
    result = await agent.execute({
        "action": "get_messages",
        "conversation_id": "IG-CONV-123",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "get_messages"
    assert "messages" in data


@pytest.mark.asyncio
async def test_ig_invalid_user_empty_id(agent):
    result = await agent.execute({
        "action": "send",
        "instagram_id": "   ",
        "message": "Hola",
    })
    assert result["success"] is False
    assert "instagram_id" in result["error"].lower()


@pytest.mark.asyncio
async def test_ig_rate_limit(agent):
    result = await agent.execute({
        "action": "send",
        "instagram_id": "1234567890",
        "message": "Test",
        "_simulate_rate_limit": True,
    })
    assert result["success"] is False
    assert "rate_limit" in result["error"].lower()


@pytest.mark.asyncio
async def test_ig_webhook_receive(agent):
    result = await agent.execute({
        "action": "receive",
        "instagram_id": "9876543210",
        "message": "¿Tienen disponible el modelo X?",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "receive"
    assert data["webhook_processed"] is True


@pytest.mark.asyncio
async def test_ig_missing_message_and_media(agent):
    result = await agent.execute({
        "action": "send",
        "instagram_id": "1234567890",
    })
    assert result["success"] is False
    assert "message" in result["error"].lower() or "media" in result["error"].lower()
