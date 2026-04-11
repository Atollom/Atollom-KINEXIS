# tests/test_price_sync_agent.py
import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from src.agents.price_sync_agent import PriceSyncAgent

@pytest.fixture
def mock_supabase():
    return MagicMock()

@pytest.fixture
def agent(mock_supabase):
    agent = PriceSyncAgent("t1", mock_supabase)
    
    # Defaults for mocked DB methods
    inv_data = {"price_ml": 100.0, "ml_item_id": "ML-123", "shopify_variant_id": "V-123"}
    def mock_query_inventory(field, sku):
        m = MagicMock()
        m.data = {field: inv_data.get(field, 0)}
        return m
    agent._query_inventory_field = AsyncMock(side_effect=mock_query_inventory)
    
    rules_data = {"ml_min_margin": 0.30, "amazon_min_margin": 0.25, "shopify_min_margin": 0.20}
    mock_rules = MagicMock()
    mock_rules.data = rules_data
    agent._query_tenant_business_rules = AsyncMock(return_value=mock_rules)
    
    agent._update_inventory_prices = AsyncMock(return_value=MagicMock())
    agent._insert_price_history = AsyncMock(return_value=MagicMock())
    
    return agent

@pytest.mark.asyncio
async def test_precio_decimal_no_float(agent):
    # Mock adapters
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    agent.amazon_adapter.update_inventory = AsyncMock(return_value={})
    
    data = {"sku": "KTO-123", "new_cost": 100.0} # Cost 100
    result = await agent.run(data)
    
    # ML price should be 100 * 1.3 = 130
    assert result["output"]["prices_updated"]["mercadolibre"] == 130.0
    # Verificamos que se pasó Decimal internamente
    args, _ = agent.ml_adapter.update_price.call_args
    assert isinstance(args[1], Decimal)

@pytest.mark.asyncio
async def test_margen_de_tenant_config_no_hardcodeado(agent):
    # Mock margen específico de 50% para ML
    mock_rules = MagicMock()
    mock_rules.data = {"ml_min_margin": 0.50, "amazon_min_margin": 0.25, "shopify_min_margin": 0.20}
    agent._query_tenant_business_rules = AsyncMock(return_value=mock_rules)
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    
    data = {"sku": "KTO-123", "new_cost": 100}
    result = await agent.run(data)
    assert result["output"]["prices_updated"]["mercadolibre"] == 150.0

@pytest.mark.asyncio
async def test_precio_ml_minimo_correcto(agent):
    # Cost 10, margin 0.30 -> 13.0
    price = await agent._calculate_price(Decimal("10.0"), "mercadolibre")
    assert price == Decimal("13.00")

@pytest.mark.asyncio
async def test_precio_amazon_minimo_correcto(agent):
    # Cost 10, margin 0.25 -> 12.5
    price = await agent._calculate_price(Decimal("10.0"), "amazon")
    assert price == Decimal("12.50")

@pytest.mark.asyncio
async def test_precio_shopify_minimo_correcto(agent):
    # Cost 10, margin 0.20 -> 12.0
    price = await agent._calculate_price(Decimal("10.0"), "shopify")
    assert price == Decimal("12.00")

@pytest.mark.asyncio
async def test_cambio_mayor_15_notify_socias(agent):
    # Old price 100. New cost 200 -> New price 260. Change > 15%
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    agent.meta_adapter.send_whatsapp = AsyncMock(return_value=True)
    
    data = {"sku": "KTO-123", "new_cost": 200}
    with patch.object(agent, '_notify_socias_price_change', wraps=agent._notify_socias_price_change) as mock_notify:
        await agent.run(data)
        mock_notify.assert_called()

@pytest.mark.asyncio
async def test_sync_paralelo_asyncio_gather(agent):
    # Verificamos que se llamen los 3 adapters
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    agent.amazon_adapter.update_inventory = AsyncMock(return_value={})
    
    data = {"sku": "KTO-123", "new_cost": 100}
    result = await agent.run(data)
    assert "mercadolibre" in result["output"]["platforms_synced"]
    assert "amazon" in result["output"]["platforms_synced"]
    assert "shopify" in result["output"]["platforms_synced"]

@pytest.mark.asyncio
async def test_plataforma_falla_otras_continuan(agent):
    # ML falla
    agent.ml_adapter.update_price = AsyncMock(side_effect=Exception("Timeout"))
    agent.ml_adapter.load_credentials = AsyncMock()
    # Amazon y Shopify funcionan
    agent.amazon_adapter.update_inventory = AsyncMock(return_value={})
    
    data = {"sku": "KTO-123", "new_cost": 100}
    result = await agent.run(data)
    
    assert "mercadolibre" in result["output"]["skipped"]
    assert "amazon" in result["output"]["platforms_synced"]
    assert "shopify" in result["output"]["platforms_synced"]

@pytest.mark.asyncio
async def test_historial_guardado_price_history(agent):
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    
    data = {"sku": "KTO-123", "new_cost": 100}
    await agent.run(data)
    # Verificar inserción en price_history
    agent._insert_price_history.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_price_history(mock_supabase):
    agent = PriceSyncAgent("tenant-B", mock_supabase)
    agent._query_inventory_field = AsyncMock(return_value=MagicMock(data={"ml_item_id": "1", "shopify_variant_id": "2", "price_ml": 10}))
    agent._query_tenant_business_rules = AsyncMock(return_value=MagicMock(data={}))
    agent._update_inventory_prices = AsyncMock()
    agent._insert_price_history = AsyncMock()
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    
    await agent.run({"sku": "KTO-123", "new_cost": 100})
    call_args = agent._insert_price_history.call_args[0][0]
    assert call_args["tenant_id"] == "tenant-B"

@pytest.mark.asyncio
async def test_round_half_up_decimal(agent):
    # Cost 10, margin 0.33 -> 13.3
    # Cost 10.123 -> price 13.1599 -> rounding
    res = await agent._calculate_price(Decimal("10.123"), "mercadolibre")
    # 10.123 * 1.3 = 13.1599 -> 13.16
    assert res == Decimal("13.16")

@pytest.mark.asyncio
async def test_notify_best_effort_si_meta_falla(agent):
    agent.ml_adapter.update_price = AsyncMock(return_value={})
    agent.ml_adapter.load_credentials = AsyncMock()
    agent.meta_adapter.send_whatsapp = AsyncMock(side_effect=Exception("Meta Down"))

    # Old price 100, new cost 200 -> change > 15%
    data = {"sku": "KTO-123", "new_cost": 200}
    result = await agent.run(data)
    assert result["status"] == "success" # No falló aunque fallara WhatsApp

# ── H2 ──

@pytest.mark.asyncio
async def test_sku_requerido(agent):
    """Sin SKU debe fallar con ValueError."""
    res = await agent.run({"new_cost": 100})
    assert res["status"] == "failed"
    assert "SKU" in res["error"]

@pytest.mark.asyncio
async def test_costo_cero_o_negativo_rechazado(agent):
    """Costo <= 0 debe fallar con ValueError."""
    res = await agent.run({"sku": "KTO-123", "new_cost": 0})
    assert res["status"] == "failed"
    assert "Costo" in res["error"]
