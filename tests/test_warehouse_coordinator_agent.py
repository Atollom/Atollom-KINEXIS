import pytest
import datetime
from unittest.mock import AsyncMock, MagicMock
from src.agents.warehouse_coordinator_agent import WarehouseCoordinatorAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = WarehouseCoordinatorAgent("t1", mock_supabase)
    
    # Mocking _get_now to 7:45 AM Mexican time, on a Monday.
    now_mock = MagicMock()
    now_mock.hour = 7
    now_mock.minute = 45
    now_mock.isoweekday.return_value = 1 # Monday
    agent._get_now = MagicMock(return_value=now_mock)
    
    agent._query_tenant_config = AsyncMock(return_value={"business_hours": {"days": [1,2,3,4,5]}})
    agent.thermal_printer.print_label = AsyncMock(return_value={"success": True})
    
    agent._get_priority_orders = AsyncMock(return_value=[
        {"id": "o1", "platform": "mercadolibre"},
        {"id": "o2", "platform": "amazon", "same_day": True},
        {"id": "o3", "platform": "amazon", "same_day": False},
        {"id": "o4", "platform": "shopify"}
    ])
    
    return agent

@pytest.mark.asyncio
async def test_morning_briefing_745am_cdmx(agent):
    result = await agent.run({"trigger": "morning_cron"})
    assert result["output"]["whatsapp_sent"] is True

@pytest.mark.asyncio
async def test_picklist_orden_prioridad_ml_primero(agent, mock_supabase):
    # Unmock _get_priority_orders to test actual logic
    agent._get_priority_orders = WarehouseCoordinatorAgent._get_priority_orders.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"id": "o3", "platform": "shopify"},
            {"id": "o2", "platform": "amazon"},
            {"id": "o1", "platform": "mercadolibre"}
        ])
    )
    result = await agent.run({"trigger": "carlos_action", "action": "request_tasklist"})
    tasks = result["output"]["task_list"]
    assert tasks[0]["platform"] == "mercadolibre"
    assert tasks[-1]["platform"] == "shopify"

@pytest.mark.asyncio
async def test_orden_no_enviada_sin_confirmacion_carlos(agent, mock_supabase):
    agent._update_order_status = AsyncMock()
    # If order_confirmed is triggered, we don't update to shipped
    await agent.run({"trigger": "order_confirmed", "order_ids": ["123"]})
    agent._update_order_status.assert_not_called()

@pytest.mark.asyncio
async def test_impresora_falla_job_en_cola_continua(agent):
    agent.thermal_printer.print_label = AsyncMock(return_value={"success": False, "job_queued": True})
    result = await agent.run({"trigger": "carlos_action", "action": "print_label", "order_ids": ["123"]})
    assert result["output"]["print_job_sent"] is True

@pytest.mark.asyncio
async def test_whatsapp_carlos_enviado_745am(agent):
    result = await agent.run({"trigger": "morning_cron"})
    assert result["output"]["whatsapp_sent"] is True

@pytest.mark.asyncio
async def test_receipt_dispara_inventory_agent(agent):
    result = await agent.run({"trigger": "receipt_scan"})
    assert result["output"]["inventory_updated"] is True

@pytest.mark.asyncio
async def test_confirm_picked_filtra_tenant_id(agent):
    agent._query_order = AsyncMock(return_value={"id": "O-123", "tenant_id": "t1"})
    agent._update_order_status = AsyncMock()
    await agent.run({"trigger": "carlos_action", "action": "confirm_picked", "order_ids": ["O-123"]})
    agent._update_order_status.assert_called_with("O-123", "shipped")

@pytest.mark.asyncio
async def test_solo_ordenes_del_dia_en_tasklist(agent):
    result = await agent.run({"trigger": "morning_cron"})
    tasks = result["output"]["task_list"]
    assert len(tasks) == 4

@pytest.mark.asyncio
async def test_dias_habiles_de_tenant_config(agent):
    agent._query_tenant_config = AsyncMock(return_value={"business_hours": {"days": [1,2,3,4]}})
    # Let's say today is Friday (5)
    agent._get_now.return_value.isoweekday.return_value = 5
    result = await agent.run({"trigger": "morning_cron"})
    assert result["output"]["whatsapp_sent"] is False

@pytest.mark.asyncio
async def test_tenant_isolation_orders_query(mock_supabase):
    agent = WarehouseCoordinatorAgent("TENANT_X", mock_supabase)
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute = AsyncMock()
    await agent.run({"trigger": "carlos_action", "action": "request_tasklist"})
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "TENANT_X")

@pytest.mark.asyncio
async def test_mock_mode_thermal_printer(agent):
    await agent.run({"trigger": "carlos_action", "action": "print_label", "order_ids": ["1"]})
    agent.thermal_printer.print_label.assert_called()

@pytest.mark.asyncio
async def test_carlos_no_ve_ordenes_otros_tenants(agent):
    agent._query_order = AsyncMock(return_value=None)
    agent._update_order_status = AsyncMock()
    await agent.run({"trigger": "carlos_action", "action": "confirm_picked", "order_ids": ["HACKED-ORDER"]})
    agent._update_order_status.assert_not_called()

# ── H2 ──

@pytest.mark.asyncio
async def test_trigger_requerido(agent):
    """Sin trigger debe fallar con ValueError."""
    res = await agent.run({})
    assert res["status"] == "failed"

@pytest.mark.asyncio
async def test_carlos_action_sin_action_falla(agent):
    """carlos_action sin 'action' debe fallar con ValueError."""
    res = await agent.run({"trigger": "carlos_action"})
    assert res["status"] == "failed"
    assert "action" in res["error"]
