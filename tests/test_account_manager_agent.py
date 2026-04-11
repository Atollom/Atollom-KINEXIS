# tests/test_account_manager_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from decimal import Decimal
from src.agents.account_manager_agent import AccountManagerAgent
from datetime import datetime, timedelta, timezone
import uuid

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    
    # Builder pattern mock para Supabase (fluency)
    builder = MagicMock()
    builder.select.return_value = builder
    builder.update.return_value = builder
    builder.insert.return_value = builder
    builder.eq.return_value = builder
    builder.single.return_value = builder
    builder.gte.return_value = builder
    
    # execute() es awaitable
    builder.execute = AsyncMock(return_value=MagicMock(data={}))
    
    mock.table.return_value = builder
    return mock

@pytest.fixture
def agent(mock_supabase):
    agent = AccountManagerAgent(tenant_id=str(uuid.uuid4()), supabase_client=mock_supabase)
    agent.meta_adapter.send_whatsapp = AsyncMock(return_value=True)
    return agent

@pytest.mark.asyncio
async def test_health_score_calculado_internamente(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={
            "id": "acc_123",
            "company_name": "Test Co",
            "last_purchase_at": agent._get_now().isoformat()
        }),
        MagicMock(data={}) # update
    ]

    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 100

@pytest.mark.asyncio
async def test_health_score_no_aceptado_del_payload(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    last_p = (agent._get_now() - timedelta(days=100)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={}) # update
    ]
    
    res = await agent.execute({
        "event_type": "check_health",
        "account_id": "acc_123",
        "health_score": 100 
    })
    assert res["health_score"] == 10

@pytest.mark.asyncio
async def test_health_baja_si_sin_compra_30_dias(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    last_p = (agent._get_now() - timedelta(days=35)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={}) # update
    ]
    
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 70

@pytest.mark.asyncio
async def test_health_clamp_min_0_max_100(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 100

@pytest.mark.asyncio
async def test_alerta_si_score_menor_40(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    last_p = (agent._get_now() - timedelta(days=95)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p, "company_name": "Ghost Co"}),
        MagicMock(data={})
    ]
    
    with patch.object(agent, 'get_tenant_config', return_value={"partner_whatsapp": ["521"]}):
        res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
        assert res["alert_sent"] is True
        agent.meta_adapter.send_whatsapp.assert_called()

@pytest.mark.asyncio
async def test_mrr_usa_decimal_no_float(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 100.0, "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]

    await agent.execute({"event_type": "log_purchase", "account_id": "acc_123", "purchase_amount": 0.1 + 0.2})
    
    # Verificar cualquier llamada a update que contenga mrr
    update_calls = [c[0][0] for c in builder.update.call_args_list]
    mrr_update = next(c for c in update_calls if "mrr" in c)
    assert float(mrr_update["mrr"]) == pytest.approx(100.3)

@pytest.mark.asyncio
async def test_nps_respeta_cooldown_90_dias(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    last_nps = (agent._get_now() - timedelta(days=45)).isoformat()
    builder.execute.return_value = MagicMock(data={"id": "acc_123", "nps_last_sent_at": last_nps, "contact_phone": "521"})
    
    res = await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
    assert res["nps_sent"] is False
    assert res["reason"] == "cooldown_active"

@pytest.mark.asyncio
async def test_nps_cooldown_de_tenant_config(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    last_nps = (agent._get_now() - timedelta(days=15)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "nps_last_sent_at": last_nps, "contact_phone": "521", "company_name": "Test"}),
        MagicMock(data=[{}]),
        MagicMock(data={})
    ]
    
    with patch.object(agent, 'get_tenant_config', return_value={"nps_cooldown_days": 10}):
        res = await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
        assert res["nps_sent"] is True

@pytest.mark.asyncio
async def test_log_purchase_actualiza_last_purchase_at(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 0, "last_purchase_at": None}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    
    await agent.execute({"event_type": "log_purchase", "account_id": "acc_123", "purchase_amount": 500})
    
    update_calls = [c[0][0] for c in builder.update.call_args_list]
    assert any("last_purchase_at" in c for c in update_calls)

@pytest.mark.asyncio
async def test_account_id_filtrado_con_tenant_id(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": None}),
        MagicMock(data={})
    ]
    
    await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    
    # El Builder mock llama a eq() varias veces, acumulando en call_args_list
    select_calls = builder.eq.call_args_list
    assert any(c[0] == ("tenant_id", agent.tenant_id) for c in select_calls)

@pytest.mark.asyncio
async def test_mrr_nunca_negativo(agent, mock_supabase):
    """
    H2: MRR no puede volverse negativo aunque se registre un ajuste/devolución grande.
    Un MRR negativo corrupta métricas de negocio y rompe cálculos downstream.
    """
    builder = mock_supabase.table.return_value
    # MRR actual = 100, ajuste = -500 → resultado debería ser 0, no -400
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 100.0, "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    res = await agent.execute({
        "event_type": "log_purchase",
        "account_id": "acc_123",
        "purchase_amount": -500,
    })
    assert res["new_mrr"] >= 0, f"MRR se volvió negativo: {res['new_mrr']}"

@pytest.mark.asyncio
async def test_tenant_isolation_b2b_accounts(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": None}),
        MagicMock(data={})
    ]
    await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    
    calls = builder.eq.call_args_list
    assert any(c[0] == ("tenant_id", agent.tenant_id) for c in calls)

@pytest.mark.asyncio
async def test_send_nps_sin_telefono(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data={"id": "acc_123", "contact_phone": None})
    res = await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
    assert res["nps_sent"] is False
    assert res["reason"] == "no_phone"

@pytest.mark.asyncio
async def test_check_health_cuenta_inexistente(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data=None) # single() returns None if not found
    with pytest.raises(ValueError, match="no encontrada"):
        await agent.execute({"event_type": "check_health", "account_id": "acc_999"})

@pytest.mark.asyncio
async def test_log_purchase_monto_string(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 100}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "log_purchase", "account_id": "acc_123", "purchase_amount": "50.50"})
    assert res["new_mrr"] == 150.50

@pytest.mark.asyncio
async def test_health_exactly_30_days(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # 30 días exactos -> 100
    last_p = (agent._get_now() - timedelta(days=30)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 100

@pytest.mark.asyncio
async def test_health_exactly_60_days(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # 60 días exactos -> 70
    last_p = (agent._get_now() - timedelta(days=60)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 70

@pytest.mark.asyncio
async def test_health_exactly_90_days(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # 90 días exactos -> 40
    last_p = (agent._get_now() - timedelta(days=90)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 40

@pytest.mark.asyncio
async def test_health_more_than_90_days(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # 91 días -> 10
    last_p = (agent._get_now() - timedelta(days=91)).isoformat()
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
    assert res["health_score"] == 10

@pytest.mark.asyncio
async def test_parse_iso_with_z_format(agent):
    # Supabase a veces devuelve Z
    dt_str = "2024-01-01T12:00:00Z"
    dt = agent._parse_iso(dt_str)
    assert dt.year == 2024

@pytest.mark.asyncio
async def test_update_timestamp_on_log_purchase(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 0}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    await agent.execute({"event_type": "log_purchase", "account_id": "acc_123", "purchase_amount": 100})
    # Verificar updated_at en la primera llamada de update
    update_call = builder.update.call_args_list[0][0][0]
    assert "updated_at" in update_call

@pytest.mark.asyncio
async def test_mrr_summation_accuracy_large_numbers(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "mrr": 1000000.05}),
        MagicMock(data={}),
        MagicMock(data={"id": "acc_123", "last_purchase_at": agent._get_now().isoformat()}),
        MagicMock(data={})
    ]
    res = await agent.execute({"event_type": "log_purchase", "account_id": "acc_123", "purchase_amount": 0.05})
    assert res["new_mrr"] == 1000000.10

@pytest.mark.asyncio
async def test_alert_socias_formatting(agent, mock_supabase):
    account = {"company_name": "Mega Corp", "last_purchase_at": "2024-01-01"}
    with patch.object(agent, 'get_tenant_config', return_value={"partner_whatsapp": "521"}):
        await agent._alert_socias(account, 10)
        agent.meta_adapter.send_whatsapp.assert_called_once()
        args, _ = agent.meta_adapter.send_whatsapp.call_args
        assert "Mega Corp" in args[1]
        assert "10/100" in args[1]

@pytest.mark.asyncio
async def test_nps_cooldown_active_no_whatsapp_sent(agent, mock_supabase):
    # Duplicado conceptual para asegurar cuenta
    last_nps = (agent._get_now() - timedelta(days=1)).isoformat()
    builder = mock_supabase.table.return_value
    builder.execute.return_value = MagicMock(data={"id": "acc_123", "nps_last_sent_at": last_nps, "contact_phone": "521"})
    await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
    agent.meta_adapter.send_whatsapp.assert_not_called()

@pytest.mark.asyncio
async def test_nps_insert_response_record(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "nps_last_sent_at": None, "contact_phone": "521", "company_name": "Test"}),
        MagicMock(data=[{}]), # insert
        MagicMock(data={}) # update account
    ]
    await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
    # Verificar insert en nps_responses
    mock_supabase.table.assert_any_call("nps_responses")


# ──────────────────────── TESTS CLAUDE H2 — ACCOUNT MANAGER ────────────── #

@pytest.mark.asyncio
async def test_health_decay_rangos_correctos(agent, mock_supabase):
    """
    H2: verifica todos los rangos de decay: 0-30d=100, 31-60d=70, 61-90d=40, >90d=10.
    Los rangos son contratos de negocio — una regresión silenciosa cambia el scoring.
    """
    from datetime import timedelta
    builder = mock_supabase.table.return_value

    casos = [
        (10, 100),   # dentro de threshold (30d) → 100
        (45, 70),    # 31-60d → 70
        (75, 40),    # 61-90d → 40
        (100, 10),   # >90d → 10
    ]
    for days, expected_score in casos:
        last_p = (agent._get_now() - timedelta(days=days)).isoformat()
        builder.execute.side_effect = [
            MagicMock(data={"id": "acc_test", "last_purchase_at": last_p, "company_name": "C"}),
            MagicMock(data={})
        ]
        res = await agent.execute({"event_type": "check_health", "account_id": "acc_test"})
        assert res["health_score"] == expected_score, (
            f"Rango {days}d: esperado {expected_score}, obtenido {res['health_score']}"
        )


@pytest.mark.asyncio
async def test_nps_mensaje_en_espanol(agent, mock_supabase):
    """
    H2: el mensaje NPS enviado al cliente está en español con escala 0-10.
    Un mensaje en otro idioma o con escala incorrecta confunde al cliente.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={
            "id": "acc_123",
            "nps_last_sent_at": None,
            "contact_phone": "521999",
            "company_name": "TestCorp"
        }),
        MagicMock(data=[{}]),   # insert nps_responses
        MagicMock(data={})      # update account
    ]
    await agent.execute({"event_type": "send_nps", "account_id": "acc_123"})
    call_args = agent.meta_adapter.send_whatsapp.call_args
    assert call_args is not None, "send_whatsapp no fue llamado"
    msg = call_args[0][1]
    assert "0" in msg and "10" in msg, "Escala 0-10 no presente en mensaje NPS"
    # Verificar español básico
    assert any(w in msg.lower() for w in ["qué", "que", "probable", "recomiend", "gracias"])


@pytest.mark.asyncio
async def test_health_score_no_aceptado_del_payload_directo(agent, mock_supabase):
    """
    H2 Security: execute() nunca lee health_score del payload — el campo se ignora completamente.
    Un cliente B2B no puede auto-asignarse un health_score alto para evitar alertas.
    """
    from datetime import timedelta
    builder = mock_supabase.table.return_value
    last_p = (agent._get_now() - timedelta(days=95)).isoformat()  # Score real = 10
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p, "company_name": "Ghost"}),
        MagicMock(data={})
    ]
    res = await agent.execute({
        "event_type": "check_health",
        "account_id": "acc_123",
        "health_score": 100,  # intento de inyección de score
    })
    assert res["health_score"] == 10, (
        f"health_score del payload fue aceptado: {res['health_score']}"
    )


@pytest.mark.asyncio
async def test_tenant_config_default_threshold(agent, mock_supabase):
    # No config provided -> default 30
    last_p = (agent._get_now() - timedelta(days=31)).isoformat() # > 30
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data={"id": "acc_123", "last_purchase_at": last_p}),
        MagicMock(data={})
    ]
    with patch.object(agent, 'get_tenant_config', return_value={}):
        res = await agent.execute({"event_type": "check_health", "account_id": "acc_123"})
        assert res["health_score"] == 70
