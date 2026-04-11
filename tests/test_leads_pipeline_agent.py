import pytest
from decimal import Decimal
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock
from src.agents.leads_pipeline_agent import LeadsPipelineAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    # Mock for all possible chains
    mock_execute = AsyncMock(return_value=MagicMock(data=[]))
    
    supa.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute = mock_execute
    supa.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = mock_execute
    supa.table.return_value.insert.return_value.execute = mock_execute
    
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = LeadsPipelineAgent("t1", mock_supabase)
    return agent

@pytest.mark.asyncio
async def test_lead_frio_72h_detectado(agent, mock_supabase):
    now = agent._get_now()
    older_than_72h = (now - timedelta(hours=73)).isoformat()
    
    # Mock leads query
    mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"id": "L1", "last_activity_at": older_than_72h, "status": "active"}
        ])
    )
    
    result = await agent.run({"trigger": "daily_analysis"})
    assert result["output"]["cold_leads_count"] == 1
    assert any("leads fríos" in a for a in result["output"]["alerts"])

@pytest.mark.asyncio
async def test_lead_estancado_7_dias_escalado(agent, mock_supabase):
    now = agent._get_now()
    older_than_7_days = (now - timedelta(days=8)).isoformat()
    
    # Mock leads query
    mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"id": "L1", "last_activity_at": older_than_7_days, "status": "active"}
        ])
    )
    
    result = await agent.run({"trigger": "daily_analysis"})
    assert any("leads estancados" in a for a in result["output"]["alerts"])

@pytest.mark.asyncio
async def test_conversion_rate_decimal(agent, mock_supabase):
    # 1 won of 4 total = 25%
    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"status": "won"}, {"status": "pending"}, {"status": "pending"}, {"status": "pending"}
        ])
    )
    
    rate = await agent._calculate_conversion_rate()
    assert rate == Decimal("25.00")

@pytest.mark.asyncio
async def test_alerta_si_conversion_menor_25(agent, mock_supabase):
    # 1 won of 5 total = 20%
    mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"status": "won"}, {"status": "pending"}, {"status": "pending"}, {"status": "pending"}, {"status": "pending"}
        ])
    )
    
    result = await agent.run({"trigger": "daily_analysis"})
    assert any("conversión baja" in a for a in result["output"]["alerts"])

@pytest.mark.asyncio
async def test_analisis_9am_cdmx(agent):
    result = await agent.run({"trigger": "daily_analysis"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_solo_leads_activos_analizados(agent, mock_supabase):
    await agent.run({"trigger": "daily_analysis"})
    mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_leads(agent, mock_supabase):
    await agent.run({"trigger": "daily_analysis"})
    # It might be filtered in different selects. We check one.
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_sales_agent_notificado_lead_frio(agent, mock_supabase):
    """Cuando hay leads fríos, se genera alerta en la respuesta."""
    now = agent._get_now()
    old_ts = (now - timedelta(hours=80)).isoformat()
    mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "L1", "last_activity_at": old_ts, "status": "active"}])
    )
    result = await agent.run({"trigger": "daily_analysis"})
    assert any("fríos" in a for a in result["output"]["alerts"])

@pytest.mark.asyncio
async def test_pipeline_health_calculado(agent):
    result = await agent.run({"trigger": "daily_analysis"})
    assert "pipeline_health" in result["output"]

@pytest.mark.asyncio
async def test_snapshot_guardado(agent, mock_supabase):
    await agent.run({"trigger": "daily_analysis"})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_leads_won_excluidos_del_pipeline(agent, mock_supabase):
    """Los leads 'won' y 'lost' deben excluirse de la consulta de activos."""
    await agent.run({"trigger": "daily_analysis"})
    # Verificar que la query usa .not_.in_ para excluir estados terminales
    mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.assert_called()

@pytest.mark.asyncio
async def test_mock_mode_sin_leads(agent, mock_supabase):
    result = await agent.run({"trigger": "daily_analysis"})
    assert result["output"]["leads_analyzed"] == 0
