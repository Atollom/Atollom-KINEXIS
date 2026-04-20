"""Tests for Agent #33 - Follow-up."""

import pytest
from src.agents.crm.agent_33_follow_up import Agent33FollowUp


@pytest.fixture
def agent():
    return Agent33FollowUp()


@pytest.mark.asyncio
async def test_follow_up_7_days_inactive(agent):
    result = await agent.execute({
        "lead_id": "LEAD-001",
        "days_inactive": 5,
        "stage": "interested",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "send_follow_up"
    assert data["message_template"] == "check_in_7d"
    assert data["scheduled_at"] is not None


@pytest.mark.asyncio
async def test_follow_up_14_days_inactive(agent):
    result = await agent.execute({
        "lead_id": "LEAD-002",
        "days_inactive": 10,
        "stage": "quoted",
        "channel": "email",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["message_template"] == "offer_urgency_14d"
    assert "cotización" in data["message_preview"].lower() or "cotz" in data["message_preview"].lower() or "oferta" in data["message_preview"].lower()


@pytest.mark.asyncio
async def test_follow_up_30_days_inactive(agent):
    result = await agent.execute({
        "lead_id": "LEAD-003",
        "days_inactive": 20,
        "stage": "negotiation",
        "channel": "phone",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["message_template"] == "final_attempt_30d"


@pytest.mark.asyncio
async def test_follow_up_by_stage_interested(agent):
    result = await agent.execute({
        "lead_id": "LEAD-004",
        "days_inactive": 3,
        "stage": "interested",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    assert "propuesta" in result["data"]["message_preview"].lower()


@pytest.mark.asyncio
async def test_follow_up_channel_preference(agent):
    result = await agent.execute({
        "lead_id": "LEAD-005",
        "days_inactive": 7,
        "stage": "quoted",
        "channel": "email",
    })
    assert result["success"] is True
    assert result["data"]["channel"] == "email"


@pytest.mark.asyncio
async def test_follow_up_message_has_next_follow_up(agent):
    result = await agent.execute({
        "lead_id": "LEAD-006",
        "days_inactive": 5,
        "stage": "interested",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    assert result["data"]["next_follow_up"] is not None


@pytest.mark.asyncio
async def test_follow_up_no_action_over_30_days(agent):
    result = await agent.execute({
        "lead_id": "LEAD-007",
        "days_inactive": 45,
        "stage": "interested",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["action"] == "no_action"
    assert data["scheduled_at"] is None


@pytest.mark.asyncio
async def test_follow_up_invalid_channel_returns_error(agent):
    result = await agent.execute({
        "lead_id": "LEAD-008",
        "days_inactive": 5,
        "stage": "interested",
        "channel": "fax",
    })
    assert result["success"] is False
    assert "channel" in result["error"].lower() or "Invalid" in result["error"]
