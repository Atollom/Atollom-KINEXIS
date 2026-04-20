"""
Tests para Agent #0 — Guardian Router
"""

import pytest
from src.agents.core.agent_00_guardian import guardian


@pytest.mark.asyncio
async def test_guardian_classifies_ecommerce():
    result = await guardian.execute({
        "query": "¿Cuánto vendí hoy en Mercado Libre?",
        "tenant_id": "test",
        "user_id": "test-user",
    })
    assert result["success"] is True
    assert result["router"] == "ecommerce"
    assert result["confidence"] > 0.5


@pytest.mark.asyncio
async def test_guardian_classifies_crm():
    result = await guardian.execute({
        "query": "Muéstrame los leads de hoy en el pipeline",
        "tenant_id": "test",
        "user_id": "test-user",
    })
    assert result["success"] is True
    assert result["router"] == "crm"


@pytest.mark.asyncio
async def test_guardian_classifies_erp():
    result = await guardian.execute({
        "query": "Genera la factura CFDI del pedido 456",
        "tenant_id": "test",
        "user_id": "test-user",
    })
    assert result["success"] is True
    assert result["router"] == "erp"


@pytest.mark.asyncio
async def test_guardian_classifies_meta():
    result = await guardian.execute({
        "query": "Crea una campaña de anuncios en Facebook Ads con boost de alcance",
        "tenant_id": "test",
        "user_id": "test-user",
    })
    assert result["success"] is True
    assert result["router"] == "meta"


@pytest.mark.asyncio
async def test_guardian_missing_query_returns_error():
    result = await guardian.execute({"tenant_id": "test"})
    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_guardian_response_has_required_fields():
    result = await guardian.execute({
        "query": "Revisa el inventario",
        "tenant_id": "test",
        "user_id": "test-user",
    })
    assert "success" in result
    assert "agent" in result
    assert "timestamp" in result
    assert "router" in result
    assert "confidence" in result
    assert "scores" in result
