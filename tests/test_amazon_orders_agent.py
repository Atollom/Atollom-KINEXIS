# tests/test_amazon_orders_agent.py
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from src.agents.amazon_orders_agent import AmazonOrdersAgent

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    # Chaining logic: table().select().eq().eq().single().execute()
    builder = MagicMock()
    builder.select.return_value = builder
    builder.update.return_value = builder
    builder.insert.return_value = builder
    builder.delete.return_value = builder
    builder.eq.return_value = builder
    builder.neq.return_value = builder
    builder.gte.return_value = builder
    builder.lte.return_value = builder
    builder.single.return_value = builder
    builder.limit.return_value = builder
    # The final step is always execute() which is awaited
    builder.execute = AsyncMock(return_value=MagicMock(data={"tracking_number": "TRK1", "carrier": "DHL"}))
    
    mock.table.return_value = builder
    return mock

@pytest.fixture
def agent(mock_supabase):
    return AmazonOrdersAgent(tenant_id=str(uuid.uuid4()), supabase_client=mock_supabase)

@pytest.mark.asyncio
async def test_hmac_invalido_rechazado_sin_procesar(agent):
    data = {"event_type": "new_order", "x-amz-signature": "wrong", "raw_payload": b"data"}
    agent.get_vault_secrets = AsyncMock(return_value={"amazon_webhook_secret": "shh"})
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["status"] == "failed"

@pytest.mark.asyncio
async def test_new_order_guardada_status_pending(agent, mock_supabase):
    data = {"event_type": "new_order", "amazon_order_id": "AM-1"}
    agent.amazon_adapter.get_order_items = AsyncMock(return_value=[])
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["order_processed"] is True
    assert res["output"]["status"] == "pending"

@pytest.mark.asyncio
async def test_orden_duplicada_ignorada_gracefully(agent, mock_supabase):
    data = {"event_type": "new_order", "amazon_order_id": "AM-1"}
    agent.amazon_adapter.get_order_items = AsyncMock(return_value=[])
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("duplicate key")
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["order_processed"] is True
    assert res["output"]["note"] == "duplicate_ignored"

@pytest.mark.asyncio
async def test_sync_tracking_calls_adapter(agent, mock_supabase):
    data = {"event_type": "sync_tracking", "amazon_order_id": "AM-1"}
    agent.amazon_adapter.confirm_shipment = AsyncMock()
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["tracking_confirmed"] is True
    agent.amazon_adapter.confirm_shipment.assert_called()

@pytest.mark.asyncio
async def test_tracking_none_returns_confirmed_false(agent, mock_supabase):
    data = {"event_type": "sync_tracking", "amazon_order_id": "AM-1"}
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data={"tracking_number": None})
    res = await agent.run(data)
    assert res["output"]["tracking_confirmed"] is False

@pytest.mark.asyncio
async def test_status_shipped_tras_sync(agent, mock_supabase):
    data = {"event_type": "sync_tracking", "amazon_order_id": "AM-1"}
    agent.amazon_adapter.confirm_shipment = AsyncMock()
    res = await agent.run(data)
    assert res["output"]["status"] == "shipped"

@pytest.mark.asyncio
async def test_same_day_check_alerts(agent, mock_supabase):
    data = {"event_type": "same_day_check"}
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value = MagicMock(data=[{"amazon_order_id": "SD-1"}])
    with patch.object(agent, "_alert_carlos", new_callable=AsyncMock) as mock_alert:
        res = await agent.run(data)
        assert res["output"]["same_day_alert"] is True
        mock_alert.assert_called()

@pytest.mark.asyncio
async def test_invalid_event_type_fails(agent):
    res = await agent.run({"event_type": "unknown"})
    assert res["status"] == "failed"
    assert "event_type desconocido" in res["error"]

@pytest.mark.asyncio
async def test_tenant_isolation_enforced(agent, mock_supabase):
    data = {"event_type": "sync_tracking", "amazon_order_id": "AM-1"}
    await agent.run(data)
    # Check that tenant_id filter was used in some chain
    # Note: .eq() is called multiple times, we just verify any call has tenant_id
    mock_supabase.table.return_value.eq.assert_any_call("tenant_id", agent.tenant_id)

# ── H2 ──

@pytest.mark.asyncio
async def test_missing_amazon_order_id_raises(agent):
    """_process_new_order sin amazon_order_id debe fallar con ValueError."""
    res = await agent.run({"event_type": "new_order", "amazon_order_id": None})
    assert res["status"] == "failed"
    assert "requerido" in res["error"]

@pytest.mark.asyncio
async def test_same_day_check_sin_ordenes_no_alerta(agent, mock_supabase):
    """_check_same_day sin órdenes same-day devuelve same_day_alert=False."""
    data = {"event_type": "same_day_check"}
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .eq.return_value.eq.return_value.gte.return_value.execute.return_value = MagicMock(data=[])
    with patch.object(agent, "_alert_carlos", new_callable=AsyncMock) as mock_alert:
        res = await agent.run(data)
        assert res["output"]["same_day_alert"] is False
        mock_alert.assert_not_called()
