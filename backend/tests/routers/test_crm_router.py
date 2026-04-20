"""Tests for CRM Router."""

import pytest
from src.routers.crm_router import CRMRouter


@pytest.fixture
def router():
    return CRMRouter()


@pytest.mark.asyncio
async def test_crm_router_capture_lead(router):
    result = await router.route({
        "intent": "capture_lead",
        "tenant_id": "orthocardio",
        "data": {
            # b2b_collector fields
            "source": "web_form",
            "contact": {
                "name": "Juan Pérez",
                "email": "juan@ferreteria.com",
                "company": "Ferretería Central",
                "position": "Gerente de Compras",
            },
            "context": {"budget": 60000, "urgency": "high"},
            # lead_scorer fields
            "name": "Juan Pérez",
            "company": "Ferretería Central",
            "email": "juan@ferreteria.com",
            "budget": 60000,
        },
    })
    assert result["success"] is True
    assert result["router"] == "CRM Router"
    assert len(result["agents_called"]) == 2
    assert "lead_id" in result["result"] or "score" in result["result"]


@pytest.mark.asyncio
async def test_crm_router_score_lead(router):
    result = await router.route({
        "intent": "score_lead",
        "data": {
            "name": "Ana García",
            "company": "Empresa SA",
            "email": "ana@empresa.com",
            "budget": 25000,
        },
    })
    assert result["success"] is True
    assert "Agent #31" in result["agents_called"][0]
    assert "score" in result["result"]


@pytest.mark.asyncio
async def test_crm_router_generate_quote(router):
    result = await router.route({
        "intent": "generate_quote",
        "data": {
            "customer": {"name": "Ferretería Central", "email": "juan@ferreteria.com"},
            "items": [{"sku": "SKU-001", "description": "Taladro", "quantity": 10, "unit_price": 450.0}],
            "payment_terms": "30_days",
        },
    })
    assert result["success"] is True
    assert "Agent #32" in result["agents_called"][0]
    assert result["result"]["total"] == 5220.0


@pytest.mark.asyncio
async def test_crm_router_follow_up(router):
    result = await router.route({
        "intent": "follow_up",
        "data": {
            "lead_id": "LEAD-001",
            "days_inactive": 7,
            "stage": "quoted",
            "channel": "whatsapp",
        },
    })
    assert result["success"] is True
    assert "Agent #33" in result["agents_called"][0]
    assert result["result"]["action"] == "send_follow_up"


@pytest.mark.asyncio
async def test_crm_router_create_ticket(router):
    result = await router.route({
        "intent": "create_ticket",
        "data": {
            "customer_id": "CUST-001",
            "subject": "Producto defectuoso",
            "message": "El taladro llegó dañado",
            "channel": "whatsapp",
        },
    })
    assert result["success"] is True
    assert "Agent #37" in result["agents_called"][0]
    assert result["result"]["ticket_id"].startswith("TKT-")


@pytest.mark.asyncio
async def test_crm_router_collect_nps(router):
    result = await router.route({
        "intent": "collect_nps",
        "data": {
            "customer_id": "CUST-001",
            "order_id": "ORD-001",
            "score": 9,
            "feedback": "Excelente servicio",
        },
    })
    assert result["success"] is True
    assert "Agent #19" in result["agents_called"][0]
    assert result["result"]["category"] == "promoter"


@pytest.mark.asyncio
async def test_crm_router_multi_agent_sequence(router):
    result = await router.route({
        "intent": "capture_lead",
        "data": {
            "source": "linkedin",
            "contact": {"name": "CEO Test", "email": "ceo@bigcorp.com", "company": "BigCorp"},
            "context": {"budget": 100000, "urgency": "high"},
            "name": "CEO Test",
            "company": "BigCorp",
            "email": "ceo@bigcorp.com",
            "budget": 100000,
        },
    })
    assert result["success"] is True
    # Must call both b2b_collector AND lead_scorer
    assert len(result["agents_called"]) == 2
    assert any("B2B" in a for a in result["agents_called"])
    assert any("Lead Scorer" in a for a in result["agents_called"])


@pytest.mark.asyncio
async def test_crm_router_invalid_intent(router):
    result = await router.route({"intent": "hack_system", "data": {}})
    assert result["success"] is False
    assert "Unknown intent" in result["error"] or "intent" in result["error"].lower()


@pytest.mark.asyncio
async def test_crm_router_validation_missing_data(router):
    result = await router.route({
        "intent": "create_ticket",
        "data": {"customer_id": "CUST-001"},  # missing subject, message, channel
    })
    assert result["success"] is False
    assert "error" in result
