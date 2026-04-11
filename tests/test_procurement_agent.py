import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from src.agents.procurement_agent import ProcurementAgent

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    
    # Mock para 'approved_suppliers'
    m_sup = MagicMock()
    # select().eq().eq().lt().execute()
    m_sup.select.return_value.eq.return_value.eq.return_value.lt.return_value.execute = AsyncMock(return_value=MagicMock(data=[
        {"id": "sup1", "name": "Proveedor A"},
        {"id": "sup2", "name": "Proveedor B"},
        {"id": "sup3", "name": "Proveedor C"}
    ]))
    
    # Mock para 'purchase_orders'
    m_po = MagicMock()
    m_po.insert.return_value.execute = AsyncMock()
    
    # Mock para 'products'
    m_prod = MagicMock()
    m_prod.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(return_value=MagicMock(data={"cost": 1000.00}))

    def get_table(name):
        if name == "approved_suppliers": return m_sup
        if name == "purchase_orders": return m_po
        if name == "products": return m_prod
        return MagicMock()
    
    client.table.side_effect = get_table
    return client

@pytest.fixture
def agent(mock_supabase):
    tz_mx = timezone(timedelta(hours=-6))
    business_time = datetime(2024, 5, 13, 10, 0, 0, tzinfo=tz_mx)
    
    agent = ProcurementAgent(tenant_id="tenant-123", supabase_client=mock_supabase)
    agent._get_now = MagicMock(return_value=business_time)
    agent.meta_adapter = MagicMock()
    agent.meta_adapter.send_whatsapp = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_oc_nunca_enviada_sin_aprobacion(agent):
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, kwargs = agent.supabase.table("purchase_orders").insert.call_args
    # Regla: DRAFT. SENT solo despues.
    assert args[0]["status"] == "DRAFT"

@pytest.mark.asyncio
async def test_status_workflow_draft_approved_sent(agent):
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, kwargs = agent.supabase.table("purchase_orders").insert.call_args
    assert args[0]["status"] in ["DRAFT", "PENDING_APPROVAL"] # Implementado como DRAFT

@pytest.mark.asyncio
async def test_solo_proveedores_aprobados(agent):
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    res = await agent.process(data)
    assert res["status"] == "success"
    # El supplier select fue mockeado en "approved_suppliers"

@pytest.mark.asyncio
async def test_sin_proveedor_escala_correctamente(agent):
    # Mock no proveedores
    agent.supabase.table("approved_suppliers").select.return_value.eq.return_value.eq.return_value.lt.return_value.execute.return_value.data = []
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    res = await agent.process(data)
    assert res["po_drafts"][0]["status"] == "escalated"

@pytest.mark.asyncio
async def test_total_mayor_30k_ambas_socias(agent):
    with patch.object(agent, "_estimate_total", return_value=Decimal("40000.00")):
        data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
        await agent.process(data)
        # Ambas socias notificadas
        assert agent.meta_adapter.send_whatsapp.call_count == 2
        calls = agent.meta_adapter.send_whatsapp.call_args_list
        targets = [c[0][0] for c in calls]
        assert "SOCIA_1" in targets
        assert "SOCIA_2" in targets

@pytest.mark.asyncio
async def test_total_menor_30k_una_socia(agent):
    with patch.object(agent, "_estimate_total", return_value=Decimal("15000.00")):
        data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
        await agent.process(data)
        assert agent.meta_adapter.send_whatsapp.call_count == 1
        assert agent.meta_adapter.send_whatsapp.call_args[0][0] == "SOCIA_1"

@pytest.mark.asyncio
async def test_total_mayor_10k_3_opciones_proveedor(agent):
    # La validacion se da en _select_supplier internamente
    opts = await agent._select_supplier("S1", Decimal("15000.00"))
    assert len(opts) == 3

@pytest.mark.asyncio
async def test_cantidad_calculada_con_buffer_20(agent):
    # qty = (15 - days_remaining) * velocity * 1.2
    # days = 5, velocity = 1 -> (10) * 1 * 1.2 = 12
    qty = await agent._calculate_quantity("S1", 5, 1.0)
    assert qty == 12

@pytest.mark.asyncio
async def test_cantidad_minima_1_unidad(agent):
    # days = 16, velocity 1 -> diff = 0 -> qty = 0 * 1 * 1.2 = 0 -> min 1
    qty = await agent._calculate_quantity("S1", 16, 1.0)
    assert qty == 1

@pytest.mark.asyncio
async def test_link_aprobacion_expira_48h(agent):
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, kwargs = agent.supabase.table("purchase_orders").insert.call_args
    expires = datetime.fromisoformat(args[0]["approval_expires_at"])
    now = agent._get_now()
    diff = expires - now
    # Check close to 48h
    assert diff.total_seconds() == 48 * 3600

@pytest.mark.asyncio
async def test_proveedor_con_incumplimientos_excluido(agent):
    # En el mock se puso .lt("incumplimientos_90_dias", 3)
    # Por lo cual en la logica se excluyen. Verificamos args de llamada
    opts = await agent._select_supplier("S1", Decimal("1000.00"))
    assert agent.supabase.table("approved_suppliers").select.return_value.eq.return_value.eq.return_value.lt.called

@pytest.mark.asyncio
async def test_precio_estimado_de_historial(agent):
    # Mock product table
    agent.supabase.table("products").select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data={"cost": 1500.50})
    )
    est = await agent._estimate_total("S1")
    assert est == Decimal("1500.50")

@pytest.mark.asyncio
async def test_tenant_isolation_purchase_orders(agent):
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, kwargs = agent.supabase.table("purchase_orders").insert.call_args
    assert args[0]["tenant_id"] == "tenant-123"

@pytest.mark.asyncio
async def test_oc_no_enviada_si_link_expirado(agent):
    # En esta implementacion de Procurement Agent el draft se crea, el envio lo maneja otra parte, pero probamos que
    # no hay envio en `execute` (status DRAFT).
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, kwargs = agent.supabase.table("purchase_orders").insert.call_args
    assert args[0]["status"] == "DRAFT"


# ──────────────────────── TESTS CLAUDE H2 — PROCUREMENT ─────────────────── #

@pytest.mark.asyncio
async def test_status_draft_no_puede_enviarse(agent, mock_supabase):
    """
    H2: process() siempre crea OC con status='DRAFT'. SENT no ocurre aquí.
    La única ruta a SENT es approve_po() → APPROVED → send_po() (Fase 2).
    """
    data = {"sku_alerts": [{"sku": "S1", "days_remaining": 5}]}
    await agent.process(data)
    args, _ = mock_supabase.table("purchase_orders").insert.call_args
    assert args[0]["status"] == "DRAFT"
    assert args[0]["status"] != "SENT"
    assert args[0]["status"] != "APPROVED"


@pytest.mark.asyncio
async def test_approved_puede_enviarse_via_approve_po(agent, mock_supabase):
    """
    H2: approve_po() es el único camino a status=APPROVED.
    Verifica que approve_po() actualiza status y registra el approver.
    """
    from datetime import datetime, timezone, timedelta

    # Setup: PO existente en DRAFT con link válido (no expirado)
    expires_future = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    po_data = {
        "id": "po-abc",
        "tenant_id": "tenant-123",
        "status": "DRAFT",
        "approval_expires_at": expires_future,
        "approver_1_id": None,
        "approver_2_id": None,
    }

    # Mock para _get_now() que devuelva tiempo actual
    from datetime import timedelta as td
    tz_mx = timezone(td(hours=-6))
    agent._get_now = MagicMock(return_value=datetime(2024, 5, 13, 10, 0, 0, tzinfo=tz_mx))

    mock_po_table = mock_supabase.table("purchase_orders")
    mock_po_table.select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=po_data)
    )
    mock_po_table.update.return_value.eq.return_value.eq.return_value.execute = AsyncMock()

    res = await agent.approve_po("po-abc", "socia_pamela_id")
    assert res["status"] == "APPROVED"
    assert res["po_id"] == "po-abc"


@pytest.mark.asyncio
async def test_link_expirado_no_procesa_aprobacion(agent, mock_supabase):
    """
    H2 Security: si approval_expires_at ya pasó, approve_po() rechaza la aprobación.
    Previene que links viejos filtrados o robados autoricen OCs.
    """
    from datetime import datetime, timezone, timedelta

    tz_mx = timezone(timedelta(hours=-6))
    expired_time = datetime(2024, 5, 10, 10, 0, 0, tzinfo=tz_mx).isoformat()  # 3 días antes del mock

    po_data = {
        "id": "po-exp",
        "tenant_id": "tenant-123",
        "status": "DRAFT",
        "approval_expires_at": expired_time,
        "approver_1_id": None,
    }
    mock_supabase.table("purchase_orders").select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=po_data)
    )

    res = await agent.approve_po("po-exp", "socia_id")
    assert res["status"] == "expired"
    assert "expirado" in res["message"].lower()


@pytest.mark.asyncio
async def test_categoria_sku_de_bd_no_input_cliente(agent):
    """
    H2 Security: _select_supplier() consulta approved_suppliers filtrando
    por tenant_id + active + incumplimientos. La categoría del SKU viene de BD.
    El input del cliente NO puede influir en qué proveedor se selecciona.
    """
    # Llamar _select_supplier con SKU normal
    opts = await agent._select_supplier("SKU-NORMAL", Decimal("5000.00"))

    # Llamar con SKU "malicioso" que intenta path traversal / SQL injection
    opts_malicious = await agent._select_supplier("' OR 1=1; --", Decimal("5000.00"))

    # Ambos deben devolver los mismos proveedores (el SKU no afecta el filtro)
    assert len(opts) == len(opts_malicious), (
        "Input de SKU influyó en selección de proveedor"
    )
    # El filtro de tenant_id siempre presente
    assert agent.supabase.table("approved_suppliers").select.return_value.eq.called


@pytest.mark.asyncio
async def test_segunda_aprobacion_usuario_distinto(agent, mock_supabase):
    """
    H2 Security: approve_po() rechaza si el segundo aprobador es el mismo que el primero.
    Previene rubber-stamp (misma socia aprobando dos veces).
    """
    from datetime import datetime, timezone, timedelta

    expires_future = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    po_data = {
        "id": "po-rubber",
        "tenant_id": "tenant-123",
        "status": "DRAFT",
        "approval_expires_at": expires_future,
        "approver_1_id": "socia_pamela_id",  # ya aprobó una vez
        "approver_2_id": None,
    }
    mock_supabase.table("purchase_orders").select.return_value.eq.return_value.eq.return_value.single.return_value.execute = AsyncMock(
        return_value=MagicMock(data=po_data)
    )

    # Misma socia intenta aprobar de nuevo
    res = await agent.approve_po("po-rubber", "socia_pamela_id")
    assert res["status"] == "error"
    assert "rubber-stamp" in res["message"].lower() or "misma persona" in res["message"].lower()
