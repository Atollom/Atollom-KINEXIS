"""Tests for Agent #37 - Support Tickets."""

import pytest
from src.agents.crm.agent_37_support_tickets import Agent37SupportTickets


@pytest.fixture
def agent():
    return Agent37SupportTickets()


@pytest.mark.asyncio
async def test_support_ticket_create(agent):
    result = await agent.execute({
        "customer_id": "CUST-001",
        "subject": "Consulta sobre mi pedido",
        "message": "Quisiera saber el estado de mi pedido",
        "channel": "email",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["ticket_id"].startswith("TKT-")
    assert data["customer_id"] == "CUST-001"
    assert "created_at" in data


@pytest.mark.asyncio
async def test_support_ticket_classify_defective(agent):
    result = await agent.execute({
        "customer_id": "CUST-002",
        "subject": "Producto con falla",
        "message": "El taladro llegó dañado, no funciona correctamente",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "producto_defectuoso"
    assert data["priority"] == "high"


@pytest.mark.asyncio
async def test_support_ticket_classify_shipping(agent):
    result = await agent.execute({
        "customer_id": "CUST-003",
        "subject": "Pedido con retraso",
        "message": "Mi pedido tiene un retraso, el tracking no actualiza",
        "channel": "chat",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "envio_tardio"
    assert data["priority"] == "medium"


@pytest.mark.asyncio
async def test_support_ticket_classify_general(agent):
    result = await agent.execute({
        "customer_id": "CUST-004",
        "subject": "Pregunta general",
        "message": "¿Tienen catálogo disponible?",
        "channel": "email",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["category"] == "general"
    assert data["priority"] == "low"


@pytest.mark.asyncio
async def test_support_ticket_priority_high_escalates(agent):
    result = await agent.execute({
        "customer_id": "CUST-005",
        "subject": "Batería dañada",
        "message": "La batería del producto está rota al recibirlo",
        "channel": "whatsapp",
    })
    assert result["success"] is True
    data = result["data"]
    assert data["priority"] == "high"
    assert data["auto_response"]["escalate_to"] == "support_team"


@pytest.mark.asyncio
async def test_support_ticket_priority_medium_queued(agent):
    result = await agent.execute({
        "customer_id": "CUST-006",
        "subject": "Envío tardio",
        "message": "Mi pedido tardó más de lo esperado",
        "channel": "email",
    })
    assert result["success"] is True
    assert result["data"]["auto_response"]["escalate_to"] == "queue"


@pytest.mark.asyncio
async def test_support_ticket_auto_response_sent(agent):
    result = await agent.execute({
        "customer_id": "CUST-007",
        "subject": "Producto defectuoso",
        "message": "Recibí un producto con defecto",
        "channel": "chat",
    })
    assert result["success"] is True
    auto = result["data"]["auto_response"]
    assert auto["sent"] is True
    assert len(auto["message"]) > 10


@pytest.mark.asyncio
async def test_support_ticket_sla_calculation(agent):
    result = await agent.execute({
        "customer_id": "CUST-008",
        "subject": "Falla de producto",
        "message": "El producto llegó roto",
        "channel": "email",
    })
    assert result["success"] is True
    sla = result["data"]["sla"]
    assert "response_due" in sla
    assert "resolution_due" in sla
    # Resolution should be after response
    assert sla["resolution_due"] > sla["response_due"]


@pytest.mark.asyncio
async def test_support_ticket_missing_channel_returns_error(agent):
    result = await agent.execute({
        "customer_id": "CUST-009",
        "subject": "Test",
        "message": "Test message",
    })
    assert result["success"] is False
    assert "channel" in result["error"].lower() or "Missing" in result["error"]
