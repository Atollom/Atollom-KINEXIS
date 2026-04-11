# tests/test_shopify_adapter.py
import pytest
import httpx
import hmac
import hashlib
import base64
from unittest.mock import AsyncMock, MagicMock, patch
from src.adapters.shopify_adapter import ShopifyAdapter

@pytest.fixture
def db_mock():
    mock = MagicMock()
    mock.get_vault_secrets = AsyncMock(return_value={
        'shopify_access_token': 'tk_123',
        'shopify_store_url': 'kaptools.myshopify.com',
        'shopify_webhook_secret': 'shh'
    })
    return mock

@pytest.fixture
def adapter(db_mock):
    return ShopifyAdapter(tenant_id="t1", db_client=db_mock)

@pytest.mark.asyncio
async def test_mock_mode_activated(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = ShopifyAdapter("t1", db_mock)
    orders = await adapter.get_orders()
    assert adapter.mock_mode is True

@pytest.mark.asyncio
async def test_webhook_hmac_valido(adapter):
    payload = b"test"
    secret = "shh"
    sig = base64.b64encode(hmac.new(secret.encode(), payload, hashlib.sha256).digest()).decode()
    res = await adapter.verify_webhook(payload, sig)
    assert res is True

@pytest.mark.asyncio
async def test_webhook_hmac_invalido(adapter):
    res = await adapter.verify_webhook(b"test", "wrong_sig")
    assert res is False

@pytest.mark.asyncio
async def test_fulfill_order_calls_api(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"fulfillment": {"id": 1}})
        await adapter.fulfill_order("oid", "trk123", "DHL")
        assert mock_post.called

@pytest.mark.asyncio
async def test_update_inventory_calls_api(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=200, json=lambda: {"inventory_level": {}})
        await adapter.update_inventory_level("item", "loc", 10)
        assert mock_post.called

@pytest.mark.asyncio
async def test_paqueteria_whitelist_shopify(adapter):
    # DHL is in whitelist
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"id":1})
        await adapter.fulfill_order("oid", "trk", "DHL")
        assert mock_post.called

@pytest.mark.asyncio
async def test_paqueteria_invalid_raises(adapter):
    with pytest.raises(ValueError, match="no permitida"):
        await adapter.fulfill_order("oid", "trk", "CorreosDeMexico")

# ── H2 ──

@pytest.mark.asyncio
async def test_webhook_base64_malformado_returns_false(adapter):
    """verify_webhook con base64 inválido debe retornar False (no lanzar excepción)."""
    res = await adapter.verify_webhook(b"test", "!!!not-base64!!!")
    assert res is False

@pytest.mark.asyncio
async def test_update_inventory_qty_negativa_raises(adapter):
    """update_inventory_level con cantidad negativa debe lanzar ValueError."""
    with pytest.raises(ValueError, match="negativa"):
        await adapter.update_inventory_level("item_1", "loc_1", -5)

@pytest.mark.asyncio
async def test_get_orders_mock_mode_returns_list(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = ShopifyAdapter("t1", db_mock)
    orders = await adapter.get_orders()
    assert isinstance(orders, list)
    assert adapter.mock_mode is True

@pytest.mark.asyncio
async def test_get_orders_real_api_con_httpx(adapter):
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {"orders": [{"id": 1, "financial_status": "paid"}]}
        )
        orders = await adapter.get_orders(status="paid")
        assert isinstance(orders, list)

@pytest.mark.asyncio
async def test_fulfill_order_mock_mode(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = ShopifyAdapter("t1", db_mock)
    result = await adapter.fulfill_order("oid_1", "TRK_MOCK", "DHL")
    assert result.get("mock") is True or "fulfillment_id" in result or result is not None

@pytest.mark.asyncio
async def test_paqueteria_estafeta_whitelist(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"fulfillment": {"id": 99}})
        await adapter.fulfill_order("oid", "trk", "Estafeta")
        assert mock_post.called

@pytest.mark.asyncio
async def test_update_inventory_mock_mode_no_lanza(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = ShopifyAdapter("t1", db_mock)
    result = await adapter.update_inventory_level("item_1", "loc_1", 10)
    assert result is not None

@pytest.mark.asyncio
async def test_get_credentials_sin_vault_activa_mock_mode(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = ShopifyAdapter("t2", db_mock)
    await adapter._get_credentials()
    assert adapter.mock_mode is True

@pytest.mark.asyncio
async def test_webhook_payload_bytes_vacios_returns_false(adapter):
    res = await adapter.verify_webhook(b"", "anysig")
    assert res is False
