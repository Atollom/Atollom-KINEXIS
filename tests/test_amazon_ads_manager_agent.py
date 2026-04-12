import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.amazon_ads_manager_agent import AmazonAdsManagerAgent

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
    return AmazonAdsManagerAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_amazon_acos_calculado(agent, mock_supabase):
    # _pause_low_roas (manual) llama a _query_tenant_rules (1) y luego select campaigns (2)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # rules
        MagicMock(data=[
            {"campaign_id": "C1", "campaign_name": "AMZ Camp", "roas": 4.0, "spend": 25, "revenue": 100, "status": "active"}
        ]) # campaigns (ACoS=25% <= 25%)
    ]
    paused = await agent._pause_low_roas(Decimal("2.5"))
    assert len(paused) == 0

@pytest.mark.asyncio
async def test_amazon_pausa_por_acos_alto(agent, mock_supabase):
    # _pause_low_roas (manual) hace: rules(1), campaigns(2), update(3)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # rules
        MagicMock(data=[
            {"campaign_id": "C1", "campaign_name": "AMZ Camp", "roas": 4.0, "spend": 30, "revenue": 100, "status": "active"}
        ]), # campaigns (ACoS=30% > 25%)
        MagicMock(data=[]) # pause update call
    ]
    paused = await agent._pause_low_roas(Decimal("2.5"))
    assert len(paused) == 1
    assert paused[0]["acos_applied"] == 30.0

@pytest.mark.asyncio
async def test_amazon_acos_infinito_si_revenue_cero(agent, mock_supabase):
    # _pause_low_roas (manual) hace: rules(1), campaigns(2), update(3)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # rules
        MagicMock(data=[
            {"campaign_id": "C1", "campaign_name": "AMZ Camp", "roas": 0.0, "spend": 10, "revenue": 0, "status": "active"}
        ]), # campaigns
        MagicMock(data=[]) # pause update call
    ]
    paused = await agent._pause_low_roas(Decimal("2.5"))
    assert paused[0]["acos_applied"] == 999.99

@pytest.mark.asyncio
async def test_amazon_roas_decimal(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data={"spend": 10, "revenue": 45})
    roas = await agent._check_roas("C1")
    assert roas == Decimal("4.5000")

@pytest.mark.asyncio
async def test_amazon_min_roas_de_tenant_config(agent, mock_supabase):
    # run() hace: _handle_rules(1), _pause_low_roas->rules(2), _pause_low_roas->campaigns(3)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # _handle call
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # _pause internal call
        MagicMock(data=[]) # campaigns
    ]
    result = await agent.run({"action": "pause_low_roas"})
    assert result["status"] == "success"
    assert result["output"]["min_roas_applied"] == 2.5

@pytest.mark.asyncio
async def test_amazon_socias_notificadas(agent, mock_supabase):
    agent._notify_socias_roas = AsyncMock()
    # run() hace: _handle_rules(1), _pause_low_roas->rules(2), _pause_low_roas->campaigns(3), update(4)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # 1
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}), # 2
        MagicMock(data=[{"campaign_id": "C1", "campaign_name": "C1", "roas": 1.0, "spend": 10, "revenue": 5, "status": "active"}]), # 3
        MagicMock(data=[]) # 4
    ]
    await agent.run({"action": "pause_low_roas"})
    agent._notify_socias_roas.assert_called()

@pytest.mark.asyncio
async def test_amazon_tenant_isolation(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    await agent.run({"action": "daily_report"})
    mock_supabase.table.assert_any_call("ads_campaigns")

@pytest.mark.asyncio
async def test_amazon_mock_mode_adapter(agent):
    result = await agent.run({"action": "optimize_bids"})
    assert result["output"]["platform"] == "amazon"

@pytest.mark.asyncio
async def test_amazon_daily_report_generado(agent, mock_supabase):
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])
    result = await agent.run({"action": "daily_report"})
    assert "report_items" in result["output"]

@pytest.mark.asyncio
async def test_amazon_acos_max_de_tenant_config(agent, mock_supabase):
    # _pause_low_roas(manual) hace: rules(1), campaigns(2)
    mock_supabase.table.return_value.execute.side_effect = [
        MagicMock(data={"amazon_min_roas": 2.5, "amazon_max_acos": 25.0}),
        MagicMock(data=[])
    ]
    await agent._pause_low_roas(Decimal("2.5"))
    # Verificamos que se haya intentado consultar config en la tabla correcta
    mock_supabase.table.assert_any_call("tenant_business_rules")
