import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.ml_ads_manager_agent import MLAdsManagerAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    mock_chain = MagicMock()
    mock_chain.select.return_value = mock_chain
    mock_chain.update.return_value = mock_chain
    mock_chain.eq.return_value = mock_chain
    mock_chain.single.return_value = mock_chain
    mock_chain.execute = AsyncMock()
    supa.table.return_value = mock_chain
    return supa

@pytest.fixture
def agent(mock_supabase):
    return MLAdsManagerAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_ml_roas_calculado_en_decimal(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data={"spend": 100, "revenue": 500})
    roas = await agent._check_roas("C1")
    assert roas == Decimal("5.0000")

@pytest.mark.asyncio
async def test_ml_roas_cero_si_sin_gasto(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data={"spend": 0, "revenue": 500})
    roas = await agent._check_roas("C1")
    assert roas == Decimal("0")

@pytest.mark.asyncio
async def test_ml_campana_pausada_si_roas_bajo(agent, mock_supabase):
    # run() llama a pause_low_roas que hace 2 calls a execute
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"ml_min_roas": 2.0}), # config
        MagicMock(data=[{"campaign_id": "C1", "campaign_name": "ML Camp", "roas": 1.2, "status": "active"}]), # campaigns
        MagicMock(data=[])
    ]
    result = await agent.run({"action": "pause_low_roas"})
    assert result["output"]["paused_count"] == 1

@pytest.mark.asyncio
async def test_ml_min_roas_de_tenant_config(agent, mock_supabase):
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"ml_min_roas": 2.0}),
        MagicMock(data=[])
    ]
    result = await agent.run({"action": "pause_low_roas"})
    assert result["output"]["min_roas_applied"] == 2.0

@pytest.mark.asyncio
async def test_ml_socias_notificadas_campanas_pausadas(agent, mock_supabase):
    agent._notify_socias_roas = AsyncMock()
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"ml_min_roas": 2.0}),
        MagicMock(data=[{"campaign_id": "C1", "roas": 1.0, "status": "active"}]),
        MagicMock(data=[])
    ]
    await agent.run({"action": "pause_low_roas"})
    agent._notify_socias_roas.assert_called()

@pytest.mark.asyncio
async def test_ml_tenant_isolation_campaigns(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    await agent.run({"action": "daily_report"})
    # Verificamos que se llame table("ads_campaigns")
    mock_supabase.table.assert_any_call("ads_campaigns")

@pytest.mark.asyncio
async def test_ml_mock_mode_advertising_api(agent):
    result = await agent.run({"action": "optimize_bids"})
    assert result["output"]["platform"] == "mercadolibre"

@pytest.mark.asyncio
async def test_ml_solo_campanas_de_plataforma_correcta(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    await agent.run({"action": "daily_report"})
    # Verifica que el filtro de plataforma sea 'mercadolibre'
    mock_supabase.table.return_value.eq.assert_any_call("platform", "mercadolibre")

@pytest.mark.asyncio
async def test_ml_daily_report_generado(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    result = await agent.run({"action": "daily_report"})
    assert "report_items" in result["output"]

@pytest.mark.asyncio
async def test_ml_update_db_on_pause(agent, mock_supabase):
    mock_supabase.table.return_value.execute = AsyncMock()
    await agent._pause_campaign_remote("C1")
    mock_supabase.table.return_value.update.assert_called_with({"status": "paused"})
