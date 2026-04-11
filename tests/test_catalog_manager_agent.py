import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.catalog_manager_agent import CatalogManagerAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    return CatalogManagerAgent("t1", mock_supabase)

@pytest.mark.asyncio
async def test_sku_sin_ventas_60_dias_detectado(agent):
    agent._detect_stale_skus = AsyncMock(return_value=["S-STALE-1"])
    result = await agent.run({"action": "monthly_audit"})
    assert "S-STALE-1" in result["output"]["stale_skus"]

@pytest.mark.asyncio
async def test_discontinuar_notify_socias(agent):
    agent._notify_socias = AsyncMock()
    await agent.run({"action": "discontinue_sku", "sku": "SKU-DIE"})
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_bundle_suggestion_basado_en_historial(agent):
    result = await agent.run({"action": "suggest_bundles"})
    assert "bundle_suggestions" in result["output"]

@pytest.mark.asyncio
async def test_auditoria_mensual_trigger(agent):
    result = await agent.run({"action": "monthly_audit"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_tenant_isolation_catalog(agent, mock_supabase):
    assert agent.tenant_id == "t1"

@pytest.mark.asyncio
async def test_stale_skus_lista_correcta(agent):
    res = await agent._detect_stale_skus(60)
    assert isinstance(res, list)

@pytest.mark.asyncio
async def test_acciones_registradas(agent):
    agent._detect_stale_skus = AsyncMock(return_value=["S-1"])
    result = await agent.run({"action": "monthly_audit"})
    assert len(result["output"]["actions_taken"]) > 0

@pytest.mark.asyncio
async def test_adapters_present(agent):
    assert agent.ml_adapter is not None
    assert agent.amazon_adapter is not None

@pytest.mark.asyncio
async def test_discontinue_sku_sin_sku_falla(agent):
    result = await agent.run({"action": "discontinue_sku"})
    assert result["status"] == "failed"
    assert "sku" in result["error"].lower()

@pytest.mark.asyncio
async def test_notify_socias_excepcion_no_rompe_audit(agent):
    # _notify_socias captura excepciones; monthly_audit no debe fallar si notify falla
    agent._notify_socias = AsyncMock(side_effect=Exception("WA down"))
    agent._detect_stale_skus = AsyncMock(return_value=["SKU-OLD"])
    result = await agent.run({"action": "monthly_audit"})
    assert result["status"] == "success"
