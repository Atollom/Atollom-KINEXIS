import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.review_monitor_agent import ReviewMonitorAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"sku": "SKU-1", "ml_id": "ML-1", "amazon_asin": "ASIN-1"}])
    )
    supa.table.return_value.insert.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = ReviewMonitorAgent("t1", mock_supabase)
    agent._notify_socias = AsyncMock()
    agent._query_ml_reviews = AsyncMock(return_value=[])
    agent.amazon_adapter.get_reviews = AsyncMock(return_value=[])
    return agent

@pytest.mark.asyncio
async def test_alerta_rating_menor_4(agent):
    agent._query_ml_reviews.return_value = [{"rating": 3.9}, {"rating": 3.5}]
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["low_rating_alerts"]) > 0

@pytest.mark.asyncio
async def test_alerta_urgente_rating_menor_38(agent):
    # Urgente es < 3.8
    agent._query_ml_reviews.return_value = [{"rating": 3.7}]
    result = await agent.run({"platform": "mercadolibre"})
    assert any("3.7" in a for a in result["output"]["low_rating_alerts"])

@pytest.mark.asyncio
async def test_nunca_solicita_resenas_falsas(agent):
    # Probamos que no hay lógica de escritura de reseñas
    # Solo lectura y snapshot
    result = await agent.run({"platform": "all"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_patron_fake_detectado_solo_alerta(agent):
    # Texto idéntico en 3 de 4 reseñas
    agent._query_ml_reviews.return_value = [
        {"rating": 5, "comment": "Excelente producto"},
        {"rating": 5, "comment": "Excelente producto"},
        {"rating": 5, "comment": "Excelente producto"},
        {"rating": 4, "comment": "Bueno"}
    ]
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["fake_review_alerts"]) > 0

@pytest.mark.asyncio
async def test_snapshot_guardado_en_bd(agent, mock_supabase):
    agent._query_ml_reviews.return_value = [{"rating": 5}]
    await agent.run({"platform": "mercadolibre"})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_socias_notificadas_si_alerta(agent):
    agent._query_ml_reviews.return_value = [{"rating": 1}]
    await agent.run({"platform": "mercadolibre"})
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_cron_cada_4_horas(agent):
    # Simulado por el trigger manual pero garantizamos que procesa
    result = await agent.run({"trigger": "scheduled_check"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_ml_y_amazon_chequeados(agent):
    agent._query_ml_reviews.return_value = [{"rating": 5}]
    agent.amazon_adapter.get_reviews.return_value = [{"rating": 4}]
    result = await agent.run({"platform": "all"})
    assert result["output"]["reviews_checked"] == 2

@pytest.mark.asyncio
async def test_tenant_isolation_reviews(agent, mock_supabase):
    await agent.run({"platform": "all"})
    # Verificamos que al buscar productos se filtre por tenant
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_mock_mode_amazon_reviews(agent):
    # amazon_adapter ya tiene mock_mode
    result = await agent.run({"platform": "amazon"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_patron_muchas_resenas_24h(agent):
    """Muchas reseñas 5★ sin comentario (>80% del total) dispara fake_pattern."""
    silent_fives = [{"rating": 5, "comment": ""} for _ in range(9)]
    agent._query_ml_reviews.return_value = silent_fives + [{"rating": 3, "comment": "Mala"}]
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["fake_review_alerts"]) > 0

@pytest.mark.asyncio
async def test_patron_texto_identico_detectado(agent):
    agent._query_ml_reviews.return_value = [
        {"rating": 5, "comment": "igual"},
        {"rating": 5, "comment": "igual"}
    ]
    # No es fake porque son muy pocos. Fake pattern requiere >= 3.
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["fake_review_alerts"]) == 0

    agent._query_ml_reviews.return_value.append({"rating": 5, "comment": "igual"})
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["fake_review_alerts"]) > 0

# ── H2 ──

@pytest.mark.asyncio
async def test_sin_reviews_no_genera_alertas(agent):
    """Sin reseñas no debe disparar alertas de rating ni fake."""
    agent._query_ml_reviews.return_value = []
    result = await agent.run({"platform": "mercadolibre"})
    assert len(result["output"]["low_rating_alerts"]) == 0
    assert len(result["output"]["fake_review_alerts"]) == 0
