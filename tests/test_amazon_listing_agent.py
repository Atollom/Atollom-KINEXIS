import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.amazon_listing_agent import AmazonListingAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "PROP-1"}])
    )
    return supa

@pytest.fixture
def agent(mock_supabase):
    return AmazonListingAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_titulo_max_200_chars(agent):
    proposal = await agent._optimize_listing("SKU-1", "ASIN-1")
    assert len(proposal["suggested_title"]) <= 200

@pytest.mark.asyncio
async def test_5_bullet_points_max_255_cada_uno(agent):
    proposal = await agent._optimize_listing("SKU-1", "ASIN-1")
    assert len(proposal["suggested_bullets"]) == 5
    for b in proposal["suggested_bullets"]:
        assert len(b) <= 255

@pytest.mark.asyncio
async def test_sin_html_en_titulo(agent):
    html_title = "<b>Producto</b> <br> Amazon"
    clean = agent._sanitize_title(html_title)
    assert "<" not in clean
    assert ">" not in clean

@pytest.mark.asyncio
async def test_asin_requerido(agent):
    result = await agent.run({"sku": "SKU-1"})
    assert result["status"] == "failed"
    assert "asin" in result["error"]

@pytest.mark.asyncio
async def test_propuesta_guardada_no_aplicada(agent, mock_supabase):
    await agent.run({"sku": "SKU-1", "asin": "ASIN-1"})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_proposals(agent, mock_supabase):
    await agent.run({"sku": "SKU-1", "asin": "ASIN-1"})
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_sanitize_titulo_actual(agent):
    title = agent._sanitize_title("  Espacios  ")
    assert title == "Espacios"

@pytest.mark.asyncio
async def test_apply_changes_status(agent):
    res = await agent.run({"action": "apply_changes", "sku": "S1", "asin": "A1", "proposal_id": "P1"})
    assert res["output"]["status"] == "applied"

@pytest.mark.asyncio
async def test_sku_requerido(agent):
    result = await agent.run({"asin": "ASIN-1"})
    assert result["status"] == "failed"

@pytest.mark.asyncio
async def test_optimize_listing_return_data(agent):
    res = await agent._optimize_listing("S1", "A1")
    assert "proposal_id" in res

@pytest.mark.asyncio
async def test_action_desconocida(agent):
    result = await agent.run({"action": "invalid", "sku": "S1", "asin": "A1"})
    assert result["status"] == "failed"
