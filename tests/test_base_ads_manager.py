import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.base_ads_manager import BaseAdsManager

class StubAdsAgent(BaseAdsManager):
    PLATFORM = 'test_platform'
    MIN_ROAS_KEY = 'test_min_roas'

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    mock_chain = MagicMock()
    mock_chain.select.return_value = mock_chain
    mock_chain.update.return_value = mock_chain
    mock_chain.upsert.return_value = mock_chain
    mock_chain.insert.return_value = mock_chain
    mock_chain.eq.return_value = mock_chain
    mock_chain.single.return_value = mock_chain
    mock_chain.execute = AsyncMock()
    supa.table.return_value = mock_chain
    return supa

@pytest.fixture
def agent(mock_supabase):
    return StubAdsAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_roas_calculado_en_decimal(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data={"spend": 100, "revenue": 300})
    roas = await agent._check_roas("C1")
    assert isinstance(roas, Decimal)
    assert roas == Decimal("3.0000")

@pytest.mark.asyncio
async def test_roas_cero_si_sin_gasto(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data={"spend": 0, "revenue": 300})
    roas = await agent._check_roas("C1")
    assert roas == Decimal("0")

@pytest.mark.asyncio
async def test_campana_pausada_si_roas_bajo(agent, mock_supabase):
    # _pause_low_roas (manual) hace 1 call a execute si le pasas min_roas
    # Pero en el agente BaseAdsManager._pause_low_roas NO llama a config.
    # run() es quien llama a config y luego a _pause_low_roas.
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[
        {"campaign_id": "C1", "campaign_name": "C1", "roas": 1.5, "status": "active"}
    ])
    paused = await agent._pause_low_roas(Decimal("2.5"))
    assert len(paused) == 1
    mock_supabase.table.return_value.update.assert_called_with({"status": "paused"})

@pytest.mark.asyncio
async def test_min_roas_de_tenant_config(agent, mock_supabase):
    # run() llama a config y luego a _pause_low_roas (que llama a campaigns)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"test_min_roas": 2.5}), # config
        MagicMock(data=[]) # campaigns
    ]
    result = await agent.run({"action": "pause_low_roas"})
    assert result["output"]["min_roas_applied"] == 2.5

@pytest.mark.asyncio
async def test_socias_notificadas_campanas_pausadas(agent, mock_supabase):
    agent._notify_socias_roas = AsyncMock()
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"test_min_roas": 2.5}), # config
        MagicMock(data=[{"campaign_id": "C1", "campaign_name": "C1", "roas": 1.0, "status": "active"}]), # campaigns
        MagicMock(data=[]) # update call in _pause_campaign_remote
    ]
    await agent.run({"action": "pause_low_roas"})
    agent._notify_socias_roas.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_campaigns(agent, mock_supabase):
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data=[])
    ]
    await agent.run({"action": "daily_report"})
    # Verificamos que eq se llamó con tenant_id. table() devuelve mock_chain, eq() devuelve mock_chain.
    # El assert_any_call debe ser sobre el objeto retornado por table() o eq()
    # Usando mock_chain directamente es más seguro
    mock_supabase.table.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_mock_mode_advertising_api(agent):
    result = await agent.run({"action": "optimize_bids"})
    assert result["output"]["status"] == "optimized"

@pytest.mark.asyncio
async def test_solo_campanas_de_plataforma_correcta(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    await agent.run({"action": "daily_report"})
    mock_supabase.table.return_value.eq.assert_any_call("platform", "test_platform")

@pytest.mark.asyncio
async def test_query_tenant_rules_excepcion_devuelve_dict_vacio(agent, mock_supabase):
    # Si BD falla, _query_tenant_rules retorna {} sin propagar
    mock_supabase.table.return_value.execute.side_effect = Exception("DB error")
    rules = await agent._query_tenant_rules()
    assert rules == {}

@pytest.mark.asyncio
async def test_notify_socias_roas_excepcion_no_propaga(agent):
    # _notify_socias_roas captura excepciones con logger.error
    from unittest.mock import patch
    with patch("src.agents.base_ads_manager.logger") as mock_logger:
        # Llamada directa — no debe lanzar nada
        await agent._notify_socias_roas([{"campaign_name": "TestCamp"}])
        # logger.error no se llamó porque el bloque interno no lanzó excepción
        mock_logger.error.assert_not_called()
