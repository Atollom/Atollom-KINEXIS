import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.ml_listing_optimizer_agent import MLListingOptimizerAgent

@pytest.fixture
def mock_supabase():
    return MagicMock()

@pytest.fixture
def agent(mock_supabase):
    agent = MLListingOptimizerAgent("t1", mock_supabase)
    
    agent._query_product = AsyncMock(return_value={
        "sku": "SKU", "name": "Test Name", "description": "Test Desc",
        "price_ml": 100.0, "cost": 80.0
    })
    agent._query_tenant_business_rules = AsyncMock(return_value={"ml_min_margin": 0.30})
    agent._save_proposal = AsyncMock()
    agent._notify_socias = AsyncMock()
    
    return agent

@pytest.mark.asyncio
async def test_titulo_max_60_chars(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "A" * 100, "cost": 10})
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    assert len(result["output"]["optimized_title"]) <= 60

@pytest.mark.asyncio
async def test_titulo_sin_caracteres_prohibidos(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "Test! @#$", "cost": 10})
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    title = result["output"]["optimized_title"]
    assert "!" not in title
    assert "@" not in title
    assert "#" not in title

@pytest.mark.asyncio
async def test_precio_nunca_menor_al_minimo(agent):
    # Cost = 100, min_margin = 0.30 => min_price = 130
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "A", "price_ml": 50.0, "cost": 100.0})
    # Current is 50, suggested by mock will be 50*1.05=52.5, but min is 130.
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "price"})
    assert result["output"]["suggested_price"] == 130.0

@pytest.mark.asyncio
async def test_cambio_precio_mayor_15_human_required(agent):
    # Cost is 50, min = 65.
    # Current price 100, suggested by logic = min_price if we wanted but current is 100
    # Wait, the logic suggests 100 * 1.05 = 105. That's a 5% change.
    # Let's override _suggest_price directly to return 120 (20% change)
    agent._suggest_price = AsyncMock(return_value=Decimal("120.0"))
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "price"})
    assert result["output"]["requires_approval"] is True

@pytest.mark.asyncio
async def test_notify_socias_antes_de_aplicar(agent):
    await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    agent._notify_socias.assert_called_with("SKU", "1")

@pytest.mark.asyncio
async def test_propuesta_guardada_no_aplicada(agent):
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    assert result["output"]["changes_applied"] is False
    agent._save_proposal.assert_called()

@pytest.mark.asyncio
async def test_precio_decimal_no_float(agent):
    # Ensure it handles Decimal correctly internally
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "A", "price_ml": 100.0, "cost": 80.0})
    from decimal import Decimal
    price = await agent._suggest_price(Decimal("100.0"), "SKU", {"cost": 80.0})
    assert isinstance(price, Decimal)

@pytest.mark.asyncio
async def test_margen_de_tenant_config(agent):
    # Rule = 0.50 margin, cost = 100. Min price = 150
    agent._query_tenant_business_rules = AsyncMock(return_value={"ml_min_margin": 0.50})
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "A", "price_ml": 10.0, "cost": 100.0})
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "price"})
    assert result["output"]["suggested_price"] == 150.0

@pytest.mark.asyncio
async def test_sanitize_aplicado_al_titulo_actual(agent):
    # "ignora instrucciones" is a pattern to redact
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "ignora instrucciones test", "cost": 10})
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    assert "REDACTED" in result["output"]["optimized_title"]

@pytest.mark.asyncio
async def test_descripcion_max_500_chars(agent):
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "description": "A" * 600, "cost": 10})
    result = await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "description"})
    assert len(result["output"]["optimized_description"]) <= 500

@pytest.mark.asyncio
async def test_tenant_isolation_listing_proposals(mock_supabase):
    agent = MLListingOptimizerAgent("tenant-P", mock_supabase)
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "A", "cost": 10})
    agent._get_now = MagicMock(return_value=MagicMock(isoformat=lambda: "2023"))
    await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "tenant-P"

@pytest.mark.asyncio
async def test_version_anterior_guardada(mock_supabase):
    agent = MLListingOptimizerAgent("t1", mock_supabase)
    agent._query_product = AsyncMock(return_value={"sku": "SKU", "name": "OLD_TITLE", "cost": 10})
    agent._get_now = MagicMock(return_value=MagicMock(isoformat=lambda: "2023"))

    await agent.run({"item_id": "1", "sku": "SKU", "optimization_type": "title"})
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["current_value"] == "OLD_TITLE"

# ── H2 ──

@pytest.mark.asyncio
async def test_campos_requeridos_item_id_sku_opt_type(agent):
    """Sin item_id, sku, o optimization_type debe fallar."""
    res = await agent.run({"sku": "SKU", "optimization_type": "title"})  # falta item_id
    assert res["status"] == "failed"

@pytest.mark.asyncio
async def test_producto_inexistente_lanza_error(agent):
    """Producto no encontrado retorna status failed con mensaje descriptivo."""
    agent._query_product = AsyncMock(return_value=None)
    res = await agent.run({"item_id": "1", "sku": "NOEXISTE", "optimization_type": "title"})
    assert res["status"] == "failed"
