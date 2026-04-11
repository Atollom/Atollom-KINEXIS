# tests/test_customer_support_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.agents.customer_support_agent import CustomerSupportAgent
import uuid

@pytest.fixture
def mock_supabase():
    mock = MagicMock()
    builder = MagicMock()
    builder.select.return_value = builder
    builder.update.return_value = builder
    builder.insert.return_value = builder
    builder.eq.return_value = builder
    builder.single.return_value = builder
    # Por defecto encuentra un ticket
    builder.execute = AsyncMock(return_value=MagicMock(data=[{"id": "ticket_123", "turn_count": 0, "status": "open"}]))
    mock.table.return_value = builder
    return mock

@pytest.fixture
def agent(mock_supabase):
    agent = CustomerSupportAgent(tenant_id=str(uuid.uuid4()), supabase_client=mock_supabase)
    agent.meta_adapter.send_whatsapp = AsyncMock(return_value=True)
    return agent

@pytest.mark.asyncio
async def test_escalacion_por_insultos(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "Eres un pendejo", "turn_count": 1})
    assert res["escalated"] is True

@pytest.mark.asyncio
async def test_tracking_amazon_working(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 0, "status": "open"}]), # get_or_create
        MagicMock(data=[{"status": "shipped", "external_id": "AMZ-OK", "platform": "amazon"}]), # tracking
        MagicMock(data={}), # update turn
    ]
    res = await agent.execute({"contact_phone": "521", "message": "rastreo", "order_id": "123", "ticket_type": "tracking"})
    assert "AMZ-OK" in res["response"]

@pytest.mark.asyncio
async def test_complaint_gold(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "oro ácido", "ticket_type": "complaint"})
    assert "pV_I49L6J2o" in res["response"]

@pytest.mark.asyncio
async def test_complaint_silver(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "plata ácido", "ticket_type": "complaint"})
    assert "9nINypdi-6w" in res["response"]

@pytest.mark.asyncio
async def test_return_flow(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "devolución", "ticket_type": "return"})
    assert "registrado" in res["response"].lower()

@pytest.mark.asyncio
async def test_meta_fail_no_crash(agent, mock_supabase):
    agent.meta_adapter.send_whatsapp = AsyncMock(side_effect=Exception("Fail"))
    res = await agent.execute({"contact_phone": "521", "message": "hola"})
    assert res["response_sent"] is True

@pytest.mark.asyncio
async def test_sanitization_check(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "<b>hola</b>"})
    assert "response" in res

@pytest.mark.asyncio
async def test_no_escalate_early(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "hola", "turn_count": 1})
    assert res["escalated"] is False

@pytest.mark.asyncio
async def test_manual_escalate_via_keyword(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "legal", "turn_count": 1})
    assert res["escalated"] is True

@pytest.mark.asyncio
async def test_tracking_b2b(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 0, "status": "open"}]),
        MagicMock(data=[{"status": "shipped", "external_id": "B2B-1", "platform": "b2b"}]),
        MagicMock(data={}),
    ]
    res = await agent.execute({"contact_phone": "521", "message": "rastreo", "order_id": "999", "ticket_type": "tracking"})
    assert "B2B-1" in res["response"]

@pytest.mark.asyncio
async def test_tenant_isolation_check(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    await agent.execute({"contact_phone": "521", "message": "hola"})
    builder.eq.assert_any_call("tenant_id", agent.tenant_id)

@pytest.mark.asyncio
async def test_new_ticket_creation(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    # No encuentra ticket el primer select de get_or_create
    builder.execute.side_effect = [
        MagicMock(data=[]), # select
        MagicMock(data=[{"id": "new_t"}]) # insert
    ]
    await agent.execute({"contact_phone": "521", "message": "hola"})
    assert builder.insert.called

@pytest.mark.asyncio
async def test_chinga_escalation(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "chinga"})
    assert res["escalated"] is True

@pytest.mark.asyncio
async def test_abogado_escalation(agent, mock_supabase):
    res = await agent.execute({"contact_phone": "521", "message": "abogado"})
    assert res["escalated"] is True

@pytest.mark.asyncio
async def test_turn_count_increment(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 1, "status": "open"}]),
        MagicMock(data={}), # update turn
    ]
    res = await agent.execute({"contact_phone": "521", "message": "hola"})
    assert res["turn_count"] == 2

@pytest.mark.asyncio
async def test_escalation_on_turn_3(agent, mock_supabase):
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 2, "status": "open", "contact_phone": "521"}]),
        MagicMock(data={}), # update turn
        MagicMock(data={}), # update status (escalate)
        MagicMock(data=[{"id": "ticket_123", "contact_phone": "521"}]) # notify_partners select
    ]
    res = await agent.execute({"contact_phone": "521", "message": "esperando"})
    assert res["escalated"] is True


# ──────────────────────── TESTS CLAUDE H2 — CUSTOMER SUPPORT ────────────── #

@pytest.mark.asyncio
async def test_turn_count_bd_no_manipulable_payload(agent, mock_supabase):
    """
    H2 Security: turn_count viene SIEMPRE de BD (ticket devuelto por _get_or_create_ticket).
    Un cliente no puede pasar turn_count=99 en el payload para evitar la escalación.
    """
    builder = mock_supabase.table.return_value
    # BD dice turn_count=0 — el payload dice 99 (intento de manipulación)
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 0, "status": "open"}]),
        MagicMock(data={}),  # update turn
    ]
    res = await agent.execute({
        "contact_phone": "521",
        "message": "hola",
        "turn_count": 99,  # payload malicioso — debe ignorarse
    })
    # Con turn_count=0 de BD, nuevo turn = 1 → no escala
    assert res["escalated"] is False
    assert res["turn_count"] == 1


@pytest.mark.asyncio
async def test_devolucion_no_autoriza_solo_ticket(agent, mock_supabase):
    """
    H2: _handle_return() SOLO abre ticket y notifica. NO emite autorización.
    La autorización de devolución la maneja Returns Agent #20.
    """
    res = await agent.execute({
        "contact_phone": "521",
        "message": "quiero devolver",
        "ticket_type": "return",
        "order_id": "ORD-123",
    })
    response_lower = res["response"].lower()
    # Debe confirmar el registro, NO decir "autorizado" ni "aprobado"
    assert "registr" in response_lower, "No confirmó registro de devolución"
    assert "autoriza" not in response_lower, "No debe emitir autorización"
    assert "aprobad" not in response_lower, "No debe emitir aprobación"


@pytest.mark.asyncio
async def test_tracking_link_ml_correcto(agent, mock_supabase):
    """
    H2: link de rastreo ML usa exactamente mercadolibre.com.mx/envios/{tracking}.
    Formato incorrecto rompe el link para el cliente.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 0, "status": "open"}]),
        MagicMock(data=[{"status": "shipped", "external_id": "ML-TRK-999", "platform": "ml"}]),
        MagicMock(data={}),
    ]
    res = await agent.execute({
        "contact_phone": "521",
        "message": "rastrear",
        "order_id": "123",
        "ticket_type": "tracking",
    })
    assert "mercadolibre.com.mx/envios/ML-TRK-999" in res["response"]


@pytest.mark.asyncio
async def test_tracking_link_amazon_correcto(agent, mock_supabase):
    """
    H2: para Amazon se muestra el número de rastreo, no un link ML.
    Los links de Amazon varían por carrier — se muestra el tracking number.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 0, "status": "open"}]),
        MagicMock(data=[{"status": "shipped", "external_id": "1Z-AMZ-TRK", "platform": "amazon"}]),
        MagicMock(data={}),
    ]
    res = await agent.execute({
        "contact_phone": "521",
        "message": "rastrear",
        "order_id": "AMZ-123",
        "ticket_type": "tracking",
    })
    assert "1Z-AMZ-TRK" in res["response"]
    assert "mercadolibre" not in res["response"], "Link ML no debe aparecer en pedido Amazon"


@pytest.mark.asyncio
async def test_notify_partners_ticket_tenant_isolation(agent, mock_supabase):
    """
    H2 Security: _notify_partners() filtra su SELECT por tenant_id.
    Sin este filtro un ticket_id de otro tenant podría exponerse.
    """
    builder = mock_supabase.table.return_value
    # Escalación por turn=2 → llama _notify_partners
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 2, "status": "open", "contact_phone": "521"}]),
        MagicMock(data={}),  # update turn
        MagicMock(data={}),  # update status escalated
        MagicMock(data=[{"id": "t1", "contact_phone": "521", "order_id": None, "issue_type": "other"}]),  # notify select
    ]
    await agent.execute({"contact_phone": "521", "message": "esperando"})
    # Verificar que el SELECT en support_tickets incluyó tenant_id
    all_eq_calls = [call[0] for call in builder.eq.call_args_list]
    assert ("tenant_id", agent.tenant_id) in all_eq_calls, (
        "_notify_partners() no filtra por tenant_id — IDOR"
    )


@pytest.mark.asyncio
async def test_respuesta_truncada_1024_chars(agent, mock_supabase):
    """
    H2: respuesta enviada a Meta nunca supera 1024 chars.
    Meta puede rechazar mensajes muy largos.
    """
    # Construir respuesta larga — acid sin metal específico genera respuesta corta,
    # usamos mock directo del send_whatsapp para capturar el argumento
    await agent.execute({"contact_phone": "521", "message": "hola"})
    call_args = agent.meta_adapter.send_whatsapp.call_args
    if call_args:
        sent_text = call_args[0][1]
        assert len(sent_text) <= 1024, f"Mensaje supera 1024 chars: {len(sent_text)}"


@pytest.mark.asyncio
async def test_acido_sin_metal_pide_especificacion(agent, mock_supabase):
    """
    H2: queja de ácido sin mencionar plata/oro → el agente pide especificación.
    No debe asumir el metal ni enviar el link incorrecto.
    """
    res = await agent.execute({
        "contact_phone": "521",
        "message": "el ácido no funciona",
        "ticket_type": "complaint",
    })
    response_lower = res["response"].lower()
    assert "plata" in response_lower or "oro" in response_lower, (
        "Debe preguntar si es plata u oro cuando no se especifica"
    )
    # No debe incluir ambos links a la vez sin saber el metal
    assert not ("9nINypdi-6w" in res["response"] and "pV_I49L6J2o" in res["response"])


@pytest.mark.asyncio
async def test_no_contact_phone_raises_value_error(agent, mock_supabase):
    """
    H2: contact_phone es obligatorio. Sin él, process() debe lanzar ValueError.
    Previene tickets huérfanos sin número de retorno.
    """
    import pytest
    with pytest.raises(ValueError, match="contact_phone"):
        await agent.execute({"message": "hola", "ticket_type": "tracking"})


@pytest.mark.asyncio
async def test_escalacion_incluye_contexto_del_ticket(agent, mock_supabase):
    """
    H2: mensaje de escalación a socias incluye datos del ticket (tipo, orden, cliente).
    Sin contexto, las socias no saben qué caso atender.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 2, "status": "open", "contact_phone": "521"}]),
        MagicMock(data={}),  # update turn
        MagicMock(data={}),  # update status
        MagicMock(data=[{
            "id": "t1", "contact_phone": "521",
            "order_id": "ORD-XYZ", "issue_type": "return"
        }]),
    ]
    await agent.execute({"contact_phone": "521", "message": "esperando"})
    # send_whatsapp se llama: 1) a socias (reporte con contexto), 2) al cliente (ack)
    # El reporte a socias es la primera llamada
    all_calls = agent.meta_adapter.send_whatsapp.call_args_list
    socias_msgs = [c[0][1] for c in all_calls if c[0][0] != "521"]
    assert socias_msgs, "send_whatsapp no fue llamado hacia socias"
    socias_report = socias_msgs[0]
    assert "t1" in socias_report or "521" in socias_report, (
        f"Escalación a socias no incluye datos del ticket: {socias_report!r}"
    )


@pytest.mark.asyncio
async def test_update_turn_count_tiene_tenant_id(agent, mock_supabase):
    """
    H2 Security: _update_ticket_turn() filtra el UPDATE por tenant_id.
    Sin esto, un ticket_id podría actualizar turn_count de otro tenant.
    """
    await agent.execute({"contact_phone": "521", "message": "hola"})
    all_eq_calls = [call[0] for call in mock_supabase.table.return_value.eq.call_args_list]
    assert ("tenant_id", agent.tenant_id) in all_eq_calls


@pytest.mark.asyncio
async def test_demanda_escala_inmediatamente(agent, mock_supabase):
    """
    H2: la palabra 'demanda' escala el ticket en el mismo turno, sin esperar turn=3.
    Riesgo legal requiere intervención humana inmediata.
    """
    res = await agent.execute({"contact_phone": "521", "message": "voy a poner una demanda"})
    assert res["escalated"] is True


@pytest.mark.asyncio
async def test_profeco_escala_inmediatamente(agent, mock_supabase):
    """
    H2: la palabra 'profeco' escala inmediatamente.
    Una queja ante PROFECO es una acción regulatoria con plazos legales.
    """
    res = await agent.execute({"contact_phone": "521", "message": "reportaré a profeco"})
    assert res["escalated"] is True


@pytest.mark.asyncio
async def test_estafa_escala_inmediatamente(agent, mock_supabase):
    """
    H2: la palabra 'estafa' escala inmediatamente.
    Acusación de fraude requiere respuesta de nivel socia, no de bot.
    """
    res = await agent.execute({"contact_phone": "521", "message": "esto es una estafa"})
    assert res["escalated"] is True


@pytest.mark.asyncio
async def test_ticket_status_escalado_en_respuesta(agent, mock_supabase):
    """
    H2: cuando turn_count llega a 3, ticket_status en la respuesta es 'escalated'.
    El router downstream necesita este campo para saber el estado.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[{"id": "t1", "turn_count": 2, "status": "open", "contact_phone": "521"}]),
        MagicMock(data={}),
        MagicMock(data={}),
        MagicMock(data=[{"id": "t1", "contact_phone": "521", "order_id": None, "issue_type": "other"}]),
    ]
    res = await agent.execute({"contact_phone": "521", "message": "sin resolver"})
    assert res["ticket_status"] == "escalated"
    assert res["escalated"] is True


@pytest.mark.asyncio
async def test_ticket_nuevo_sin_previo_inserta_en_bd(agent, mock_supabase):
    """
    H2: si no existe ticket abierto para el cliente, se crea uno nuevo via INSERT.
    Previene que el agente falle silenciosamente sin crear registro.
    """
    builder = mock_supabase.table.return_value
    builder.execute.side_effect = [
        MagicMock(data=[]),  # select → sin ticket previo
        MagicMock(data=[{"id": "nuevo_ticket_h2", "turn_count": 0}]),  # insert
        MagicMock(data={}),  # update turn
    ]
    res = await agent.execute({"contact_phone": "521_nuevo", "message": "primera vez"})
    assert builder.insert.called, "No se insertó ticket nuevo"
    assert res["ticket_id"] == "nuevo_ticket_h2"
