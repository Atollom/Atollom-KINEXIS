"""Tests for Agent #19 - NPS Collector."""

import pytest
from src.agents.crm.agent_19_nps_collector import Agent19NPSCollector


@pytest.fixture
def agent():
    return Agent19NPSCollector()


@pytest.mark.asyncio
async def test_nps_collector_promoter(agent):
    result = await agent.execute({
        "customer_id": "CUST-001",
        "order_id": "ORD-001",
        "score": 9,
        "feedback": "Excelente servicio, muy rápido",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "promoter"
    assert data["sentiment"] == "positive"
    assert data["action_required"] is None


@pytest.mark.asyncio
async def test_nps_collector_passive(agent):
    result = await agent.execute({
        "customer_id": "CUST-002",
        "order_id": "ORD-002",
        "score": 7,
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "passive"
    assert data["sentiment"] == "neutral"
    assert data["action_required"] is None


@pytest.mark.asyncio
async def test_nps_collector_detractor(agent):
    result = await agent.execute({
        "customer_id": "CUST-003",
        "order_id": "ORD-003",
        "score": 4,
        "feedback": "El producto llegó dañado y tardó mucho",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "detractor"
    assert data["sentiment"] == "negative"
    assert data["action_required"] == "follow_up_detractor"


@pytest.mark.asyncio
async def test_nps_collector_sentiment_positive_feedback(agent):
    result = await agent.execute({
        "customer_id": "CUST-004",
        "order_id": "ORD-004",
        "score": 8,
        "feedback": "Excelente atención, recomiendo ampliamente",
    })
    assert result["success"] is True
    assert result["data"]["sentiment"] == "positive"


@pytest.mark.asyncio
async def test_nps_collector_response_time(agent):
    result = await agent.execute({
        "customer_id": "CUST-005",
        "order_id": "ORD-005",
        "score": 9,
        "survey_sent_at": "2026-04-14T10:00:00Z",
        "responded_at":   "2026-04-21T10:00:00Z",
    })
    assert result["success"] is True
    assert result["data"]["response_time_days"] == 7


@pytest.mark.asyncio
async def test_nps_collector_follow_up_required_for_detractor(agent):
    result = await agent.execute({
        "customer_id": "CUST-006",
        "order_id": "ORD-006",
        "score": 3,
    })
    assert result["success"] is True
    assert result["data"]["action_required"] == "follow_up_detractor"


@pytest.mark.asyncio
async def test_nps_collector_invalid_score_returns_error(agent):
    result = await agent.execute({
        "customer_id": "CUST-007",
        "order_id": "ORD-007",
        "score": 11,
    })
    assert result["success"] is False
    assert "score" in result["error"].lower()


@pytest.mark.asyncio
async def test_nps_collector_boundary_scores(agent):
    r_zero = await agent.execute({"customer_id": "C", "order_id": "O", "score": 0})
    r_ten  = await agent.execute({"customer_id": "C", "order_id": "O", "score": 10})
    assert r_zero["success"] is True
    assert r_zero["data"]["category"] == "detractor"
    assert r_ten["success"] is True
    assert r_ten["data"]["category"] == "promoter"
