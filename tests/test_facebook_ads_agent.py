import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.facebook_ads_agent import FacebookAdsAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.select.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"facebook_min_roas": 2.8})
    )
    supa.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    supa.table.return_value.update.return_value.eq.return_value.eq.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    return FacebookAdsAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_facebook_roas_calculado(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"spend": 100, "revenue": 280})
    )
    roas = await agent._check_roas("C1")
    assert roas == Decimal("2.8000")

@pytest.mark.asyncio
async def test_facebook_pausa_roas_bajo(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"campaign_id": "C1", "campaign_name": "FB Camp", "roas": 1.5, "status": "active"}
        ])
    )
    result = await agent.run({"action": "pause_low_roas"})
    assert result["output"]["paused_count"] == 1

@pytest.mark.asyncio
async def test_facebook_min_roas_de_config(agent, mock_supabase):
    result = await agent.run({"action": "pause_low_roas"})
    assert result["output"]["min_roas_applied"] == 2.8

@pytest.mark.asyncio
async def test_facebook_notify(agent):
    agent._notify_socias_roas = AsyncMock()
    agent._pause_low_roas = AsyncMock(return_value=[{"campaign_name": "C1"}])
    await agent.run({"action": "pause_low_roas"})
    agent._notify_socias_roas.assert_called()

@pytest.mark.asyncio
async def test_facebook_tenant_isolation(agent, mock_supabase):
    await agent.run({"action": "daily_report"})
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_facebook_platform_correcta(agent):
    assert agent.PLATFORM == 'facebook'

@pytest.mark.asyncio
async def test_facebook_optimize_status(agent):
    result = await agent.run({"action": "optimize_bids"})
    assert result["output"]["status"] == "optimized"

@pytest.mark.asyncio
async def test_facebook_report_count(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{}])
    )
    result = await agent.run({"action": "daily_report"})
    assert result["output"]["report_items"] == 1

@pytest.mark.asyncio
async def test_facebook_roas_zero_spend(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"spend": 0, "revenue": 100})
    )
    roas = await agent._check_roas("C1")
    assert roas == Decimal("0")

@pytest.mark.asyncio
async def test_facebook_update_status_paused(agent, mock_supabase):
    await agent._pause_campaign_remote("C1")
    mock_supabase.table.return_value.update.assert_called_with({"status": "paused"})
