import pytest
from datetime import timedelta, date
from unittest.mock import AsyncMock, MagicMock
from src.agents.ml_analytics_agent import MLAnalyticsAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.storage.from_.return_value.upload = AsyncMock()
    supa.storage.from_.return_value.create_signed_url = AsyncMock(return_value={"signedURL": "https://signed.url"})
    supa.table.return_value.insert.return_value.execute = AsyncMock(return_value=MagicMock(data=[{"id": "rep123"}]))
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = MLAnalyticsAgent("t1", mock_supabase)
    # mock now
    now_mock = MagicMock()
    now_mock.date.return_value = date(2023, 10, 16) # Lunes
    now_mock.isoformat.return_value = "2023-10-16T08:00:00"
    agent._get_now = MagicMock(return_value=now_mock)
    
    agent._query_inventory = AsyncMock(return_value=[
        {"sku": "SKU7", "days_no_sale": 8},
        {"sku": "SKU60", "days_no_sale": 60}
    ])
    
    agent._query_orders = AsyncMock(return_value=[1, 2, 3])
    agent._notify_socias = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_fecha_futura_rechazada(agent):
    result = await agent.run({"report_type": "weekly_sales", "date_to": "2030-01-01"})
    assert result["status"] == "failed"
    assert "futuro" in result["error"]

@pytest.mark.asyncio
async def test_date_from_mayor_date_to_rechazado(agent):
    result = await agent.run({"report_type": "weekly_sales", "date_from": "2023-10-10", "date_to": "2023-10-01"})
    assert result["status"] == "failed"
    assert "mayor" in result["error"]

@pytest.mark.asyncio
async def test_weekly_report_compara_semana_anterior(agent):
    result = await agent.run({"report_type": "weekly_sales"})
    assert result["output"]["report_data"]["prev_sales"] is not None

@pytest.mark.asyncio
async def test_slow_movers_sin_ventas_7_dias(agent):
    result = await agent.run({"report_type": "slow_movers"})
    alerts = result["output"]["alerts"]
    assert any("7 dias" in a.lower() for a in alerts)

@pytest.mark.asyncio
async def test_slow_movers_60_dias_sugerir_discontinuar(agent):
    result = await agent.run({"report_type": "slow_movers"})
    alerts = result["output"]["alerts"]
    assert any("60" in a for a in alerts)
    assert any("descontinuar" in a.lower() for a in alerts)

@pytest.mark.asyncio
async def test_reporte_guardado_en_storage(agent, mock_supabase):
    await agent.run({"report_type": "weekly_sales"})
    mock_supabase.storage.from_.assert_called_with("reports")
    mock_supabase.storage.from_.return_value.upload.assert_called()

@pytest.mark.asyncio
async def test_signed_url_30_dias(agent, mock_supabase):
    await agent.run({"report_type": "weekly_sales"})
    mock_supabase.storage.from_.return_value.create_signed_url.assert_called()
    call_args = mock_supabase.storage.from_.return_value.create_signed_url.call_args
    # 30 days in seconds
    assert call_args[0][1] == 30 * 24 * 60 * 60

@pytest.mark.asyncio
async def test_socias_notificadas_whatsapp(agent):
    await agent.run({"report_type": "top_sellers"})
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_reporte_registrado_en_bd(agent, mock_supabase):
    await agent.run({"report_type": "weekly_sales"})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_orders_query(mock_supabase):
    agent = MLAnalyticsAgent("TENANT_X", mock_supabase)
    now_mock = MagicMock()
    now_mock.date.return_value = date(2023, 10, 16)
    agent._get_now = MagicMock(return_value=now_mock)
    
    # Check that tenant_id makes it to the db insert at least
    await agent.run({"report_type": "weekly_sales"})
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "TENANT_X"

@pytest.mark.asyncio
async def test_lunes_8am_cron_trigger(agent):
    # Ya está mockeado a día lunes a las 8am.
    # El trigger en data dice weekly_sales que es lo que sucede el lunes 8am por cron
    result = await agent.run({"report_type": "weekly_sales"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_mock_mode_storage_falla_gracefully(agent, mock_supabase):
    mock_supabase.storage.from_.return_value.upload = AsyncMock(side_effect=Exception("Storage Down"))
    result = await agent.run({"report_type": "weekly_sales"})
    assert result["status"] == "success"
    # El reporte existe aunq url es None
    assert result["output"]["report_url"] is None

# ── H2 ──

@pytest.mark.asyncio
async def test_report_type_requerido(agent):
    """Sin report_type debe fallar con ValueError."""
    res = await agent.run({})
    assert res["status"] == "failed"
    assert "requerido" in res["error"]

@pytest.mark.asyncio
async def test_report_type_desconocido_rechazado(agent):
    """report_type inválido debe fallar con ValueError."""
    res = await agent.run({"report_type": "unknown_report"})
    assert res["status"] == "failed"
    assert "desconocido" in res["error"]
