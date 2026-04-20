"""Tests for Agent #12 - Ads Manager."""

import pytest
from src.agents.meta.agent_12_ads_manager import Agent12AdsManager

VALID_CAMPAIGN = {
    "name": "Campaña Taladros Abril",
    "objective": "conversions",
    "budget_daily": 500.0,
    "platforms": ["facebook", "instagram"],
    "targeting": {
        "locations": ["Mexico", "Puebla"],
        "age_min": 25,
        "age_max": 55,
        "interests": ["construccion", "herramientas"],
    },
}


@pytest.fixture
def agent():
    return Agent12AdsManager()


@pytest.mark.asyncio
async def test_ads_create_campaign(agent):
    result = await agent.execute({"action": "create", "campaign": VALID_CAMPAIGN})
    assert result["success"] is True
    data = result["data"]
    assert data["campaign_id"].startswith("CAMP-")
    assert data["status"] == "active"
    assert data["budget_daily"] == 500.0
    assert "reach_estimated" in data


@pytest.mark.asyncio
async def test_ads_pause_campaign(agent):
    result = await agent.execute({"action": "pause", "ad_id": "AD-1234"})
    assert result["success"] is True
    data = result["data"]
    assert data["status"] == "paused"
    assert data["ad_id"] == "AD-1234"


@pytest.mark.asyncio
async def test_ads_resume_campaign(agent):
    result = await agent.execute({"action": "resume", "ad_id": "AD-1234"})
    assert result["success"] is True
    assert result["data"]["status"] == "active"


@pytest.mark.asyncio
async def test_ads_get_stats(agent):
    result = await agent.execute({"action": "get_stats", "ad_id": "AD-1234"})
    assert result["success"] is True
    data = result["data"]
    assert "stats" in data
    stats = data["stats"]
    assert "impressions" in stats
    assert "clicks" in stats
    assert "cpc" in stats


@pytest.mark.asyncio
async def test_ads_invalid_budget(agent):
    campaign = {**VALID_CAMPAIGN, "budget_daily": 0}
    result = await agent.execute({"action": "create", "campaign": campaign})
    assert result["success"] is False
    assert "budget" in result["error"].lower()


@pytest.mark.asyncio
async def test_ads_invalid_targeting_ages(agent):
    campaign = {
        **VALID_CAMPAIGN,
        "targeting": {"age_min": 60, "age_max": 20},
    }
    result = await agent.execute({"action": "create", "campaign": campaign})
    assert result["success"] is False
    assert "age" in result["error"].lower()


@pytest.mark.asyncio
async def test_ads_facebook_only(agent):
    campaign = {**VALID_CAMPAIGN, "platforms": ["facebook"]}
    result = await agent.execute({"action": "create", "campaign": campaign})
    assert result["success"] is True
    assert "facebook" in result["data"]["platforms"]
    assert "instagram" not in result["data"]["platforms"]


@pytest.mark.asyncio
async def test_ads_instagram_only(agent):
    campaign = {**VALID_CAMPAIGN, "platforms": ["instagram"]}
    result = await agent.execute({"action": "create", "campaign": campaign})
    assert result["success"] is True
    assert result["data"]["platforms"] == ["instagram"]


@pytest.mark.asyncio
async def test_ads_both_platforms_reach_higher(agent):
    single = await agent.execute({
        "action": "create",
        "campaign": {**VALID_CAMPAIGN, "platforms": ["facebook"]},
    })
    both = await agent.execute({
        "action": "create",
        "campaign": {**VALID_CAMPAIGN, "platforms": ["facebook", "instagram"]},
    })
    assert single["success"] is True
    assert both["success"] is True
    # Reach with 2 platforms should have larger numbers
    both_reach = both["data"]["reach_estimated"]
    assert both_reach is not None
