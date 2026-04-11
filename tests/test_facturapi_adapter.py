# tests/test_facturapi_adapter.py
import pytest
import httpx
import respx
from unittest.mock import AsyncMock, MagicMock, patch
from src.adapters.facturapi_adapter import FacturapiAdapter, FORMAS_PAGO_VALIDAS, USOS_CFDI_VALIDOS

@pytest.fixture
def mock_db():
    client = MagicMock()
    # Mock Vault para Facturapi
    client.get_vault_secrets = AsyncMock(return_value={"facturapi_key": "sk_test_123"})
    return client

@pytest.fixture
def adapter(mock_db):
    return FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)

# --- AUTENTICACIÓN ---

@pytest.mark.asyncio
async def test_mock_mode_sin_vault_key(mock_db):
    mock_db.get_vault_secrets = AsyncMock(side_effect=Exception("No key"))
    adapter = FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)
    
    # Debe retornar mock UUID sin fallar
    res = await adapter.create_customer("XAXX010101000", "Publico", "e@e.com", "72973", "616")
    assert "cust_mock_" in res["id"]

@pytest.mark.asyncio
async def test_auth_header_basic_correcto(adapter):
    with respx.mock:
        # Facturapi usa Basic Auth: key as user, empty pass
        respx.post("https://www.facturapi.io/v2/customers").respond(200, json={"id": "c1"})
        await adapter.create_customer("KTO2202178K8", "Kap", "c@k.com", "72973", "601")
        
        # Verificar que se envió el header Authorization
        request = respx.calls.last.request
        assert "Authorization" in request.headers
        assert request.headers["Authorization"].startswith("Basic")

# --- RFC VALIDACIÓN ---

@pytest.mark.asyncio
async def test_rfc_invalido_rechazado_antes_de_api(adapter):
    with pytest.raises(ValueError, match="RFC con formato inválido"):
        await adapter.create_customer("INVALID-RFC", "Name", "e@e.com", "12345", "601")

@pytest.mark.asyncio
async def test_rfc_publico_general_xaxx_aceptado(adapter):
    with respx.mock:
        respx.post("https://www.facturapi.io/v2/customers").respond(200, json={"id": "c_gen"})
        res = await adapter.create_customer("XAXX010101000", "Alguna Empresa", "e@e.com", "00000", "601")
        # El adapter debe forzar PUBLICO EN GENERAL y CP KapTools
        payload = respx.calls.last.request.content
        assert b"PUBLICO EN GENERAL" in payload
        assert b"72973" in payload

# --- FACTURA INGRESO ---

@pytest.mark.asyncio
async def test_total_cero_rechazado_antes_de_timbrar(adapter):
    items = [{"description": "Gratis", "product_key": "123", "price": 0, "quantity": 1}]
    with pytest.raises(ValueError, match="mayor a cero"):
        await adapter.create_invoice("cust_1", items, "01")

@pytest.mark.asyncio
async def test_items_vacios_rechados(adapter):
    with pytest.raises(ValueError, match="Lista de productos vacía"):
        await adapter.create_invoice("cust_1", [], "01")

@pytest.mark.asyncio
async def test_kit_desglossado_no_kit_completo(adapter):
    items = [{"sku": "KIT33", "description": "Paquete Herramientas", "price": 1000, "quantity": 1}]
    
    # Mock de componentes en BD
    adapter._get_kit_components_from_db = AsyncMock(return_value=[
        {"name": "Martillo", "sat_key": "10", "price": 500},
        {"name": "Clavos", "sat_key": "20", "price": 500}
    ])
    
    with respx.mock:
        respx.post("https://www.facturapi.io/v2/invoices").respond(200, json={"id": "inv_1"})
        await adapter.create_invoice("cust_1", items, "01")
        
        payload = respx.calls.last.request.content
        assert b"Martillo" in payload
        assert b"Clavos" in payload
        assert b"KIT33" in payload # Aparece en la descripción del componente
        assert b"Paquete Herramientas" not in payload # No se envía el kit original como ítem

@pytest.mark.asyncio
async def test_retry_3_intentos_timeout_sat(adapter):
    items = [{"description": "Item", "product_key": "1", "price": 100, "quantity": 1}]
    with respx.mock:
        # 2 fallos de timeout, 1 éxito
        route = respx.post("https://www.facturapi.io/v2/invoices")
        route.side_effect = [httpx.TimeoutException("SAT timeout"), httpx.TimeoutException("SAT timeout"), httpx.Response(200, json={"id": "i3"})]
        
        res = await adapter.create_invoice("c1", items, "03")
        assert res["id"] == "i3"
        assert route.call_count == 3

@pytest.mark.asyncio
async def test_timeout_45s_en_timbrado(adapter):
    # Verificamos que el adapter usa el timeout extendido configurado
    assert adapter.stamping_timeout.read == 45.0

@pytest.mark.asyncio
async def test_mock_uuid_retornado_sin_vault(mock_db):
    mock_db.get_vault_secrets = AsyncMock(return_value={}) # Sin llaves
    adapter = FacturapiAdapter(tenant_id="t-kap", db_client=mock_db)
    items = [{"description": "i", "product_key": "1", "price": 10, "quantity": 1}]
    
    res = await adapter.create_invoice("c1", items, "01")
    assert "MOCK-UUID" in res["uuid"]
    assert res["status"] == "MOCK_TIMBRADO"

# --- CANCELACIÓN ---

@pytest.mark.asyncio
async def test_motivo_01_requiere_sustitucion_uuid(adapter):
    with pytest.raises(ValueError, match="requiere un sustitucion_uuid"):
        await adapter.cancel_invoice("inv_1", "01")

@pytest.mark.asyncio
async def test_motivo_invalido_rechazado(adapter):
    with pytest.raises(ValueError, match="Motivo de cancelación inválido"):
        await adapter.cancel_invoice("inv_1", "99")

# --- ARCHIVOS ---

@pytest.mark.asyncio
async def test_xml_y_pdf_descargados_en_paralelo(adapter):
    with respx.mock:
        respx.get("https://www.facturapi.io/v2/invoices/inv_1/xml").respond(200, content=b"<xml/>")
        respx.get("https://www.facturapi.io/v2/invoices/inv_1/pdf").respond(200, content=b"%PDF")
        
        res = await adapter.download_files("inv_1")
        assert res["xml"] == b"<xml/>"
        assert res["pdf"] == b"%PDF"

@pytest.mark.asyncio
async def test_download_falla_gracefully(adapter):
    with respx.mock:
        respx.get("https://www.facturapi.io/v2/invoices/inv_1/xml").respond(404)
        with pytest.raises(httpx.HTTPStatusError):
            await adapter.download_files("inv_1")

# --- EXTRA ---

def test_api_key_nunca_en_logs(caplog):
    """
    H2 Security: la API Key de Facturapi nunca debe aparecer en los logs.
    El adapter logea advertencias en mock mode pero nunca el valor de la key.
    """
    import logging
    from src.adapters.facturapi_adapter import FacturapiAdapter
    mock_db = MagicMock()
    mock_db.get_vault_secrets = AsyncMock(return_value={"facturapi_key": "sk_test_SECRET_KEY"})
    FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)
    # La key nunca debe aparecer en ningún mensaje de log emitido por el adapter
    assert "sk_test_SECRET_KEY" not in caplog.text


@pytest.mark.asyncio
async def test_forma_pago_invalida_rechazada(adapter):
    """
    H2 Validation: forma de pago fuera del whitelist SAT debe rechazarse antes de llamar API.
    Evita enviar facturas con datos incorrectos al SAT.
    """
    items = [{"description": "Item", "product_key": "01010101", "price": 100, "quantity": 1}]
    with pytest.raises(ValueError, match="Forma de pago inválida"):
        await adapter.create_invoice("cust_1", items, "00")  # "00" no existe en SAT
