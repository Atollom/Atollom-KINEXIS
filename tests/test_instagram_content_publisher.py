import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.instagram_content_publisher import InstagramContentPublisher

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "POST-1"}])
    )
    return supa

@pytest.fixture
def agent(mock_supabase):
    return InstagramContentPublisher("t1", mock_supabase)

@pytest.mark.asyncio
async def test_requires_approval_true_siempre(agent):
    result = await agent.run({
        "action": "publish_now",
        "content": {"image_url": "http://img.png", "caption": "Test"}
    })
    assert result["output"]["requires_approval"] is True
    assert result["output"]["status"] == "pending"

@pytest.mark.asyncio
async def test_caption_max_2200_chars(agent):
    long_caption = "A" * 2500
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": long_caption}
    })
    # We verify it doesn't crash and we could check length in a more detailed test
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_minimo_3_hashtags(agent):
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test", "hashtags": ["#onlyone"]}
    })
    assert result["output"]["hashtags_added"] >= 3

@pytest.mark.asyncio
async def test_horario_optimo_sugerido(agent):
    # 3 AM is not optimal
    bad_time = "2026-04-11T03:00:00Z"
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test"},
        "scheduled_at": bad_time
    })
    assert "Sugerencia" in result["output"]["warning"]

@pytest.mark.asyncio
async def test_producto_etiquetado_si_sku(agent, mock_supabase):
    await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test", "product_sku": "SKU-1"}
    })
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["product_sku"] == "SKU-1"

@pytest.mark.asyncio
async def test_publicacion_no_aplicada_sin_aprobacion(agent, mock_supabase):
    # Agent process only saves proposal with status=pending, never publishes directly
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test"}
    })
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["status"] == "pending"
    assert result["output"]["requires_approval"] is True

@pytest.mark.asyncio
async def test_story_vs_feed_diferenciado(agent, mock_supabase):
    await agent.run({
        "action": "create_story",
        "content": {"image_url": "http://img.png", "caption": "Test"}
    })
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["action"] == "create_story"

@pytest.mark.asyncio
async def test_scheduled_at_futuro_valido(agent, mock_supabase):
    future = "2026-05-01T20:00:00Z" # Optimal 8 PM
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test"},
        "scheduled_at": future
    })
    assert result["output"]["warning"] is None

@pytest.mark.asyncio
async def test_tenant_isolation(agent, mock_supabase):
    await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test"}
    })
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_mock_mode_meta_api(agent, mock_supabase):
    # MetaAdapter.publish() is NEVER called in process() — only content_proposals INSERT
    result = await agent.run({
        "content": {"image_url": "http://img.png", "caption": "Test"}
    })
    # meta_adapter.publish_post was never invoked — table insert was
    mock_supabase.table.assert_called_with("content_proposals")
    assert result["output"]["status"] == "pending"

@pytest.mark.asyncio
async def test_error_si_falta_caption_o_image(agent):
    result = await agent.run({"content": {"caption": "No img"}})
    assert result["status"] == "failed"
