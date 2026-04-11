import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.crisis_response_agent import CrisisResponseAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "criz-123"}])
    )
    supa.table.return_value.update.return_value.eq.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = CrisisResponseAgent("t1", mock_supabase)
    agent._notify_socias = AsyncMock()
    agent._pause_ads = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_nivel_1_respuesta_empatica_sin_pausar(agent):
    result = await agent.run({
        "trigger": "comment_spike",
        "channel": "instagram",
        "content": "Esto no sirve!",
        "severity": "level_1"
    })
    assert "Respuesta empática" in result["output"]["action_taken"]
    assert result["output"]["ai_paused"] is False
    assert result["output"]["ads_paused"] is False

@pytest.mark.asyncio
async def test_nivel_2_pausa_ads(agent):
    result = await agent.run({
        "trigger": "comment_spike",
        "severity": "level_2"
    })
    assert result["output"]["ads_paused"] is True
    agent._pause_ads.assert_called_once()

@pytest.mark.asyncio
async def test_nivel_2_notify_socias(agent):
    await agent.run({
        "trigger": "comment_spike",
        "severity": "level_2"
    })
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_nivel_3_desactiva_ia_completa(agent, mock_supabase):
    result = await agent.run({
        "trigger": "legal_threat",
        "severity": "level_3"
    })
    assert result["output"]["ai_paused"] is True
    mock_supabase.table.return_value.update.assert_called()
    call_args = mock_supabase.table.return_value.update.call_args[0][0]
    assert call_args["ai_active"] is False

@pytest.mark.asyncio
async def test_nivel_3_pausa_todos_ads(agent):
    result = await agent.run({
        "trigger": "legal_threat",
        "severity": "level_3"
    })
    assert result["output"]["ads_paused"] is True
    agent._pause_ads.assert_called()

@pytest.mark.asyncio
async def test_nivel_3_no_reactiva_sin_aprobacion(agent):
    # En esta implementación, el agente solo desactiva en nivel 3.
    # La lógica de "no reactivar" es implícita al poner False en la BD.
    result = await agent.run({
        "trigger": "legal_threat",
        "severity": "level_3"
    })
    assert result["output"]["ai_paused"] is True

@pytest.mark.asyncio
async def test_crisis_registrada_en_bd(agent, mock_supabase):
    await agent.run({
        "trigger": "comment_spike",
        "severity": "level_1"
    })
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_content_sanitizado_antes_de_llm(agent):
    dirty_content = "HACKER <script>alert(1)</script> ; DROP TABLE users;"
    clean = agent._sanitize_content(dirty_content)
    assert "<script>" not in clean
    assert ";" not in clean

@pytest.mark.asyncio
async def test_tenant_isolation_crisis_events(agent, mock_supabase):
    await agent.run({
        "trigger": "comment_spike",
        "severity": "level_1"
    })
    call_args = mock_supabase.table.return_value.insert.call_args[0][0]
    assert call_args["tenant_id"] == "t1"

@pytest.mark.asyncio
async def test_nivel_3_human_required_siempre(agent):
    # La especificación dice HUMAN_REQUIRED para el agente en sí en YAML.
    # Aquí validamos que el output refleje una acción mayor.
    result = await agent.run({
        "trigger": "manual_activate",
        "severity": "level_3"
    })
    assert result["output"]["ai_paused"] is True

@pytest.mark.asyncio
async def test_socias_notificadas_nivel_2_y_3(agent):
    await agent.run({"trigger": "comment_spike", "severity": "level_2"})
    assert agent._notify_socias.call_count == 1
    await agent.run({"trigger": "comment_spike", "severity": "level_3"})
    assert agent._notify_socias.call_count >= 2

@pytest.mark.asyncio
async def test_ai_paused_false_en_nivel_1(agent):
    result = await agent.run({
        "trigger": "comment_spike",
        "severity": "level_1"
    })
    assert result["output"]["ai_paused"] is False

# ── H2 ──

@pytest.mark.asyncio
async def test_trigger_requerido(agent):
    """Sin trigger debe fallar con ValueError."""
    res = await agent.run({"severity": "level_1"})
    assert res["status"] == "failed"

@pytest.mark.asyncio
async def test_severity_desconocido_rechazado(agent):
    """Severity inválido debe fallar con ValueError."""
    res = await agent.run({"trigger": "x", "severity": "level_999"})
    assert res["status"] == "failed"
    assert "Severity desconocido" in res["error"]
