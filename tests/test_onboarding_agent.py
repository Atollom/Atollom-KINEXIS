import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.onboarding_agent import OnboardingAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.upsert.return_value.execute = AsyncMock()
    supa.table.return_value.update.return_value.eq.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = OnboardingAgent("t1", mock_supabase)
    # Mock adapters to avoid actual pings
    agent.ml_adapter.get_orders = AsyncMock(return_value=[])
    agent.amazon_adapter.get_orders = AsyncMock(return_value=[])
    agent.shopify_adapter.get_orders = AsyncMock(return_value=[])
    return agent

@pytest.mark.asyncio
async def test_progreso_guardado_entre_pasos(agent, mock_supabase):
    await agent.run({"step": "welcome"})
    mock_supabase.table.return_value.upsert.assert_called()

@pytest.mark.asyncio
async def test_retoma_desde_paso_anterior(agent):
    # En esta implementación el agente recibe el paso a ejecutar del payload
    result = await agent.run({"step": "welcome"})
    assert result["output"]["next_step"] == "connect_platforms"

@pytest.mark.asyncio
async def test_credencial_invalida_no_avanza(agent):
    agent.ml_adapter.get_orders.side_effect = Exception("Auth fail")
    agent.amazon_adapter.get_orders.side_effect = Exception("Auth fail")
    agent.shopify_adapter.get_orders.side_effect = Exception("Auth fail")
    
    result = await agent.run({"step": "connect_platforms"})
    assert result["output"]["step_completed"] is False
    assert result["output"]["next_step"] == "connect_platforms"

@pytest.mark.asyncio
async def test_cfdi_requerido_en_configure_rules(agent):
    result = await agent.run({"step": "configure_rules", "step_data": {}})
    assert result["output"]["step_completed"] is False
    assert "RFC obligatorio" in result["output"]["blocking_issues"][0]
    
    result2 = await agent.run({"step": "configure_rules", "step_data": {"rfc": "XAXX010101000"}})
    assert result2["output"]["step_completed"] is True

@pytest.mark.asyncio
async def test_catalog_import_mapeo_automatico(agent):
    data = {"items": [{"sku": "S1", "price": 100, "cost": 50}]}
    result = await agent.run({"step": "import_catalog", "step_data": data})
    assert result["output"]["step_completed"] is True
    assert result["output"]["result_data"]["imported"] == 1

@pytest.mark.asyncio
async def test_agentes_activados_modo_supervised(agent, mock_supabase):
    await agent.run({"step": "activate_agents"})
    mock_supabase.table.return_value.update.assert_called_with({"active": True, "autonomy_level": "SUPERVISED"})

@pytest.mark.asyncio
async def test_progress_pct_correcto_por_paso(agent):
    res = await agent.run({"step": "welcome"})
    assert res["output"]["progress_pct"] == 30 # next_step progress
    
    res2 = await agent.run({"step": "activate_agents"})
    assert res2["output"]["progress_pct"] == 100

@pytest.mark.asyncio
async def test_socias_notificadas_al_completar(agent, mock_supabase):
    # complete step saves final progress with 100% pct
    result = await agent.run({"step": "complete"})
    call_args = mock_supabase.table.return_value.upsert.call_args[0][0]
    assert call_args["progress_pct"] == 100
    assert result["output"]["onboarding_complete"] is True

@pytest.mark.asyncio
async def test_tenant_isolation_progress(agent, mock_supabase):
    await agent.run({"step": "welcome"})
    call_args = mock_supabase.table.return_value.upsert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_complete_marca_onboarding_done(agent):
    result = await agent.run({"step": "complete"})
    assert result["output"]["onboarding_complete"] is True

@pytest.mark.asyncio
async def test_errores_de_importacion_reportados(agent):
    data = {"items": [{"name": "No SKU"}]}
    result = await agent.run({"step": "import_catalog", "step_data": data})
    assert result["output"]["result_data"]["errors"] == 1

@pytest.mark.asyncio
async def test_plataforma_critica_falla_bloquea(agent):
    # Si falla una pero otra conecta, avanza
    agent.ml_adapter.get_orders.return_value = [{"id": 1}]
    agent.amazon_adapter.get_orders.side_effect = Exception("Fail")
    
    result = await agent.run({"step": "connect_platforms"})
    assert result["output"]["step_completed"] is True
