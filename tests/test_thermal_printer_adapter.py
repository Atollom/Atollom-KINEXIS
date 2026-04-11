# tests/test_thermal_printer_adapter.py
import pytest
import socket
from unittest.mock import AsyncMock, MagicMock, patch
from src.adapters.thermal_printer_adapter import ThermalPrinterAdapter

@pytest.fixture
def mock_db():
    client = MagicMock()
    # Mock para config de impresora
    client.get_tenant_config = AsyncMock(return_value={
        "printer_ip": "192.168.1.100",
        "printer_protocol": "ZPL"
    })
    # Mock para insert en print_queue
    insert_res = MagicMock()
    insert_res.data = [{"id": "job_123"}]
    client.supabase.table().insert().execute = AsyncMock(return_value=insert_res)
    # Mock para select
    client.supabase.table().select().eq().eq().execute = AsyncMock(return_value=MagicMock(data=[]))
    return client

@pytest.fixture
def adapter(mock_db):
    return ThermalPrinterAdapter(tenant_id="tenant-kap", db_client=mock_db)

@pytest.mark.asyncio
async def test_print_job_exitoso_zpl(adapter):
    with patch("socket.create_connection") as mock_conn:
        mock_sock = mock_conn.return_value.__enter__.return_value
        result = await adapter.print_label("^XA Test ^XZ", "order_1")
        assert result["success"] is True
        assert mock_sock.sendall.called

@pytest.mark.asyncio
async def test_impresora_offline_retorna_job_queued(adapter, mock_db):
    with patch("socket.create_connection", side_effect=socket.timeout):
        result = await adapter.print_label("^XA Test ^XZ", "order_1")
        assert result["success"] is False
        assert result["job_queued"] is True
        assert mock_db.supabase.table().insert().execute.called

@pytest.mark.asyncio
async def test_timeout_10s_no_bloquea_flujo(adapter):
    with patch("socket.create_connection", side_effect=socket.timeout):
        # El método debe manejar el timeout internamente y retornar job_queued
        result = await adapter.print_label("^XA", "o1")
        assert result["job_queued"] is True

@pytest.mark.asyncio
async def test_queue_job_guardado_en_supabase(adapter, mock_db):
    job_id = await adapter.queue_job("^XA", "o1")
    assert job_id == "job_123"
    assert mock_db.supabase.table().insert.called

@pytest.mark.asyncio
async def test_tenant_isolation_queue(adapter, mock_db):
    await adapter.queue_job("^XA", "o1")
    # Verificar que el insert lleva el tenant_id correcto
    args, kwargs = mock_db.supabase.table().insert.call_args
    assert args[0]["tenant_id"] == "tenant-kap"

@pytest.mark.asyncio
async def test_test_connection_impresora_online(adapter):
    with patch("socket.create_connection"):
        assert await adapter.test_connection() is True

@pytest.mark.asyncio
async def test_test_connection_impresora_offline(adapter):
    with patch("socket.create_connection", side_effect=Exception()):
        assert await adapter.test_connection() is False

def test_zpl_generado_con_campos_correctos(adapter):
    order_data = {
        "tracking_number": "TRK123",
        "external_id": "ML456",
        "product_name": "Pinzas de Precisión",
        "shipping_address": "Calle Falsa 123"
    }
    zpl = adapter.generate_zpl(order_data)
    assert "TRK123" in zpl
    assert "ML456" in zpl
    assert "Pinzas de Precisi" in zpl # Truncado
    assert "^XA" in zpl and "^XZ" in zpl

# ── H2 ──

@pytest.mark.asyncio
async def test_print_label_sin_ip_encola_job(mock_db):
    mock_db.get_tenant_config = AsyncMock(return_value={"printer_protocol": "ZPL"})  # no printer_ip
    adapter = ThermalPrinterAdapter(tenant_id="tenant-kap", db_client=mock_db)
    result = await adapter.print_label("^XA^XZ", "order_no_ip")
    assert result["success"] is False
    assert result["job_queued"] is True

@pytest.mark.asyncio
async def test_print_label_connection_refused_encola(adapter):
    with patch("socket.create_connection", side_effect=ConnectionRefusedError):
        result = await adapter.print_label("^XA^XZ", "order_refused")
        assert result["job_queued"] is True

@pytest.mark.asyncio
async def test_get_queue_status_retorna_lista(adapter, mock_db):
    mock_db.supabase.table().select().eq().eq().execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "j1"}, {"id": "j2"}])
    )
    jobs = await adapter.get_queue_status()
    assert isinstance(jobs, list)

@pytest.mark.asyncio
async def test_zpl_escape_caracteres_especiales(adapter):
    # ^ and ~ are ZPL control chars — must be stripped
    order_data = {"tracking_number": "TRK^XZ", "external_id": "~CMD", "product_name": "Ok", "shipping_address": "Calle"}
    zpl = adapter.generate_zpl(order_data)
    # After escape, raw ^ from tracking should not appear as ^XZ sequence
    assert "^XZ" in zpl  # only the closing ^XZ is legitimate
    # The injected ^XZ from tracking_number should be stripped to "TRKXZ"
    assert "TRKXZ" in zpl

def test_zpl_producto_nombre_largo_truncado(adapter):
    order_data = {
        "tracking_number": "TRK1",
        "external_id": "EXT1",
        "product_name": "A" * 100,  # 100 chars → must be truncated to 25
        "shipping_address": "Calle"
    }
    zpl = adapter.generate_zpl(order_data)
    # Product field is max 25 chars
    assert "A" * 25 in zpl
    assert "A" * 26 not in zpl
