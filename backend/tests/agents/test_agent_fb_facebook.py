"""Tests for Facebook Agent."""

import pytest
from src.agents.meta.agent_fb_facebook import AgentFBFacebook


@pytest.fixture
def agent():
    return AgentFBFacebook()


@pytest.mark.asyncio
async def test_fb_send_message(agent):
    result = await agent.execute({
        "action": "send",
        "facebook_id": "PSID-987654321",
        "message": "Hola desde Messenger",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["message_id"].startswith("FBM-")
    assert data["facebook_id"] == "PSID-987654321"
    assert data["status"] == "sent"
    assert data["conversation_id"].startswith("FB-CONV-")


@pytest.mark.asyncio
async def test_fb_reply_to_conversation(agent):
    result = await agent.execute({
        "action": "reply",
        "facebook_id": "PSID-987654321",
        "message": "¿Puedo ayudarte en algo más?",
        "conversation_id": "FB-CONV-EXISTING",
    })
    assert result["success"] is True
    assert result["data"]["conversation_id"] == "FB-CONV-EXISTING"


@pytest.mark.asyncio
async def test_fb_send_quick_replies(agent):
    result = await agent.execute({
        "action": "send",
        "facebook_id": "PSID-987654321",
        "message": "¿Te interesa saber más?",
        "quick_replies": [
            {"title": "Sí, ver catálogo", "payload": "VIEW_CATALOG"},
            {"title": "No, gracias", "payload": "NO_THANKS"},
        ],
    })
    assert result["success"] is True
    data = result["data"]
    assert data["has_quick_replies"] is True
    assert data["quick_replies_count"] == 2


@pytest.mark.asyncio
async def test_fb_get_conversations(agent):
    result = await agent.execute({"action": "get_conversations"})
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "get_conversations"
    assert "conversations" in data


@pytest.mark.asyncio
async def test_fb_invalid_psid_empty(agent):
    result = await agent.execute({
        "action": "send",
        "facebook_id": "",
        "message": "Hola",
    })
    assert result["success"] is False
    assert "facebook_id" in result["error"].lower()


@pytest.mark.asyncio
async def test_fb_rate_limit(agent):
    result = await agent.execute({
        "action": "send",
        "facebook_id": "PSID-123",
        "message": "Test",
        "_simulate_rate_limit": True,
    })
    assert result["success"] is False
    assert "rate_limit" in result["error"].lower()


@pytest.mark.asyncio
async def test_fb_webhook_receive(agent):
    result = await agent.execute({
        "action": "receive",
        "facebook_id": "PSID-987654321",
        "message": "Quiero cotizar 50 unidades",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "receive"
    assert data["webhook_processed"] is True


@pytest.mark.asyncio
async def test_fb_invalid_quick_reply_format(agent):
    result = await agent.execute({
        "action": "send",
        "facebook_id": "PSID-123",
        "message": "Test",
        "quick_replies": [{"title": "Solo título"}],  # missing payload
    })
    assert result["success"] is False
    assert "payload" in result["error"].lower() or "quick_replies" in result["error"].lower()
