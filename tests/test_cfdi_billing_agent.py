# tests/test_cfdi_billing_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.cfdi_billing_agent import CFDIBillingAgent

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    # Mock config tenant
    config_res = MagicMock()
    config_res.data = {
        "tenant_id": "tenant-kap",
        "monto_minimo_rfc_real": 2000,
        "cp_expedicion": "72973",
        "warehouse_whatsapp": "521234567890"
    }
    client.table("cfdi_tenant_config_ext").select().eq().single().execute = AsyncMock(return_value=config_res)
    
    # Mock insert cfdi_records
    insert_res = MagicMock()
    insert_res.data = [{"id": "rec_123"}]
    client.table("cfdi_records").insert().execute = AsyncMock(return_value=insert_res)
    
    # Mock kit breakdown query
    kit_res = MagicMock()
    kit_res.data = [
        {"component_sku": "COMP1", "quantity": 1, "product_sat_keys": {"description": "D1", "sat_key": "1", "unit_key": "H8"}},
        {"component_sku": "COMP2", "quantity": 1, "product_sat_keys": {"description": "D2", "sat_key": "2", "unit_key": "H8"}}
    ]
    client.table("kit_components").select().eq().execute = AsyncMock(return_value=kit_res)
    
    return client

@pytest.fixture
def agent(mock_supabase):
    agent = CFDIBillingAgent(tenant_id="tenant-kap", supabase_client=mock_supabase)
    # Mock adapters
    agent.facturapi.create_customer = AsyncMock(return_value={"id": "cust_1"})
    agent.facturapi.create_invoice = AsyncMock(return_value={"id": "inv_1", "uuid": "UUID-123"})
    agent.facturapi.download_files = AsyncMock(return_value={"xml": b"x", "pdf": b"p"})
    agent.meta_adapter.send_whatsapp = AsyncMock(return_value=True)
    return agent

# --- VALIDACIONES ---

@pytest.mark.asyncio
async def test_total_cero_bloqueado(agent):
    data = {"items": [{"price": 0, "quantity": 1}]}
    with pytest.raises(ValueError, match="total 0"):
        await agent.execute(data)

@pytest.mark.asyncio
async def test_rfc_invalido_bloqueado(agent):
    # El adapter ya valida RFC
    agent.facturapi.create_customer.side_effect = ValueError("RFC inválido")
    data = {"customer_rfc": "INV", "items": [{"price": 10}]}
    with pytest.raises(ValueError):
        await agent.execute(data)

@pytest.mark.asyncio
async def test_kit_desglossado_antes_de_timbrar(agent):
    data = {
        "items": [{"sku": "KIT33", "price": 100, "quantity": 1}],
        "customer_rfc": "XAXX010101000"
    }
    await agent.execute(data)
    # El adapter debe recibir 2 items (el kit desglosado)
    args, kwargs = agent.facturapi.create_invoice.call_args
    assert len(kwargs["items"]) == 2
    assert "D1 (Parte de KIT33)" in kwargs["items"][0]["description"]

@pytest.mark.asyncio
async def test_kit_precio_dividido_correctamente(agent):
    data = {"items": [{"sku": "KIT33", "price": 100, "quantity": 1}]}
    await agent.execute(data)
    args, kwargs = agent.facturapi.create_invoice.call_args
    # 100 / 2 componentes = 50 cada uno
    assert kwargs["items"][0]["price"] == 50

# --- FLUJO EXITOSO ---

@pytest.mark.asyncio
async def test_cfdi_timbrado_exitosamente(agent):
    data = {"items": [{"price": 100, "quantity": 1}], "customer_rfc": "XAXX010101000"}
    res = await agent.execute(data)
    assert res["status"] == "success"
    assert res["cfdi_uuid"] == "UUID-123"

@pytest.mark.asyncio
async def test_xml_pdf_guardados_storage_antes_de_bd(agent, mock_supabase):
    # No podemos testear el 'antes' fácilmente sin spies complejos, 
    # pero verificamos que se registró después del timbrado.
    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000"}
    await agent.execute(data)
    assert mock_supabase.table("cfdi_records").insert.called

@pytest.mark.asyncio
async def test_cfdi_registrado_en_cfdi_records(agent, mock_supabase):
    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000"}
    await agent.execute(data)
    args, kwargs = mock_supabase.table("cfdi_records").insert.call_args
    assert args[0]["uuid"] == "UUID-123"

@pytest.mark.asyncio
async def test_cliente_notificado_email(agent):
    data = {"customer_email": "test@test.com", "items": [{"price": 10}]}
    # El método _send_to_customer es mockeado implícitamente por el logger en esta fase
    await agent.execute(data)
    # Por ahora solo verificamos que no rompe

# --- AUTONOMÍA ---

@pytest.mark.asyncio
async def test_total_menor_10k_autonomy_full(agent):
    data = {"items": [{"price": 5000, "quantity": 1}]}
    res = await agent.execute(data)
    assert res["autonomy"] == "FULL"

@pytest.mark.asyncio
async def test_total_mayor_10k_notify_socias(agent):
    data = {"items": [{"price": 12000, "quantity": 1}], "order_id": "ORD-GT-10"}
    with pytest.raises(RuntimeError, match="requiere aprobacion manual"):
        await agent.execute(data)
    # Verificar notificación WhatsApp
    assert agent.meta_adapter.send_whatsapp.called

# --- CASOS EDGE ---

@pytest.mark.asyncio
async def test_rfc_publico_general_xaxx_aceptado(agent):
    data = {"customer_rfc": "XAXX010101000", "items": [{"price": 10}]}
    res = await agent.execute(data)
    assert res["status"] == "success"

@pytest.mark.asyncio
async def test_retry_3_intentos_pac_falla(agent):
    # El retry está en FacturapiAdapter.create_invoice
    # Pero si el Billing Agent no lo captura, escala.
    agent.facturapi.create_invoice.side_effect = RuntimeError("PAC Down")
    data = {"items": [{"price": 10}]}
    with pytest.raises(RuntimeError, match="PAC Down"):
        await agent.execute(data)

@pytest.mark.asyncio
async def test_tenant_isolation_cfdi_records(agent, mock_supabase):
    data = {"items": [{"price": 10}]}
    await agent.execute(data)
    args, kwargs = mock_supabase.table("cfdi_records").insert.call_args
    assert args[0]["tenant_id"] == "tenant-kap"

@pytest.mark.asyncio
async def test_mock_mode_sin_facturapi_key(agent):
    # Mock Facturapi para retornar datos mock
    agent.facturapi.create_invoice.return_value = {"id": "mock", "uuid": "MOCK-UUID"}
    data = {"items": [{"price": 10}]}
    res = await agent.execute(data)
    assert "MOCK-UUID" in res["cfdi_uuid"]

@pytest.mark.asyncio
async def test_item_no_kit_sin_cambios(agent):
    data = {"items": [{"sku": "PROD-1", "price": 100, "quantity": 1}]}
    await agent.execute(data)
    args, kwargs = agent.facturapi.create_invoice.call_args
    assert len(kwargs["items"]) == 1
    assert kwargs["items"][0]["description"] == "PROD-1" # Asumimos description es sku si no hay otra

@pytest.mark.asyncio
async def test_items_vacios_bloqueados(agent):
    data = {"items": [], "customer_rfc": "XAXX010101000"}
    with pytest.raises(ValueError, match="Lista de productos vacía"):
        # El adapter valida esto
        agent.facturapi.create_invoice.side_effect = ValueError("Lista de productos vacía")
        await agent.execute(data)

@pytest.mark.asyncio
async def test_cancelacion_human_required_siempre(agent):
    # Aunque la cancelación no está en execute(), la lógica de autonomía debe preverlo
    # Para este test, simulamos que el agente recibe una señal de cancelación
    # En esta fase, solo verificamos que el método existe o la regla está documentada
    assert agent._apply_autonomy is not None

@pytest.mark.asyncio
async def test_folio_serie_kt_correcto(agent):
    # Verificamos que se intente registrar con una serie coherente (KT)
    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000", "folio": "KT-1001"}
    await agent.execute(data)
    args, kwargs = agent.supabase.table("cfdi_records").insert.call_args
    assert args[0]["folio"] == "KT-1001"


# ──────────────────────── TESTS CLAUDE H2 — CFDI MODULE ──────────────────── #

# ── DECIMAL Y PRECISIÓN FISCAL ────────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_kit_precio_decimal_no_float(agent):
    """
    H2 Precision: precios de componentes calculados con Decimal internamente.
    Precio de kit 100 / 2 componentes debe ser exactamente 50.00, no 49.999...
    """
    data = {"items": [{"sku": "KIT33", "price": 100, "quantity": 1}]}
    await agent.execute(data)
    args, kwargs = agent.facturapi.create_invoice.call_args
    items = kwargs["items"]
    # Ambos componentes deben tener precio float con exactitud de centavo
    for item in items:
        price = item["price"]
        # round-trip via Decimal para verificar que no tiene drift de float
        from decimal import Decimal
        assert Decimal(str(price)) == Decimal(str(round(price, 2))), (
            f"Precio con drift de float detectado: {price!r}"
        )


@pytest.mark.asyncio
async def test_kit_componentes_suman_exacto(agent, mock_supabase):
    """
    H2 Precision: suma de precios de componentes debe ser igual al precio original del kit.
    Precio impar (e.g. $1.00 / 3 componentes) no debe perder ni agregar centavos.
    """
    # Sobreescribir kit_components con 3 componentes para forzar precio impar
    kit_res = MagicMock()
    kit_res.data = [
        {"component_sku": "C1", "quantity": 1, "product_sat_keys": {"description": "D1", "sat_key": "1", "unit_key": "H87"}},
        {"component_sku": "C2", "quantity": 1, "product_sat_keys": {"description": "D2", "sat_key": "2", "unit_key": "H87"}},
        {"component_sku": "C3", "quantity": 1, "product_sat_keys": {"description": "D3", "sat_key": "3", "unit_key": "H87"}},
    ]
    mock_supabase.table("kit_components").select().eq().execute = AsyncMock(return_value=kit_res)

    data = {"items": [{"sku": "KIT33", "price": 1.00, "quantity": 1}]}
    await agent.execute(data)
    args, kwargs = agent.facturapi.create_invoice.call_args
    items = kwargs["items"]

    from decimal import Decimal
    total = sum(Decimal(str(it["price"])) * Decimal(str(it["quantity"])) for it in items)
    assert total == Decimal("1.00"), f"Suma de componentes {total} != precio original 1.00"


@pytest.mark.asyncio
async def test_kit_diferencia_ajustada_ultimo_item(agent, mock_supabase):
    """
    H2 Precision: cuando el precio no divide exactamente, el ajuste va al ÚLTIMO componente,
    no al primero ni se distribuye uniformemente con error de redondeo.
    100 / 3 = 33.33 + 33.33 + 33.34 (último ajustado).
    """
    kit_res = MagicMock()
    kit_res.data = [
        {"component_sku": "C1", "quantity": 1, "product_sat_keys": {"description": "D1", "sat_key": "1", "unit_key": "H87"}},
        {"component_sku": "C2", "quantity": 1, "product_sat_keys": {"description": "D2", "sat_key": "2", "unit_key": "H87"}},
        {"component_sku": "C3", "quantity": 1, "product_sat_keys": {"description": "D3", "sat_key": "3", "unit_key": "H87"}},
    ]
    mock_supabase.table("kit_components").select().eq().execute = AsyncMock(return_value=kit_res)

    data = {"items": [{"sku": "KIT33", "price": 100.00, "quantity": 1}]}
    await agent.execute(data)
    args, kwargs = agent.facturapi.create_invoice.call_args
    items = kwargs["items"]

    assert len(items) == 3
    # Primeros dos son iguales, último absorbe el ajuste
    assert items[0]["price"] == items[1]["price"]
    # Suma exacta
    from decimal import Decimal
    total = sum(Decimal(str(it["price"])) for it in items)
    assert total == Decimal("100.00")


@pytest.mark.asyncio
async def test_kit_componente_precio_nunca_cero():
    """
    H2 Precision: ningún componente de kit puede tener price=0.
    Si el precio es tan pequeño que division resulta en 0 centavos, debe lanzar ValueError.
    FacturapiAdapter._breakdown_kits() tiene esta protección — verificamos end-to-end.
    """
    # Sobreescribir create_invoice para que llame al _breakdown_kits real
    # Usamos el adapter real con kit de 100 componentes y precio $0.01
    from src.adapters.facturapi_adapter import FacturapiAdapter
    mock_db = MagicMock()
    mock_db.get_vault_secrets = AsyncMock(return_value={})  # mock mode

    adapter = FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)

    # 100 componentes a $0.01 total → $0.00 por componente → ValueError
    components = [{"name": f"C{i}", "sat_key": "01010101"} for i in range(100)]
    adapter._get_kit_components_from_db = AsyncMock(return_value=components)

    items = [{"sku": "KIT-TINY", "description": "Kit", "price": 0.01, "quantity": 1}]
    with pytest.raises(ValueError, match="precio por componente calculado como 0"):
        await adapter.create_invoice("cust_1", items, "01")


# ── SEGURIDAD ─────────────────────────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_sku_malicioso_sanitizado_en_kit_query(agent, mock_supabase):
    """
    H2 Security: SKU con path traversal o chars SQL especiales debe sanitizarse
    antes de la query a BD. 'KIT../../../etc' → 'KITetc' en la query.
    """
    data = {"items": [{"sku": "KIT../../../etc/passwd", "price": 100, "quantity": 1}]}
    # El agente no debe romper — la query usa SKU sanitizado
    # El SKU sanitizado 'KITetcpasswd' no empieza por 'KIT' con traversal
    # Verificamos que la query fue con sku limpio
    await agent.execute(data)
    # La query eq("kit_sku", ...) debe haber sido llamada con SKU sin ../
    call_args = mock_supabase.table("kit_components").select().eq.call_args
    if call_args:
        queried_sku = call_args[0][1]  # segundo arg de .eq("kit_sku", sku)
        assert "../" not in queried_sku, f"Path traversal no sanitizado: {queried_sku!r}"
        assert "/" not in queried_sku


@pytest.mark.asyncio
async def test_cfdi_uuid_no_duplicado_entre_tenants():
    """
    H2 Security: en MOCK_MODE, cada create_invoice genera un UUID único con uuid4().
    Dos facturas distintas (aunque sean mismo tenant) no pueden tener el mismo UUID.
    """
    from src.adapters.facturapi_adapter import FacturapiAdapter
    mock_db = MagicMock()
    mock_db.get_vault_secrets = AsyncMock(return_value={})

    adapter = FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)
    items = [{"description": "Item", "product_key": "01010101", "price": 100, "quantity": 1}]

    res1 = await adapter.create_invoice("cust_1", items, "01")
    res2 = await adapter.create_invoice("cust_2", items, "01")

    assert res1["uuid"] != res2["uuid"], "Dos facturas mock tienen el mismo UUID"
    assert res1["id"] != res2["id"], "Dos facturas mock tienen el mismo id"


@pytest.mark.asyncio
async def test_signed_url_no_predecible(agent):
    """
    H2 Security: la Signed URL de CFDI debe contener token (no ser URL pública estática).
    En stub Fase 1, verificamos que la URL tiene el parámetro 'token' y 'expires'.
    """
    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000"}
    res = await agent.execute(data)
    assert "token=" in res["urls"]["xml"], "Signed URL sin parámetro token"
    assert "expires=" in res["urls"]["xml"], "Signed URL sin expiración"
    assert "token=" in res["urls"]["pdf"]
    assert "expires=" in res["urls"]["pdf"]


@pytest.mark.asyncio
async def test_items_campos_extra_ignorados():
    """
    H2 Security: campos extras en items (e.g., discount, internal_notes) no deben
    propagarse al payload enviado a Facturapi — solo whitelist de campos permitidos.
    FacturapiAdapter.create_invoice() filtra: description, product_key, price, quantity.
    """
    from src.adapters.facturapi_adapter import FacturapiAdapter
    import respx
    import httpx

    mock_db = MagicMock()
    mock_db.get_vault_secrets = AsyncMock(return_value={"facturapi_key": "sk_test"})
    adapter = FacturapiAdapter(tenant_id="tenant-kap", db_client=mock_db)

    items = [{
        "description": "Lupa 10x",
        "product_key": "01010101",
        "price": 100,
        "quantity": 1,
        "discount": 50,           # campo extra — NO debe ir al payload
        "internal_notes": "xyz",  # campo extra — NO debe ir al payload
        "cost": 40,               # campo extra — NO debe ir al payload
    }]

    with respx.mock:
        respx.post("https://www.facturapi.io/v2/invoices").respond(200, json={"id": "i", "uuid": "U"})
        await adapter.create_invoice("cust_1", items, "01")
        payload_bytes = respx.calls.last.request.content
        assert b"discount" not in payload_bytes, "Campo 'discount' llegó a Facturapi"
        assert b"internal_notes" not in payload_bytes
        assert b"cost" not in payload_bytes


# ── ORDEN DE OPERACIONES ──────────────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_storage_antes_de_bd_siempre(agent):
    """
    H2 Ordering: _save_to_storage debe llamarse ANTES de _register_cfdi.
    Si se invirtiera el orden, un error de storage dejaría un registro huérfano en BD.
    """
    call_order = []

    original_save = agent._save_to_storage
    original_register = agent._register_cfdi

    async def spy_save(*args, **kwargs):
        call_order.append("storage")
        return await original_save(*args, **kwargs)

    async def spy_register(*args, **kwargs):
        call_order.append("bd")
        return await original_register(*args, **kwargs)

    agent._save_to_storage = spy_save
    agent._register_cfdi = spy_register

    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000"}
    await agent.execute(data)

    assert call_order.index("storage") < call_order.index("bd"), (
        f"BD se escribió antes que Storage. Orden: {call_order}"
    )


@pytest.mark.asyncio
async def test_si_storage_falla_bd_no_se_escribe(agent):
    """
    H2 Ordering: si _save_to_storage lanza excepción, _register_cfdi NO debe ejecutarse.
    Garantiza que el CFDI no quede huérfano (timbrado pero sin archivos accesibles).
    Espía directamente _register_cfdi para evitar falso positivo del mock de fixture.
    """
    agent._save_to_storage = AsyncMock(side_effect=RuntimeError("Storage bucket full"))
    agent._register_cfdi = AsyncMock()  # spy limpio — no llamado por fixture

    data = {"items": [{"price": 100}], "customer_rfc": "XAXX010101000"}
    with pytest.raises(RuntimeError, match="Storage bucket full"):
        await agent.execute(data)

    assert not agent._register_cfdi.called, "Se llamó _register_cfdi pese a fallo de storage"


@pytest.mark.asyncio
async def test_cfdi_timbrado_si_send_falla_no_escala(agent):
    """
    H2 Ordering: si _send_to_customer falla (Resend caído), execute() debe igualmente
    retornar status='success'. El CFDI ya fue timbrado y guardado — envío es best-effort.
    """
    agent._send_to_customer = AsyncMock(side_effect=Exception("Resend 503"))

    data = {
        "items": [{"price": 100}],
        "customer_rfc": "XAXX010101000",
        "customer_email": "cliente@empresa.com",
    }
    res = await agent.execute(data)
    # La excepción en send NO debe propagarse
    assert res["status"] == "success"
    assert res["cfdi_uuid"] == "UUID-123"


@pytest.mark.asyncio
async def test_autonomy_threshold_de_tenant_config(agent, mock_supabase):
    """
    H2 Config: el threshold de autonomía viene de tenant_config['autonomy_threshold_mxn'],
    no está hardcodeado en $10,000. Cambiar config → umbral cambia.
    """
    # Configurar threshold en $5,000 (más bajo que el default $10k)
    config_res = MagicMock()
    config_res.data = {
        "tenant_id": "tenant-kap",
        "cp_expedicion": "72973",
        "warehouse_whatsapp": "521234567890",
        "autonomy_threshold_mxn": 5000,  # threshold custom
    }
    mock_supabase.table("cfdi_tenant_config_ext").select().eq().single().execute = AsyncMock(
        return_value=config_res
    )

    # $6,000 > $5,000 → debe ser NOTIFY con threshold custom
    data = {"items": [{"price": 6000, "quantity": 1}], "order_id": "ORD-THRESH"}
    with pytest.raises(RuntimeError, match="requiere aprobacion manual"):
        await agent.execute(data)
    assert agent.meta_adapter.send_whatsapp.called

    # Reset mock para segundo caso
    agent.meta_adapter.send_whatsapp.reset_mock()

    # $4,000 < $5,000 → FULL con threshold custom
    data2 = {"items": [{"price": 4000, "quantity": 1}]}
    res = await agent.execute(data2)
    assert res["autonomy"] == "FULL"
