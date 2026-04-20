"""
Tests para Agent #31 — Lead Scorer
"""

import pytest
from src.agents.crm.agent_31_lead_scorer import lead_scorer


@pytest.mark.asyncio
async def test_high_value_b2b_lead_scores_high():
    result = await lead_scorer.execute({
        "name": "Juan Pérez",
        "company": "Ferretería Central SA",
        "email": "juan@ferreteria.com",
        "source": "whatsapp",
        "budget": 80_000,
        "has_purchase_history": True,
    })
    assert result["success"] is True
    assert result["data"]["score"] >= 70
    assert result["data"]["priority"] == "high"


@pytest.mark.asyncio
async def test_no_company_no_budget_scores_low():
    result = await lead_scorer.execute({
        "name": "Ana López",
        "email": "ana@gmail.com",
        "source": "instagram_organic",
    })
    assert result["success"] is True
    assert result["data"]["priority"] == "low"


@pytest.mark.asyncio
async def test_medium_budget_scores_medium():
    result = await lead_scorer.execute({
        "name": "Pedro García",
        "email": "pedro@empresa.mx",
        "budget": 15_000,
        "source": "referido",
    })
    assert result["success"] is True
    score = result["data"]["score"]
    assert 40 <= score < 70


@pytest.mark.asyncio
async def test_score_capped_at_100():
    result = await lead_scorer.execute({
        "name": "Mega Corp",
        "company": "Mega Corp SA de CV",
        "email": "compras@megacorp.com.mx",
        "source": "whatsapp",
        "budget": 500_000,
        "has_purchase_history": True,
    })
    assert result["success"] is True
    assert result["data"]["score"] <= 100


@pytest.mark.asyncio
async def test_missing_name_returns_error():
    result = await lead_scorer.execute({"email": "x@x.com"})
    assert result["success"] is False


@pytest.mark.asyncio
async def test_breakdown_present():
    result = await lead_scorer.execute({
        "name": "Test Lead",
        "company": "Test Co",
        "budget": 20_000,
    })
    assert "breakdown" in result["data"]
    assert isinstance(result["data"]["breakdown"], dict)
