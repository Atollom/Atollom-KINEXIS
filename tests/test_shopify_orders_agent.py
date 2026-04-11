# tests/test_shopify_orders_agent.py
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from src.agents.shopify_orders_agent import ShopifyOrdersAgent

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    builder = MagicMock()
    builder.select.return_value = builder
    builder.update.return_value = builder
    builder.insert.return_value = builder
    builder.eq.return_value = builder
    builder.single.return_value = builder
    builder.execute = AsyncMock(return_value=MagicMock(data={"tracking_number": "T1", "tracking_company": "DHL"}))
    mock.table.return_value = builder
    return mock

@pytest.fixture
def agent(mock_supabase):
    return ShopifyOrdersAgent(tenant_id=str(uuid.uuid4()), supabase_client=mock_supabase)

@pytest.mark.asyncio
async def test_hmac_invalido_rechazado(agent):
    data = {"event_type": "order_paid", "x-shopify-hmac-sha256": "wrong", "raw_payload": b"data"}
    agent.shopify_adapter.verify_webhook = AsyncMock(return_value=False)
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["status"] == "failed"

@pytest.mark.asyncio
async def test_order_paid_guarda_status_pending(agent, mock_supabase):
    data = {"event_type": "order_paid", "shopify_order_id": "SH-1", "order_data": {"weight": 1, "dimensions": {"height":1,"width":1,"length":1}}}
    agent.skydrop_adapter.create_shipment = AsyncMock(return_value={"tracking_number": "T1"})
    await agent.run(data)
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_label_created_con_tracking(agent, mock_supabase):
    data = {"event_type": "order_paid", "shopify_order_id": "SH-1", "order_data": {"weight": 1, "dimensions": {"height":1,"width":1,"length":1}}}
    agent.skydrop_adapter.create_shipment = AsyncMock(return_value={"tracking_number": "T-SKY", "carrier": "DHL"})
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["label_created"] is True

@pytest.mark.asyncio
async def test_skydrop_falla_status_pending(agent):
    data = {"event_type": "order_paid", "shopify_order_id": "SH-1", "order_data": {"weight": 1, "dimensions": {"height":1,"width":1,"length":1}}}
    agent.skydrop_adapter.create_shipment = AsyncMock(side_effect=Exception("SkyDrop Down"))
    res = await agent.run(data)
    assert res["status"] == "success"
    assert res["output"]["label_created"] is False
    assert res["output"]["status"] == "pending"

@pytest.mark.asyncio
async def test_fulfillment_tracking_query(agent, mock_supabase):
    data = {"event_type": "fulfillment_request", "shopify_order_id": "SH-1"}
    agent.shopify_adapter.fulfill_order = AsyncMock()
    await agent.run(data)
    mock_supabase.table.return_value.select.assert_called_with("tracking_number, tracking_company")

@pytest.mark.asyncio
async def test_status_shipped_tras_fulfill(agent, mock_supabase):
    data = {"event_type": "fulfillment_request", "shopify_order_id": "SH-1"}
    agent.shopify_adapter.fulfill_order = AsyncMock()
    res = await agent.run(data)
    assert res["output"]["status"] == "shipped"

@pytest.mark.asyncio
async def test_notify_carlos_stub(agent):
    data = {"event_type": "order_paid", "shopify_order_id": "SH-1", "order_data": {"weight": 1, "dimensions": {"height":1,"width":1,"length":1}}}
    # Patch agent.skydrop_adapter.create_shipment to return valid tracking
    agent.skydrop_adapter.create_shipment = AsyncMock(return_value={"tracking_number": "T1"})
    with patch.object(agent, "_notify_carlos", new_callable=AsyncMock) as mock_notif:
        await agent.run(data)
        assert mock_notif.called

@pytest.mark.asyncio
async def test_invalid_event_type(agent):
    res = await agent.run({"event_type": "kill"})
    assert res["status"] == "failed"

# ── H2 ──

@pytest.mark.asyncio
async def test_fulfillment_order_not_found_returns_false(agent, mock_supabase):
    """_process_fulfillment cuando la orden no existe devuelve fulfillment_confirmed=False."""
    data = {"event_type": "fulfillment_request", "shopify_order_id": "SH-99"}
    mock_supabase.table.return_value.select.return_value.eq.return_value\
        .eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)
    res = await agent.run(data)
    assert res["output"]["fulfillment_confirmed"] is False
    assert res["output"]["error"] == "order_not_found"

@pytest.mark.asyncio
async def test_tenant_isolation_fulfillment(agent, mock_supabase):
    """_process_fulfillment siempre filtra por tenant_id (IDOR prevention)."""
    data = {"event_type": "fulfillment_request", "shopify_order_id": "SH-1"}
    agent.shopify_adapter.fulfill_order = AsyncMock()
    await agent.run(data)
    mock_supabase.table.return_value.eq.assert_any_call("tenant_id", agent.tenant_id)
