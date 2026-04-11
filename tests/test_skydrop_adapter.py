# tests/test_skydrop_adapter.py
import pytest
import time
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from src.adapters.skydrop_adapter import SkyDropAdapter

@pytest.fixture
def db_mock():
    mock = MagicMock()
    mock.get_vault_secrets = AsyncMock(return_value={'skydrop_token': 'sk_123'})
    return mock

@pytest.fixture
def adapter(db_mock):
    return SkyDropAdapter(tenant_id="t1", db_client=db_mock)

@pytest.mark.asyncio
async def test_mock_mode_vault_vacio(db_mock):
    db_mock.get_vault_secrets.return_value = {}
    adapter = SkyDropAdapter("t1", db_mock)
    res = await adapter.create_shipment({"weight": 1, "dimensions": {"height": 1, "width": 1, "length": 1}})
    assert adapter.mock_mode is True
    assert "TRACK-SD" in res["tracking_number"]

@pytest.mark.asyncio
async def test_create_shipment_weight_cero_bloqueado(adapter):
    with pytest.raises(ValueError, match="Peso"):
        await adapter.create_shipment({"weight": 0, "dimensions": {"height":1,"width":1,"length":1}})

@pytest.mark.asyncio
async def test_clave_sat_54101700(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"tracking_number": "T1"})
        await adapter.create_shipment({"weight": 1, "dimensions": {"height": 10, "width": 10, "length": 10}})
        assert mock_post.called

@pytest.mark.asyncio
async def test_signed_url_con_expires_7_dias(adapter):
    url = await adapter.get_label_url("ship_123")
    assert "expires=" in url
    import re
    match = re.search(r"expires=(\d+)", url)
    expires_ts = int(match.group(1))
    now_ts = int(time.time())
    diff_days = (expires_ts - now_ts) / (3600 * 24)
    assert 6.5 < diff_days < 7.5

@pytest.mark.asyncio
async def test_paqueteria_whitelist_works(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"tracking_number": "T1"})
        await adapter.create_shipment({"weight": 1, "dimensions": {"height": 10, "width": 10, "length": 10}, "carrier_preference": "DHL"})
        assert mock_post.called

@pytest.mark.asyncio
async def test_paqueteria_invalid_defaults_to_estafeta(adapter):
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_post.return_value = MagicMock(status_code=201, json=lambda: {"tracking_number": "T1"})
        await adapter.create_shipment({"weight": 1, "dimensions": {"height": 10, "width": 10, "length": 10}, "carrier_preference": "INVALID"})
        assert mock_post.called

# ── H2 ──

@pytest.mark.asyncio
async def test_track_shipment_mock_mode(db_mock):
    """track_shipment en MOCK_MODE retorna status in_transit sin llamar la API."""
    db_mock.get_vault_secrets.return_value = {}
    adapter = SkyDropAdapter("t1", db_mock)
    res = await adapter.track_shipment("TRACK-ABC")
    assert res["status"] == "in_transit"
    assert adapter.mock_mode is True

@pytest.mark.asyncio
async def test_create_shipment_dimensiones_invalidas_bloqueado(adapter):
    """create_shipment con dimensiones en cero debe lanzar ValueError."""
    with pytest.raises(ValueError, match="Dimensiones"):
        await adapter.create_shipment({"weight": 1, "dimensions": {"height": 0, "width": 10, "length": 10}})
