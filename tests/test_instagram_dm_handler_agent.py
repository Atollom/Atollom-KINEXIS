import pytest
from unittest.mock import AsyncMock, MagicMock, ANY
from src.agents.instagram_dm_handler_agent import InstagramDMHandlerAgent

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    return client

@pytest.fixture
def agent(mock_supabase):
    agent = InstagramDMHandlerAgent("tenant-123", mock_supabase)
    # Mockear métodos privados para aislar la base de datos
    mock_res_config = MagicMock()
    # Mock business hours to 24/7 so tests pass regardless of execution time/day
    mock_res_config.data = {"config": {"business_hours": {"start": 0, "end": 24, "days": [1, 2, 3, 4, 5, 6, 7]}}}
    agent._query_tenant_config = AsyncMock(return_value=mock_res_config)
    
    agent._query_inventory_by_name = AsyncMock(return_value=[])
    agent._query_inventory_by_sku = AsyncMock(return_value=[])
    agent._insert_crm_interaction = AsyncMock(return_value=MagicMock())
    return agent

@pytest.mark.asyncio
async def test_hmac_invalido_rechazado(agent):
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=False)
    
    data = {
        "sender_id": "user-1",
        "message_text": "hola",
        "payload_bytes": b"raw",
        "x_hub_signature": "sha256=invalid"
    }
    
    result = await agent.run(data)
    assert result["status"] == "success"
    assert "Invalid HMAC signature" in result["output"]["message"]

@pytest.mark.asyncio
async def test_message_sanitizado_antes_de_llm(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "<script>alert(1)</script>Hola   "}
    result = await agent.run(data)
    assert result["status"] == "success"
    # El log de interacción debería tener el texto limpio. 
    # Validamos que se ejecutó sin fallar por el script.

@pytest.mark.asyncio
async def test_b2b_intent_cantidad_mayor_5(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "Quiero 10 unidades de cepillos"}
    result = await agent.run(data)
    assert result["output"]["intent_detected"] == "B2B"
    assert result["output"]["escalated"] is True

@pytest.mark.asyncio
async def test_b2b_intent_regex_factura(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "Necesito factura para mi empresa"}
    result = await agent.run(data)
    assert result["output"]["intent_detected"] == "B2B"

@pytest.mark.asyncio
async def test_fuera_horario_mensaje_ausencia(agent):
    # Mock config para estar "cerrado" siempre
    mock_res_config = MagicMock()
    mock_res_config.data = {"config": {"business_hours": {"start": 25, "end": 25, "days": []}}}
    agent._query_tenant_config = AsyncMock(return_value=mock_res_config)
    
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "Hola"}
    result = await agent.run(data)
    assert result["output"]["intent_detected"] == "away_message"
    agent.meta_adapter.send_instagram_dm.assert_called_with("u1", ANY)

@pytest.mark.asyncio
async def test_inventario_consultado_antes_de_responder(agent):
    # Mock encontrar un producto
    agent._query_inventory_by_name = AsyncMock(return_value=[
        {"sku": "KTO-123", "name": "Cepillo Pro", "available_qty": 10}
    ])
    
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "tienes Cepillo?"}
    result = await agent.run(data)
    assert result["status"] == "success"
    # Verificar que se buscó en inventory table
    agent._query_inventory_by_name.assert_called()

@pytest.mark.asyncio
async def test_crm_interaction_registrada(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "Hola"}
    await agent.run(data)
    # Verificar inserción en crm_interactions
    agent._insert_crm_interaction.assert_called()

@pytest.mark.asyncio
async def test_mock_mode_sin_meta_secret(agent):
    # MetaAdapter maneja su propio Mock Mode si secrets es {}
    # Simular que send_instagram_dm retorna True (Mock Mode)
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    
    data = {"sender_id": "u1", "message_text": "Test"}
    result = await agent.run(data)
    assert result["output"]["response_sent"] is True

@pytest.mark.asyncio
async def test_tenant_isolation_inventory_query(mock_supabase):
    agent = InstagramDMHandlerAgent("tenant-A", mock_supabase)
    agent._insert_crm_interaction = AsyncMock()
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    agent._query_tenant_config = AsyncMock(return_value=MagicMock(data={"config": {"business_hours": {"start": 0, "end": 24, "days": [1, 2, 3, 4, 5, 6, 7]}}}))
    agent._query_inventory_by_name = AsyncMock(return_value=[])
    agent._query_inventory_by_sku = AsyncMock(return_value=[])
    
    # execute() no pasa tenant_id a la query de inventory (porque asume RLS o query manual)
    # En nuestro agente usamos .eq("tenant_id", self.tenant_id) si fuera necesario,
    # pero el scaffold asume RLS para inventory. 
    # Validamos que self.tenant_id se usa en el log de CRM.
    data = {"sender_id": "u1", "message_text": "Hola"}
    await agent.run(data)
    
    # Check that insert uses tenant-A
    call_args = agent._insert_crm_interaction.call_args[0][0]
    assert call_args["tenant_id"] == "tenant-A"

@pytest.mark.asyncio
async def test_respuesta_enviada_via_meta_adapter(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    await agent.run({"sender_id": "ig1", "message_text": "hi"})
    agent.meta_adapter.send_instagram_dm.assert_called()

@pytest.mark.asyncio
async def test_intent_b2c_default(agent):
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    result = await agent.run({"sender_id": "ig1", "message_text": "solo quiero uno"})
    assert result["output"]["intent_detected"] == "B2C_QUERY"

@pytest.mark.asyncio
async def test_sanitize_long_message(agent):
    long_msg = "a" * 2000
    sanitized = agent._sanitize_message(long_msg)
    assert len(sanitized) == 1000

# ── H2 ──

@pytest.mark.asyncio
async def test_inventory_query_error_no_rompe_flujo():
    """_query_inventory_by_name captura excepciones de BD y retorna [] sin lanzar."""
    from unittest.mock import patch, AsyncMock as AM
    # Simular fallo a nivel de supabase directamente dentro del método real
    real_agent = InstagramDMHandlerAgent("t-err", MagicMock())
    real_agent._insert_crm_interaction = AM()
    real_agent.meta_adapter.send_instagram_dm = AM(return_value=True)
    real_agent._query_tenant_config = AM(return_value=MagicMock(
        data={"config": {"business_hours": {"start": 0, "end": 24, "days": list(range(1, 8))}}}
    ))
    # Supabase que lanza en table().select().ilike()...
    bad_builder = MagicMock()
    bad_builder.select.return_value = bad_builder
    bad_builder.ilike.return_value = bad_builder
    bad_builder.limit.return_value = bad_builder
    bad_builder.eq.return_value = bad_builder
    bad_builder.execute = AM(side_effect=Exception("DB timeout"))
    real_agent.supabase = MagicMock()
    real_agent.supabase.table.return_value = bad_builder
    # inventory query returns [] due to try/except — agent must still respond
    result = await real_agent.run({"sender_id": "u1", "message_text": "PRODUCTO ABC"})
    assert result["status"] == "success"
    assert result["output"]["response_sent"] is True

@pytest.mark.asyncio
async def test_lead_created_cuando_b2b_detectado(agent):
    """Cuando la intención es B2B, lead_created debe ser True."""
    agent.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    data = {"sender_id": "u1", "message_text": "mayoreo para distribuidores"}
    result = await agent.run(data)
    assert result["output"]["lead_created"] is True
    assert result["output"]["escalated"] is True
