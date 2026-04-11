import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.catalog_sync_agent import CatalogSyncAgent

@pytest.fixture
def mock_supabase():
    return MagicMock()

@pytest.fixture
def agent(mock_supabase):
    agent = CatalogSyncAgent("t1", mock_supabase)
    
    # Mock Private methods
    def make_res(data):
        m = MagicMock()
        m.data = data
        return m

    agent._query_product = AsyncMock(return_value={"sku": "KTO-123", "image_url": "http://img", "description": "desc", "sat_key": "123"})
    agent._insert_log = AsyncMock()
    agent._notify_socias = AsyncMock()
    
    agent.ml_adapter.update_item = AsyncMock()
    agent.ml_adapter.create_item = AsyncMock()
    agent.amazon_adapter.update_inventory = AsyncMock()
    agent.shopify_adapter.update_product = AsyncMock()
    
    return agent

@pytest.mark.asyncio
async def test_producto_sin_imagen_skip_plataforma(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "description": "desc", "sat_key": "123"})
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    assert result["status"] == "success"
    assert "missing_image" in result["output"]["errors"]
    assert len(result["output"]["platforms_synced"]) == 0

@pytest.mark.asyncio
async def test_producto_sin_descripcion_skip_plataforma(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "image_url": "img", "sat_key": "123"})
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    assert "missing_description" in result["output"]["errors"]
    assert len(result["output"]["platforms_synced"]) == 0

@pytest.mark.asyncio
async def test_nuevo_producto_notify_socias(agent):
    result = await agent.run({"sku": "SKU", "trigger": "new_product"})
    assert result["output"]["requires_approval"] is True
    agent._notify_socias.assert_called_with("SKU", "new_product")

@pytest.mark.asyncio
async def test_discontinuar_notify_socias(agent):
    result = await agent.run({"sku": "SKU", "trigger": "discontinue"})
    assert result["output"]["requires_approval"] is True
    agent._notify_socias.assert_called_with("SKU", "discontinue")

@pytest.mark.asyncio
async def test_sync_paralelo_3_plataformas(agent):
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    assert "mercadolibre" in result["output"]["platforms_synced"]
    assert "amazon" in result["output"]["platforms_synced"]
    assert "shopify" in result["output"]["platforms_synced"]

@pytest.mark.asyncio
async def test_plataforma_falla_otras_continuan(agent):
    agent.ml_adapter.create_item = AsyncMock(side_effect=Exception("Timeout"))
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    assert "amazon" in result["output"]["platforms_synced"]
    assert "shopify" in result["output"]["platforms_synced"]
    assert "mercadolibre" in result["output"]["skipped"]

@pytest.mark.asyncio
async def test_fuente_verdad_supabase_no_payload(agent):
    data = {"sku": "SKU", "trigger": "manual_sync", "fake_data": "hacked"}
    await agent.run(data)
    agent._query_product.assert_called_with("SKU")

@pytest.mark.asyncio
async def test_sync_log_registrado(agent):
    await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    agent._insert_log.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_products(mock_supabase):
    agent = CatalogSyncAgent("tenant-X", mock_supabase)
    agent._insert_log = AsyncMock()
    agent.ml_adapter.update_item = AsyncMock()
    agent.amazon_adapter.update_inventory = AsyncMock()
    agent.shopify_adapter.update_product = AsyncMock()
    
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(return_value=MagicMock(data={"sku": "SKU", "image_url": "i", "description": "d", "sat_key": "s"}))
    await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.assert_called_with("sku", "SKU")
    # Verify tenant isolation query
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "tenant-X")

@pytest.mark.asyncio
async def test_cambio_categoria_notify(agent):
    result = await agent.run({"sku": "SKU", "trigger": "product_updated", "changes": {"category_changed": True}})
    assert result["output"]["requires_approval"] is True

@pytest.mark.asyncio
async def test_sin_clave_sat_error_registrado(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "image_url": "img", "description": "desc"})
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    assert "missing_sat_key" in result["output"]["errors"]

@pytest.mark.asyncio
async def test_mock_mode_adapters(agent):
    result = await agent.run({"sku": "SKU", "trigger": "manual_sync"})
    # ML Adapter mock stubs called
    agent.ml_adapter.create_item.assert_called()

# ── H2 ──

@pytest.mark.asyncio
async def test_sku_y_trigger_requeridos(agent):
    """Sin sku o trigger debe fallar con ValueError."""
    res = await agent.run({"trigger": "manual_sync"})  # falta sku
    assert res["status"] == "failed"

@pytest.mark.asyncio
async def test_producto_no_encontrado_retorna_error(agent):
    """Producto no encontrado retorna status error, no lanza excepción."""
    agent._query_product = AsyncMock(return_value=None)
    result = await agent.run({"sku": "INEXISTENTE", "trigger": "manual_sync"})
    assert result["status"] == "success"
    assert result["output"]["status"] == "error"
