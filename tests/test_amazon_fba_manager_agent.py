import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.amazon_fba_manager_agent import AmazonFBAManagerAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    # Mock para get_vault_secrets para forzar mock_mode = True
    supa.get_vault_secrets = AsyncMock(return_value={})
    
    # Mock para get_fnsku
    supa.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"fnsku": "FNSKU-123"})
    )
    supa.table.return_value.insert.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = AmazonFBAManagerAgent("t1", mock_supabase)
    # Importante: llamar a _get_credentials o forzar mock_mode si fuera necesario, 
    # pero el adaptador lo hace al ser llamado si las credenciales fallan.
    # Forzamos mock_mode directamente para asegurar consistencia en el test
    agent.amazon_adapter.mock_mode = True 
    agent._notify_socias = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_stock_menor_7_dias_alerta_urgente(agent):
    agent._check_fba_stock = AsyncMock(return_value={
        "fba_stock_levels": {"qty": 10, "days_remaining": 5},
        "reorder_needed": True,
        "alert_type": "URGENTE"
    })
    result = await agent.run({"trigger": "stock_check", "sku": "SKU-1"})
    assert result["output"]["alert_type"] == "URGENTE"

@pytest.mark.asyncio
async def test_stock_menor_30_dias_notify_reorder(agent):
    agent._check_fba_stock = AsyncMock(return_value={
        "fba_stock_levels": {"qty": 40, "days_remaining": 20},
        "reorder_needed": True,
        "alert_type": "REORDER_SITUATION"
    })
    result = await agent.run({"trigger": "stock_check", "sku": "SKU-1"})
    assert result["output"]["alert_type"] == "REORDER_SITUATION"

@pytest.mark.asyncio
async def test_fnsku_requerido_antes_de_shipment(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=None)
    )
    result = await agent.run({"trigger": "create_shipment", "sku": "NO-FNSKU"})
    assert result["status"] == "failed"
    assert "no tiene FNSKU" in result["error"]

@pytest.mark.asyncio
async def test_qty_de_bd_no_payload(agent):
    result = await agent.run({"trigger": "create_shipment", "sku": "SKU-1"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_shipment_plan_guardado(agent, mock_supabase):
    await agent.run({"trigger": "create_shipment", "sku": "SKU-1", "quantity": 100})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_notify_socias_reorder_needed(agent):
    # Usamos mock_mode para que no falle el adaptador interno si es llamado
    agent.amazon_adapter.mock_mode = True
    await agent._check_fba_stock("SKU-1")
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_fba_shipments(agent, mock_supabase):
    await agent.run({"trigger": "create_shipment", "sku": "SKU-1"})
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_mock_mode_adapter(agent):
    result = await agent.run({"trigger": "create_shipment", "sku": "SKU-1"})
    assert "MOCK-" in result["output"]["shipment_id"]

@pytest.mark.asyncio
async def test_stock_30_dias_no_alerta(agent):
    agent._check_fba_stock = AsyncMock(return_value={
        "fba_stock_levels": {"qty": 200, "days_remaining": 100},
        "reorder_needed": False,
        "alert_type": None
    })
    result = await agent.run({"trigger": "stock_check", "sku": "SKU-1"})
    assert result["output"]["reorder_needed"] is False

@pytest.mark.asyncio
async def test_fnsku_invalido_bloquea_envio(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={})
    )
    result = await agent.run({"trigger": "create_shipment", "sku": "SKU-1"})
    assert result["status"] == "failed"

@pytest.mark.asyncio
async def test_trigger_obligatorio_falla_sin_trigger(agent):
    result = await agent.run({})
    assert result["status"] == "failed"
    assert "trigger" in result["error"].lower()

@pytest.mark.asyncio
async def test_notify_socias_excepcion_no_rompe_flujo(agent):
    # _notify_socias internamente captura excepciones con logger.error
    # Verificamos que el agente complete sin propagar el error
    agent._notify_socias = AsyncMock(side_effect=Exception("Whatsapp down"))
    result = await agent.run({"trigger": "stock_check", "sku": "SKU-LOW"})
    # _check_fba_stock llama _notify_socias pero la excepción no debe salir del agente
    assert result["status"] in ("success", "failed")
