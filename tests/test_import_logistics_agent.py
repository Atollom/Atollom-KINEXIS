# tests/test_import_logistics_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.agents.import_logistics_agent import ImportLogisticsAgent
from datetime import datetime, timedelta
import uuid

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    builder = MagicMock()
    builder.select.return_value = builder
    builder.update.return_value = builder
    builder.insert.return_value = builder
    builder.eq.return_value = builder
    builder.lt.return_value = builder
    builder.order.return_value = builder
    builder.single.return_value = builder
    builder.execute = AsyncMock(return_value=MagicMock(data=[]))
    mock.table.return_value = builder
    return mock

@pytest.fixture
def agent(mock_supabase):
    agent = ImportLogisticsAgent(tenant_id=str(uuid.uuid4()), supabase_client=mock_supabase)
    agent.meta_adapter.send_whatsapp = AsyncMock(return_value=True)
    return agent

@pytest.mark.asyncio
async def test_po_approved_creates_shipment(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "po_123", "sku": "SKU-PRO", "qty": 100}), # OC
        MagicMock(data=[{"id": "ship_new"}]) # insert res
    ]
    res = await agent.execute({"event_type": "po_approved", "po_id": "po_123", "eta_days": 45})
    assert "ship_new" in str(res)
    builder.insert.assert_called()

@pytest.mark.asyncio
async def test_customs_cleared_alerts_warehouse(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data={})
    res = await agent.execute({"event_type": "customs_cleared", "shipment_id": "ship_123"})
    assert res["status"] == "customs_cleared"
    agent.meta_adapter.send_whatsapp.assert_called()

@pytest.mark.asyncio
async def test_received_updates_inventory_and_shipment(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "ship_123", "sku": "SKU-PRO", "qty": 50}), # select shipment
        MagicMock(data={}) # update shipment
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={"status": "updated"})
        res = await agent.execute({"event_type": "received", "shipment_id": "ship_123"})
        assert res["received"] is True
        mock_inv.return_value.process.assert_called()

@pytest.mark.asyncio
async def test_eta_check_cron_triggers_alerts(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # Retraso de 5 días (vence a los 3 días por default)
    eta_delayed = (agent._get_now() - timedelta(days=5)).date().isoformat()
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "s1", "sku": "X", "eta": eta_delayed, "status": "in_transit", "alert_sent": False}]),
        MagicMock(data={}) # update alert_sent
    ]
    res = await agent.execute({"event_type": "eta_check_cron"})
    assert len(res["alerts_triggered"]) > 0
    agent.meta_adapter.send_whatsapp.assert_called()

@pytest.mark.asyncio
async def test_shipment_not_found_received(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data=None)
    with pytest.raises(ValueError):
        await agent.execute({"event_type": "received", "shipment_id": "ship_999"})

@pytest.mark.asyncio
async def test_po_not_found_approved(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data=None)
    with pytest.raises(ValueError):
        await agent.execute({"event_type": "po_approved", "po_id": "po_999"})

@pytest.mark.asyncio
async def test_eta_days_default(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "po_1", "sku": "A", "qty": 1}),
        MagicMock(data=[{"id": "s1"}])
    ]
    res = await agent.execute({"event_type": "po_approved", "po_id": "po_1"})
    # Default 30 días
    expected = (agent._get_now() + timedelta(days=30)).date().isoformat()
    assert res["eta"] == expected

@pytest.mark.asyncio
async def test_customs_cleared_no_config(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data={})
    with patch.object(agent, 'get_tenant_config', return_value={}):
        res = await agent.execute({"event_type": "customs_cleared", "shipment_id": "s1"})
        assert res["alert_sent"] is False

@pytest.mark.asyncio
async def test_delay_threshold_config(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    eta_late = (agent._get_now() - timedelta(days=2)).date().isoformat()
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "s1", "sku": "X", "eta": eta_late, "status": "in_transit", "alert_sent": False}]),
        MagicMock(data={})
    ]
    with patch.object(agent, 'get_tenant_config', return_value={"import_eta_alert_days": 10}):
        res = await agent.execute({"event_type": "eta_check_cron"})
        assert len(res["alerts_triggered"]) == 0

@pytest.mark.asyncio
async def test_inventory_fail_logistic_crash(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "X", "qty": 10}),
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(side_effect=Exception("Inv Fail"))
        with pytest.raises(Exception):
            await agent.execute({"event_type": "received", "shipment_id": "s1"})

@pytest.mark.asyncio
async def test_updated_at_on_customs(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data={})
    await agent.execute({"event_type": "customs_cleared", "shipment_id": "s1"})
    assert "updated_at" in builder.update.call_args[0][0]

@pytest.mark.asyncio
async def test_received_at_timestamp(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "X", "qty": 10}),
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        await agent.execute({"event_type": "received", "shipment_id": "s1"})
        assert "received_at" in builder.update.call_args[0][0]

@pytest.mark.asyncio
async def test_eta_original_value(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "po_1", "sku": "X", "qty": 1}),
        MagicMock(data=[{"id": "s1"}])
    ]
    await agent._create_shipment("po_1", 10)
    data = builder.insert.call_args[0][0]
    assert data["eta_original"] == data["eta"]

@pytest.mark.asyncio
async def test_cron_multi_partner(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "s1", "sku": "X", "eta": "2020-01-01", "status": "in_transit", "alert_sent": False}]),
        MagicMock(data={})
    ]
    with patch.object(agent, 'get_tenant_config', return_value={"import_eta_alert_days": 1, "partner_whatsapp": ["P1", "P2"]}):
        await agent.execute({"event_type": "eta_check_cron"})
        assert agent.meta_adapter.send_whatsapp.call_count == 2

@pytest.mark.asyncio
async def test_inv_params(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "SKU-TEST", "qty": 100}),
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        await agent.execute({"event_type": "received", "shipment_id": "s1"})
        args = mock_inv.return_value.process.call_args[0][0]
        assert args["sku"] == "SKU-TEST"

@pytest.mark.asyncio
async def test_ignore_payload_qty(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "X", "qty": 5}), # DB says 5
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        await agent.execute({"event_type": "received", "shipment_id": "s1", "qty": 999})
        assert mock_inv.return_value.process.call_args[0][0]["qty_change"] == 5

@pytest.mark.asyncio
async def test_alert_sent_persistence(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "s1", "sku": "X", "eta": "2020-01-01", "status": "in_transit", "alert_sent": False}]),
        MagicMock(data={})
    ]
    with patch.object(agent, 'get_tenant_config', return_value={"import_eta_alert_days": 1, "partner_whatsapp": "521"}):
        await agent.execute({"event_type": "eta_check_cron"})
        builder.update.assert_called_with({"alert_sent": True})

@pytest.mark.asyncio
async def test_date_parsing(agent):
    assert agent._parse_date("2024-01-01").month == 1


# ──────────────────────── TESTS CLAUDE H2 — IMPORT LOGISTICS ────────────── #

@pytest.mark.asyncio
async def test_qty_received_de_bd_no_payload(agent, mock_supabase):
    """
    H2 Security: qty usada para actualizar inventario viene de BD, no del payload.
    Un actor malicioso no puede manipular el stock enviando qty=99999 en el evento.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "SKU-X", "qty": 42}),  # BD dice 42
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        await agent.execute({
            "event_type": "received",
            "shipment_id": "s1",
            "qty": 99999,  # payload malicioso — debe ignorarse
        })
        call_data = mock_inv.return_value.process.call_args[0][0]
        assert call_data["qty_change"] == 42, (
            f"qty del payload sobreescribió BD: {call_data['qty_change']}"
        )


@pytest.mark.asyncio
async def test_eta_original_no_se_modifica(agent, mock_supabase):
    """
    H2: eta_original se preserva al crear — nunca se sobreescribe en updates posteriores.
    Es el registro auditable de cuándo se prometió la entrega.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "po_1", "sku": "A", "qty": 5}),
        MagicMock(data=[{"id": "s1"}])
    ]
    await agent._create_shipment("po_1", 20)
    insert_data = builder.insert.call_args[0][0]
    assert "eta_original" in insert_data, "eta_original no está en el INSERT"
    assert insert_data["eta_original"] == insert_data["eta"], (
        "eta_original debe ser igual a eta al crear"
    )


@pytest.mark.asyncio
async def test_alerta_no_duplicada_alert_sent_true(agent, mock_supabase):
    """
    H2: una vez enviada la alerta, alert_sent=True en BD — no se vuelve a enviar.
    Sin este flag, el cron envía spam a socias en cada ejecución.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{
            "id": "s1", "sku": "X", "eta": "2020-01-01",
            "status": "in_transit", "alert_sent": False
        }]),
        MagicMock(data={}),   # update alert_sent
        MagicMock(data=[{}])  # routing_logs insert
    ]
    with patch.object(agent, 'get_tenant_config', return_value={
        "import_eta_alert_days": 1, "partner_whatsapp": ["521"]
    }):
        await agent.execute({"event_type": "eta_check_cron"})
    # alert_sent debe haberse marcado True
    update_calls = [c[0][0] for c in builder.update.call_args_list]
    assert any(c.get("alert_sent") is True for c in update_calls), (
        "alert_sent no se marcó True después de enviar alerta"
    )


@pytest.mark.asyncio
async def test_inventory_agent_mismo_tenant(agent, mock_supabase):
    """
    H2 Security: InventoryAgent se instancia con self.tenant_id, no con tenant_id del payload.
    Llamar InventoryAgent con otro tenant contaminaría el stock de otro cliente.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "SKU-T", "qty": 10}),
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        await agent.execute({"event_type": "received", "shipment_id": "s1"})
        # InventoryAgent debe instanciarse con el tenant_id del agente
        assert mock_inv.call_args[0][0] == agent.tenant_id, (
            f"InventoryAgent instanciado con tenant incorrecto: {mock_inv.call_args[0][0]}"
        )


@pytest.mark.asyncio
async def test_discrepancia_qty_escala_socias(agent, mock_supabase):
    """
    H2 Security: si qty_received (conteo físico) difiere de qty en BD → escala a socias.
    Una discrepancia puede indicar robo, error de proveedor o problema en aduana.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "SKU-D", "qty": 100}),  # BD dice 100
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        res = await agent.execute({
            "event_type": "received",
            "shipment_id": "s1",
            "qty_received": 80,  # conteo físico: 80 ≠ 100
        })
    assert res["discrepancy"] is True, "Discrepancia no detectada"
    agent.meta_adapter.send_whatsapp.assert_called(), "Socias no notificadas de discrepancia"


@pytest.mark.asyncio
async def test_alert_update_tiene_tenant_id_filter(agent, mock_supabase):
    """
    H2 Security: el UPDATE de alert_sent en _check_eta_alerts() filtra por tenant_id.
    Sin este filtro, un shipment_id de otro tenant podría marcarse como alertado.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{
            "id": "s_idor", "sku": "X", "eta": "2020-01-01",
            "status": "in_transit", "alert_sent": False
        }]),
        MagicMock(data={}),
        MagicMock(data=[{}])
    ]
    with patch.object(agent, 'get_tenant_config', return_value={
        "import_eta_alert_days": 1, "partner_whatsapp": ["521"]
    }):
        await agent.execute({"event_type": "eta_check_cron"})
    all_eq_calls = [call[0] for call in builder.eq.call_args_list]
    assert ("tenant_id", agent.tenant_id) in all_eq_calls, (
        "_check_eta_alerts() no filtra alert update por tenant_id — IDOR"
    )


@pytest.mark.asyncio
async def test_routing_log_insertado_en_eta_alert(agent, mock_supabase):
    """
    H2: _check_eta_alerts() inserta en routing_logs para auditoría.
    Sin este registro, no hay trazabilidad de cuándo se enviaron alertas de retraso.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{
            "id": "s_log", "sku": "SKU-L", "eta": "2020-01-01",
            "status": "in_transit", "alert_sent": False
        }]),
        MagicMock(data={}),   # update alert_sent
        MagicMock(data=[{}])  # routing_logs insert
    ]
    with patch.object(agent, 'get_tenant_config', return_value={
        "import_eta_alert_days": 1, "partner_whatsapp": ["521"]
    }):
        await agent.execute({"event_type": "eta_check_cron"})
    mock_supabase.table.assert_any_call("routing_logs")


@pytest.mark.asyncio
async def test_sin_discrepancia_no_escala(agent, mock_supabase):
    """
    H2: si qty_received == qty en BD → sin discrepancia, sin alerta, flujo normal.
    Previene falsos positivos que generen ruido a las socias.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "s1", "sku": "SKU-OK", "qty": 50}),  # BD = 50
        MagicMock(data={})
    ]
    with patch('src.agents.import_logistics_agent.InventoryAgent') as mock_inv:
        mock_inv.return_value.process = AsyncMock(return_value={})
        res = await agent.execute({
            "event_type": "received",
            "shipment_id": "s1",
            "qty_received": 50,  # exactamente igual a BD → sin discrepancia
        })
    assert res["discrepancy"] is False
    agent.meta_adapter.send_whatsapp.assert_not_called()
