"""Tests for Agent #4 - B2B Collector."""

import pytest
from src.agents.crm.agent_04_b2b_collector import Agent04B2BCollector

HIGH_VALUE_CONTACT = {
    "name": "Juan Pérez",
    "email": "juan@ferreteria.com",
    "phone": "2221234567",
    "company": "Ferretería Central",
    "position": "Gerente de Compras",
}

HIGH_VALUE_CONTEXT = {
    "message": "Busco proveedor de herramientas eléctricas",
    "budget": 60000,
    "urgency": "high",
}


@pytest.fixture
def agent():
    return Agent04B2BCollector()


@pytest.mark.asyncio
async def test_b2b_collector_qualify_high_value(agent):
    result = await agent.execute({
        "source": "web_form",
        "contact": HIGH_VALUE_CONTACT,
        "context": HIGH_VALUE_CONTEXT,
    })
    assert result["success"] is True
    qual = result["data"]["qualification"]
    assert qual["priority"] == "high"
    assert qual["quality_score"] >= 70


@pytest.mark.asyncio
async def test_b2b_collector_qualify_medium(agent):
    result = await agent.execute({
        "source": "web_form",
        "contact": {
            "name": "Ana García",
            "email": "ana@empresa.com",
            "company": "Empresa Mediana",
            "position": "Administradora",
        },
        "context": {"budget": 8000, "urgency": "low"},
    })
    assert result["success"] is True
    qual = result["data"]["qualification"]
    assert qual["priority"] == "medium"
    assert 40 <= qual["quality_score"] < 70


@pytest.mark.asyncio
async def test_b2b_collector_qualify_low(agent):
    result = await agent.execute({
        "source": "web_form",
        "contact": {
            "name": "Pedro López",
            "email": "pedro@gmail.com",
        },
        "context": {"budget": 500, "urgency": "low"},
    })
    assert result["success"] is True
    qual = result["data"]["qualification"]
    assert qual["priority"] == "low"
    assert qual["quality_score"] < 40


@pytest.mark.asyncio
async def test_b2b_collector_b2c_detection(agent):
    result = await agent.execute({
        "source": "whatsapp",
        "contact": {
            "name": "Carlos Mora",
            "email": "carlos@hotmail.com",
        },
    })
    assert result["success"] is True
    qual = result["data"]["qualification"]
    assert qual["is_b2b"] is False


@pytest.mark.asyncio
async def test_b2b_collector_missing_contact_name(agent):
    result = await agent.execute({
        "source": "web_form",
        "contact": {"email": "test@empresa.com"},
    })
    assert result["success"] is False
    assert "name" in result["error"].lower()


@pytest.mark.asyncio
async def test_b2b_collector_budget_scoring(agent):
    low_budget = await agent.execute({
        "source": "web_form",
        "contact": {"name": "Test", "company": "Empresa", "email": "test@empresa.com"},
        "context": {"budget": 1000, "urgency": "low"},
    })
    high_budget = await agent.execute({
        "source": "web_form",
        "contact": {"name": "Test", "company": "Empresa", "email": "test@empresa.com"},
        "context": {"budget": 100000, "urgency": "low"},
    })
    assert high_budget["data"]["qualification"]["quality_score"] > low_budget["data"]["qualification"]["quality_score"]


@pytest.mark.asyncio
async def test_b2b_collector_decision_maker_bonus(agent):
    non_dm = await agent.execute({
        "source": "web_form",
        "contact": {
            "name": "Ana", "company": "Empresa SA",
            "email": "ana@empresa.com", "position": "Asistente",
        },
        "context": {"budget": 10000, "urgency": "low"},
    })
    dm = await agent.execute({
        "source": "web_form",
        "contact": {
            "name": "Ana", "company": "Empresa SA",
            "email": "ana@empresa.com", "position": "Directora de Compras",
        },
        "context": {"budget": 10000, "urgency": "low"},
    })
    assert dm["data"]["qualification"]["quality_score"] > non_dm["data"]["qualification"]["quality_score"]


@pytest.mark.asyncio
async def test_b2b_collector_referral_source(agent):
    direct = await agent.execute({
        "source": "web_form",
        "contact": {"name": "Test", "company": "Empresa", "email": "t@empresa.com"},
    })
    referral = await agent.execute({
        "source": "referral",
        "contact": {"name": "Test", "company": "Empresa", "email": "t@empresa.com"},
    })
    assert referral["data"]["qualification"]["quality_score"] > direct["data"]["qualification"]["quality_score"]
    assert "referral" in referral["data"]["qualification"]["reasoning"]
