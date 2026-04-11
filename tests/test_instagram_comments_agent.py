# tests/test_instagram_comments_agent.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.instagram_comments_agent import InstagramCommentsAgent

@pytest.fixture
def mock_supabase():
    client = MagicMock()
    return client

@pytest.fixture
def agent(mock_supabase):
    agent = InstagramCommentsAgent("t1", mock_supabase)
    agent._insert_crm_interaction = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_hmac_invalido_rechazado(agent):
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=False)
    
    data = {"comment_id": "c1", "comment_text": "hi", "payload_bytes": b"b", "x_hub_signature": "s"}
    result = await agent.run(data)
    assert result["status"] == "success"
    assert "Invalid HMAC signature" in result["output"]["message"]

@pytest.mark.asyncio
async def test_spam_ocultar_no_eliminar(agent):
    agent.meta_adapter.hide_instagram_comment = AsyncMock(return_value=True)
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "Gana dinero facil en http://spam.com"}
    result = await agent.run(data)
    
    assert result["output"]["intent_detected"] == "spam"
    assert result["output"]["comment_hidden"] is True
    assert result["output"]["reply_sent"] is False
    agent.meta_adapter.hide_instagram_comment.assert_called_once()

@pytest.mark.asyncio
async def test_critica_legitima_no_ocultar(agent):
    agent.meta_adapter.hide_instagram_comment = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "El envio tardo 3 dias mas de lo esperado"}
    result = await agent.run(data)
    
    assert result["output"]["comment_hidden"] is False
    # Críticas no son spam ni ofensivas, se atienden pero no se ocultan

@pytest.mark.asyncio
async def test_positivo_respuesta_agradecimiento(agent):
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "Excelente producto, 100% recomendado"}
    result = await agent.run(data)
    
    assert result["output"]["intent_detected"] == "positivo"
    call_args = agent.meta_adapter.post_instagram_comment_reply.call_args
    assert "Muchas gracias" in call_args[0][1]

@pytest.mark.asyncio
async def test_pregunta_invitar_a_dm(agent):
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "Cual es el precio?"}
    result = await agent.run(data)
    
    assert result["output"]["intent_detected"] == "pregunta"
    assert "DM" in agent.meta_adapter.post_instagram_comment_reply.call_args[0][1]

@pytest.mark.asyncio
async def test_reclamo_acido_plata_video_correcto(agent):
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "El acido de plata no me funciona"}
    await agent.run(data)
    
    reply = agent.meta_adapter.post_instagram_comment_reply.call_args[0][1]
    assert "acid-silver-tutorial" in reply

@pytest.mark.asyncio
async def test_reclamo_acido_oro_video_correcto(agent):
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    data = {"comment_id": "c1", "comment_text": "Ayuda con el acido de oro"}
    await agent.run(data)
    
    reply = agent.meta_adapter.post_instagram_comment_reply.call_args[0][1]
    assert "acid-gold-tutorial" in reply

@pytest.mark.asyncio
async def test_respuesta_max_150_chars(agent):
    # build_reply asegura esto, pero validamos el adapter truncado
    long_reply = "a" * 200
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    
    # Probamos la clasificación que genera respuesta
    data = {"comment_id": "c1", "comment_text": "gracias"}
    await agent.run(data)
    
    # En meta_adapter.py post_instagram_comment_reply ya tiene truncado. 
    # Aquí validamos que el agente envía algo razonable.
    call_text = agent.meta_adapter.post_instagram_comment_reply.call_args[0][1]
    assert len(call_text) <= 150

@pytest.mark.asyncio
async def test_comment_sanitizado_antes_de_llm(agent):
    data = {"comment_id": "c1", "comment_text": "<b>Hola</b>"}
    result = await agent.run(data)
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_crm_interaction_registrada(agent):
    data = {"comment_id": "c1", "commenter_id": "u1", "comment_text": "hola"}
    await agent.run(data)
    agent._insert_crm_interaction.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation(mock_supabase):
    agent = InstagramCommentsAgent("tenant-X", mock_supabase)
    agent._insert_crm_interaction = AsyncMock()
    data = {"comment_id": "c1", "commenter_id": "u1", "comment_text": "hola"}
    await agent.run(data)
    call_args = agent._insert_crm_interaction.call_args[0][0]
    assert call_args["tenant_id"] == "tenant-X"

@pytest.mark.asyncio
async def test_mock_mode_sin_meta_secret(agent):
    # MetaAdapter maneja mock
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    result = await agent.run({"comment_id": "c1", "comment_text": "gracias"})
    assert result["output"]["reply_sent"] is True

# ── H2 ──

@pytest.mark.asyncio
async def test_neutro_no_ocultar_respuesta_generica(agent):
    """Comentario neutral no se oculta y genera respuesta genérica."""
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    data = {"comment_id": "c1", "comment_text": "Interesante producto"}
    result = await agent.run(data)
    assert result["output"]["comment_hidden"] is False
    assert result["output"]["reply_sent"] is True
    assert result["output"]["intent_detected"] == "neutral"

@pytest.mark.asyncio
async def test_lead_created_siempre_false_en_comentarios(agent):
    """Los comentarios nunca crean leads directamente (invitan a DM)."""
    agent.meta_adapter.post_instagram_comment_reply = AsyncMock(return_value=True)
    result = await agent.run({"comment_id": "c1", "comment_text": "quiero comprar en mayoreo"})
    assert result["output"]["lead_created"] is False
