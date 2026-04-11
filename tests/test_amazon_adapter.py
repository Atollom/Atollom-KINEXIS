# tests/test_amazon_adapter.py
import pytest
import time
import httpx
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from src.adapters.amazon_adapter import AmazonAdapter

@pytest.fixture
def db_mock():
    mock = MagicMock()
    mock.get_vault_secrets = AsyncMock(return_value={
        'amazon_client_id': 'id',
        'amazon_client_secret': 'shh',
        'amazon_refresh_token': 'rt'
    })
    return mock

@pytest.fixture
def adapter(db_mock):
    return AmazonAdapter(tenant_id="t1", db_client=db_mock)

@pytest.mark.asyncio
async def test_mock_mode_detectado(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = AmazonAdapter("t1", db_mock)
    orders = await adapter.get_orders()
    assert adapter.mock_mode is True

@pytest.mark.asyncio
async def test_get_access_token_cached(adapter):
    adapter._TOKEN_CACHE["t1"] = {"token": "cached", "expires": time.time() + 100}
    token = await adapter.get_access_token()
    assert token == "cached"

@pytest.mark.asyncio
async def test_get_access_token_refresca(adapter):
    adapter._TOKEN_CACHE["t1"] = {"token": "old", "expires": time.time() - 10}
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"access_token": "new", "expires_in": 3600})
        token = await adapter.get_access_token()
        assert token == "new"

@pytest.mark.asyncio
async def test_get_orders_returns_list(adapter):
    adapter.get_access_token = AsyncMock(return_value="tk")
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {"payload": {"Orders": [1,2]}})
        orders = await adapter.get_orders()
        assert len(orders) == 2

@pytest.mark.asyncio
async def test_get_order_items_returns_list(adapter):
    adapter.get_access_token = AsyncMock(return_value="tk")
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {"payload": {"OrderItems": [1]}})
        items = await adapter.get_order_items("oid")
        assert len(items) == 1

@pytest.mark.asyncio
async def test_confirm_shipment_success(adapter):
    adapter.get_access_token = AsyncMock(return_value="tk")
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"status": "ok"})
        res = await adapter.confirm_shipment("oid", "trk", "DHL")
        assert res["status"] == "success"

@pytest.mark.asyncio
async def test_update_inventory_listings_success(adapter):
    adapter.get_access_token = AsyncMock(return_value="tk")
    with patch("httpx.AsyncClient.patch") as mock_patch:
        mock_patch.return_value = MagicMock(status_code=200)
        res = await adapter.update_inventory("sku", 10)
        assert res["method"] == "listings_api"

@pytest.mark.asyncio
async def test_update_inventory_fallback(adapter):
    adapter.get_access_token = AsyncMock(return_value="tk")
    with patch("httpx.AsyncClient.patch") as mock_patch:
        mock_patch.return_value = MagicMock(status_code=400)
        res = await adapter.update_inventory("sku", 10)
        assert res["method"] == "feeds_api"

@pytest.mark.asyncio
async def test_get_access_token_retry(adapter):
    adapter._TOKEN_CACHE = {}
    with patch("httpx.AsyncClient.post") as mock_post:
        # Side effect returns a COROUTINE for the MagicMock if needed, 
        # but here we mock the object returned by post().
        mock_post.side_effect = [
            Exception("Fail 1"),
            MagicMock(status_code=200, json=lambda: {"access_token": "ok", "expires_in": 3600})
        ]
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            token = await adapter.get_access_token()
            assert token == "ok"
            assert mock_sleep.called

@pytest.mark.asyncio
async def test_confirm_shipment_carrier_invalid_raises(adapter):
    with pytest.raises(ValueError, match="whitelist"):
        await adapter.confirm_shipment("oid", "trk", "INVALID")

@pytest.mark.asyncio
async def test_update_inventory_qty_negative_raises(adapter):
    with pytest.raises(ValueError, match="negativa"):
        await adapter.update_inventory("sku", -1)

# ── H2 ──

@pytest.mark.asyncio
async def test_get_reviews_raises_not_implemented(adapter):
    """get_reviews() debe lanzar NotImplementedError cuando no está en MOCK_MODE."""
    with pytest.raises(NotImplementedError):
        await adapter.get_reviews("B0001234")

@pytest.mark.asyncio
async def test_create_inbound_shipment_mock_returns_shipment_id(db_mock):
    """create_inbound_shipment() en MOCK_MODE retorna un dict con shipment_id."""
    db_mock.get_vault_secrets.return_value = {}
    adapter = AmazonAdapter("t1", db_mock)
    adapter.mock_mode = True
    res = await adapter.create_inbound_shipment("SKU-A", 50)
    assert "shipment_id" in res
    assert res["status"] == "planned"
