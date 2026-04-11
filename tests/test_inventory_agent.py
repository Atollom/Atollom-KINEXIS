import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone
from src.agents.inventory_agent import InventoryAgent

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    
    # Mock para 'inventory'
    m_inv = MagicMock()
    m_inv.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(return_value=MagicMock(data={"stock": 10}))
    m_inv.upsert.return_value.execute = AsyncMock()
    
    # Mock para 'inventory_movements'
    m_mov = MagicMock()
    m_mov.insert.return_value.execute = AsyncMock()
    
    # Para el calculo de velocity: select().eq().eq().eq().gte().execute()
    # En el agente: .table("inventory_movements").select("qty_change").eq("tenant_id",...).eq("sku",...).eq("movement_type", "sale").gte("created_at",...).execute()
    m_sel = m_mov.select.return_value
    m_eq1 = m_sel.eq.return_value
    m_eq2 = m_eq1.eq.return_value
    m_eq3 = m_eq2.eq.return_value
    m_gte = m_eq3.gte.return_value
    m_gte.execute = AsyncMock(return_value=MagicMock(data=[]))
    
    def get_table(name):
        if name == "inventory": return m_inv
        if name == "inventory_movements": return m_mov
        return MagicMock()
    
    client.table.side_effect = get_table
    return client

@pytest.fixture
def agent(mock_supabase):
    tz_mx = timezone(timedelta(hours=-6))
    business_time = datetime(2024, 5, 13, 10, 0, 0, tzinfo=tz_mx)
    
    agent = InventoryAgent(tenant_id="tenant-123", supabase_client=mock_supabase)
    agent._get_now = MagicMock(return_value=business_time)
    agent.meta_adapter = MagicMock()
    agent.meta_adapter.send_whatsapp = AsyncMock()
    agent.procurement_spy = MagicMock()
    return agent

@pytest.mark.asyncio
async def test_stock_negativo_bloqueado(agent):
    data = {"sku": "s1", "qty_change": -15} # stock = 10, after = -5
    res = await agent.process(data)
    assert res["status"] == "error"
    assert "negativo" in res["message"]

@pytest.mark.asyncio
async def test_stock_actualizado_en_supabase(agent):
    data = {"sku": "s1", "qty_change": 5} # 10 + 5 = 15
    res = await agent.process(data)
    assert res["stock_updated"] is True
    assert res["current_stock"] == 15
    # verify upsert
    agent.supabase.table("inventory").upsert.assert_called_with({
        "tenant_id": "tenant-123", "sku": "s1", "stock": 15
    })

@pytest.mark.asyncio
async def test_sync_paralelo_3_plataformas(agent):
    data = {"sku": "s1", "qty_change": -2}
    res = await agent.process(data)
    # Deberian estar las 3
    assert set(res["platforms_synced"]) == {"mercadolibre", "amazon", "shopify"}

@pytest.mark.asyncio
async def test_una_plataforma_falla_otras_continuan(agent):
    data = {"sku": "s1", "qty_change": -2}
    agent.mock_failing_platforms = ["amazon"]
    res = await agent.process(data)
    # Falla amazon, las otras 2 deben estar
    assert set(res["platforms_synced"]) == {"mercadolibre", "shopify"}

@pytest.mark.asyncio
async def test_alerta_stock_cero_urgente(agent):
    data = {"sku": "s1", "qty_change": -10} # 10 - 10 = 0
    res = await agent.process(data)
    assert res["current_stock"] == 0
    alerts = res["low_stock_alerts"]
    assert len(alerts) == 1
    assert alerts[0]["urgency"] == "urgent"
    # Notificacion whatsapp a socias
    agent.meta_adapter.send_whatsapp.assert_called()

@pytest.mark.asyncio
async def test_alerta_stock_critico_7_dias(agent):
    # Velocity default = 1, current_stock = 10. Si resto 5, stock 5. => 5 dias restantes (critico)
    data = {"sku": "s1", "qty_change": -5}
    res = await agent.process(data)
    alerts = res["low_stock_alerts"]
    assert len(alerts) == 1
    assert alerts[0]["urgency"] == "critical"

@pytest.mark.asyncio
async def test_alerta_stock_advertencia_15_dias(agent):
    # stock 10 + 2 = 12. dias 12. => warning
    data = {"sku": "s1", "qty_change": 2}
    res = await agent.process(data)
    alerts = res["low_stock_alerts"]
    assert len(alerts) == 1
    assert alerts[0]["urgency"] == "warning"

@pytest.mark.asyncio
async def test_procurement_disparado_si_critico(agent):
    data = {"sku": "s1", "qty_change": -5} # stock = 5, critico
    res = await agent.process(data)
    assert res["procurement_triggered"] is True
    agent.procurement_spy.assert_called()

@pytest.mark.asyncio
async def test_velocity_calculada_30_dias(agent):
    # m_mov -> select -> eq1 -> eq2 -> eq3 -> gte -> execute -> data
    m_mov = agent.supabase.table("inventory_movements")
    m_mov.select.return_value.eq.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.data = [
        {"qty_change": -30}, {"qty_change": -30}
    ]
    # Total ventas 60 / 30 = 2.0 por dia
    velocity = await agent._calculate_velocity("s1")
    assert velocity == 2.0

@pytest.mark.asyncio
async def test_velocity_default_sin_historial(agent):
    velocity = await agent._calculate_velocity("s1")
    assert velocity == 1.0

@pytest.mark.asyncio
async def test_movement_registrado_en_bd(agent):
    data = {"sku": "s1", "trigger": "sale_confirmed", "qty_change": -2}
    await agent.process(data)
    args, kwargs = agent.supabase.table("inventory_movements").insert.call_args
    assert args[0]["movement_type"] == "sale"
    assert args[0]["qty_change"] == -2
    assert args[0]["qty_before"] == 10
    assert args[0]["qty_after"] == 8

@pytest.mark.asyncio
async def test_tenant_isolation_inventory(agent):
    data = {"sku": "s1", "qty_change": -1}
    await agent.process(data)
    args, kwargs = agent.supabase.table("inventory").upsert.call_args
    assert args[0]["tenant_id"] == "tenant-123"


# ──────────────────────── TESTS CLAUDE H2 — INVENTORY ───────────────────── #

@pytest.mark.asyncio
async def test_tenant_id_payload_no_puede_sobreescribir(agent, mock_supabase):
    """
    H2 Security: tenant_id en payload externo NO puede sobreescribir self.tenant_id.
    Si se pasa 'tenant_id: otro-tenant' en data, el upsert sigue usando self.tenant_id.
    """
    data = {"sku": "s1", "qty_change": 1, "tenant_id": "otro-tenant-MALICIOSO"}
    await agent.process(data)
    args, _ = mock_supabase.table("inventory").upsert.call_args
    assert args[0]["tenant_id"] == "tenant-123", (
        f"tenant_id del payload sobreescribió self.tenant_id: {args[0]['tenant_id']!r}"
    )


@pytest.mark.asyncio
async def test_sync_timeout_amazon_no_bloquea_ml(agent):
    """
    H2: fallo en una plataforma (amazon) no bloquea las demás (ML, Shopify).
    asyncio.gather() garantiza ejecución paralela — un timeout no es cascada.
    """
    agent.mock_failing_platforms = ["amazon"]
    data = {"sku": "s1", "qty_change": 1}
    res = await agent.process(data)
    synced = set(res["platforms_synced"])
    assert "mercadolibre" in synced, "ML bloqueado por fallo de Amazon"
    assert "shopify" in synced, "Shopify bloqueado por fallo de Amazon"
    assert "amazon" not in synced


@pytest.mark.asyncio
async def test_velocity_cero_usa_default_1(agent):
    """
    H2 Edge: si velocity calculada es 0 (sin ventas en 30 días),
    _check_alerts() usa 1.0 como fallback para evitar división por cero.
    """
    # Mock velocity que retorna 0
    with patch.object(agent, "_calculate_velocity", return_value=0.0):
        alerts = await agent._check_alerts("s1", 5, 7, 15)
        # Con velocity=0 → fallback 1.0 → 5 días → critical
        assert len(alerts) == 1
        assert alerts[0]["urgency"] == "critical"


@pytest.mark.asyncio
async def test_alerta_retorna_lista_vacia_no_none(agent):
    """
    H2 Edge: _check_alerts() retorna [] cuando no hay alertas — NUNCA None.
    El router espera una lista iterable, None causaría TypeError en producción.
    """
    # Stock alto (500) → sin alertas
    with patch.object(agent, "_calculate_velocity", return_value=1.0):
        alerts = await agent._check_alerts("s1", 500, 7, 15)
        assert alerts == [], f"_check_alerts retornó {alerts!r} en lugar de []"
        assert alerts is not None


@pytest.mark.asyncio
async def test_fire_forget_procurement_loggeado(agent, caplog):
    """
    H2: _trigger_procurement() es fire-and-forget pero DEBE loggear.
    Stock crítico sin OC generada es un estado que requiere visibilidad.
    """
    import logging
    data = {"sku": "s1", "qty_change": -5}  # stock 5 → critical
    with caplog.at_level(logging.INFO, logger="src.agents.inventory_agent"):
        await agent.process(data)
    assert "ProcurementAgent" in caplog.text or "trigger" in caplog.text.lower(), (
        "Fire-and-forget de procurement no loggeado"
    )


@pytest.mark.asyncio
async def test_qty_before_after_en_movements(agent):
    """
    H2: inventory_movements registra qty_before y qty_after para auditoría fiscal.
    Sin estos campos, no es posible rastrear el historial completo de stock.
    """
    data = {"sku": "s1", "trigger": "sale_confirmed", "qty_change": -3}
    await agent.process(data)
    args, _ = agent.supabase.table("inventory_movements").insert.call_args
    record = args[0]
    assert "qty_before" in record, "qty_before ausente en inventory_movements"
    assert "qty_after" in record, "qty_after ausente en inventory_movements"
    assert record["qty_before"] == 10   # mock stock inicial
    assert record["qty_after"] == 7     # 10 - 3
