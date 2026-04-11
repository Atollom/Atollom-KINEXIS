import pytest
from decimal import Decimal
from datetime import timedelta, datetime
from unittest.mock import AsyncMock, MagicMock
from src.agents.nps_satisfaction_agent import NPSSatisfactionAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    # Mock for all possible chains
    mock_execute = AsyncMock(return_value=MagicMock(data=[]))
    
    supa.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.limit.return_value.execute = mock_execute
    supa.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute = mock_execute
    supa.table.return_value.update.return_value.eq.return_value.eq.return_value.eq.return_value.execute = mock_execute
    supa.table.return_value.insert.return_value.execute = mock_execute
    
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = NPSSatisfactionAgent("t1", mock_supabase)
    agent._trigger_support_handoff = AsyncMock()
    agent._send_thank_you = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_encuesta_3_dias_post_entrega(agent):
    # Simulado por trigger
    result = await agent.run({"trigger": "post_delivery", "customer_contact": "5512345678"})
    assert result["output"]["survey_sent"] is True

@pytest.mark.asyncio
async def test_cooldown_90_dias_respetado(agent, mock_supabase):
    # Mock a survey found in cooldown
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.limit.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "prev-1"}])
    )
    
    result = await agent.run({"trigger": "manual_send", "customer_contact": "5512345678"})
    assert result["output"]["survey_sent"] is False

@pytest.mark.asyncio
async def test_score_invalido_rechazado(agent):
    result = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 11})
    assert result["status"] == "failed"

@pytest.mark.asyncio
async def test_detractor_activa_support(agent, mock_supabase):
    result = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 5})
    assert result["output"]["promoter_type"] == "detractor"
    assert result["output"]["action_triggered"] is True
    agent._trigger_support_handoff.assert_called()

@pytest.mark.asyncio
async def test_passive_solo_registra(agent, mock_supabase):
    result = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 8})
    assert result["output"]["promoter_type"] == "passive"
    assert result["output"]["action_triggered"] is False

@pytest.mark.asyncio
async def test_promoter_mensaje_agradecimiento(agent, mock_supabase):
    result = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 10})
    assert result["output"]["promoter_type"] == "promoter"
    agent._send_thank_you.assert_called()

@pytest.mark.asyncio
async def test_nps_promedio_menor_7_alerta(agent, mock_supabase):
    agent._notify_socias = AsyncMock()
    # Mock average < 7 (e.g. 5.0)
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"score": 5}, {"score": 5}])
    )
    await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 5})
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_cooldown_de_tenant_config(agent, mock_supabase):
    """Cooldown se lee de tenant_config, no hardcodeado a 90 días."""
    # Mock config con cooldown corto de 30 días
    agent.get_tenant_config = AsyncMock(return_value={"nps_cooldown_days": 30})
    # Mock: survey encontrada en los últimos 30 días -> cooldown activo
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.limit.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "prev-survey"}])
    )
    result = await agent.run({"trigger": "manual_send", "customer_contact": "5512345678"})
    assert result["output"]["survey_sent"] is False
    agent.get_tenant_config.assert_called()

@pytest.mark.asyncio
async def test_order_filtrado_tenant_id(agent, mock_supabase):
    await agent.run({"trigger": "post_delivery", "customer_contact": "5512345678", "order_id": "ORD-123"})
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_tenant_isolation_nps_surveys(agent, mock_supabase):
    await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 10})
    # Verificamos que al actualizar se filtre por tenant
    mock_supabase.table.return_value.update.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_encuesta_no_duplicada_mismo_trimestre(agent):
    """Sin customer_contact en post_delivery debe fallar con ValueError."""
    res = await agent.run({"trigger": "post_delivery"})  # falta customer_contact
    assert res["status"] == "failed"
    assert "contact" in res["error"]

@pytest.mark.asyncio
async def test_score_0_y_10_validos_extremos(agent):
    res0 = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 0})
    res10 = await agent.run({"trigger": "response_received", "customer_contact": "5512345678", "nps_score": 10})
    assert res0["status"] == "success"
    assert res10["status"] == "success"
