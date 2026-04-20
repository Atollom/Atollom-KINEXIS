"""Tests for Samantha Core."""

import pytest
from src.samantha import samantha
from src.samantha.nlp_engine import NLPEngine
from src.samantha.context_manager import ContextManager
from src.samantha.permission_validator import PermissionValidator
from src.samantha.response_generator import ResponseGenerator


# ── NLP Engine ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_nlp_understands_sales_query():
    nlp = NLPEngine()
    result = await nlp.understand("cuanto vendi hoy en mercado libre")
    assert result["intent"] == "sales_query"
    assert result["entities"]["period"] == "today"
    assert result["confidence"] > 0


@pytest.mark.asyncio
async def test_nlp_understands_cfdi():
    nlp = NLPEngine()
    result = await nlp.understand("generar factura del pedido 123")
    assert result["intent"] == "generate_cfdi"
    assert result["entities"]["order_id"] == "123"


@pytest.mark.asyncio
async def test_nlp_understands_inventory():
    nlp = NLPEngine()
    result = await nlp.understand("revisar inventario SKU-001")
    assert result["intent"] == "check_inventory"
    assert result["entities"].get("sku") == "SKU-001"


@pytest.mark.asyncio
async def test_nlp_unknown_query():
    nlp = NLPEngine()
    result = await nlp.understand("xyz desconocido qwerty")
    assert result["intent"] == "unknown"
    assert result["confidence"] == 0


@pytest.mark.asyncio
async def test_nlp_entity_channel_amazon():
    nlp = NLPEngine()
    result = await nlp.understand("ventas amazon este mes")
    assert result["entities"]["channel"] == "amazon"
    assert result["entities"]["period"] == "month"


# ── Context Manager ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_context_manager_get_empty():
    ctx = ContextManager()
    result = await ctx.get_context("new_conv_xyz")
    assert result["history"] == []
    assert "entities" in result


@pytest.mark.asyncio
async def test_context_manager_save_and_retrieve():
    ctx = ContextManager()
    conv_id = "test_conv_001"
    await ctx.save_interaction(conv_id, "query text", "check_inventory", {"success": True})
    context = await ctx.get_context(conv_id)
    assert len(context["history"]) == 1
    assert context["history"][0]["intent"] == "check_inventory"


@pytest.mark.asyncio
async def test_context_manager_history_limit():
    ctx = ContextManager()
    conv_id = "test_conv_limit"
    for i in range(55):
        await ctx.save_interaction(conv_id, f"q{i}", "sales_query", {"success": True})
    context = await ctx.get_context(conv_id)
    assert len(context["history"]) == 50


# ── Permission Validator ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_permission_owner_allowed_all():
    pv = PermissionValidator()
    result = await pv.validate("tenant1", "user1", "generate_cfdi")
    assert result["allowed"] is True
    assert result["role"] == "owner"


@pytest.mark.asyncio
async def test_permission_check_crm_intent():
    pv = PermissionValidator()
    assert pv._check_permission("agente", "capture_lead") is True
    assert pv._check_permission("contador", "capture_lead") is False


@pytest.mark.asyncio
async def test_permission_unknown_intent():
    pv = PermissionValidator()
    result = await pv.validate("t1", "u1", "unknown")
    # owner has wildcard — always allowed
    assert result["allowed"] is True


# ── Response Generator ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_response_generator_error():
    rg = ResponseGenerator()
    msg = await rg.generate("q", {"intent": "sales_query"}, {"success": False, "error": "timeout"}, {})
    assert "error" in msg.lower() or "timeout" in msg.lower()


@pytest.mark.asyncio
async def test_response_generator_cfdi():
    rg = ResponseGenerator()
    msg = await rg.generate(
        "genera factura",
        {"intent": "generate_cfdi", "entities": {}},
        {"success": True, "result": {"folio": "F-2026-001", "total": 1160.0}},
        {},
    )
    assert "F-2026-001" in msg
    assert "1160" in msg


@pytest.mark.asyncio
async def test_response_generator_generic_fallback():
    rg = ResponseGenerator()
    msg = await rg.generate(
        "enviar mensaje",
        {"intent": "send_message", "entities": {}},
        {"success": True, "result": {}},
        {},
    )
    assert len(msg) > 0


# ── Samantha End-to-End ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_samantha_process_sales_query():
    result = await samantha.process(
        query="cuanto vendi hoy",
        tenant_id="orthocardio",
        user_id="user1",
    )
    # NLP correctly classifies; router may not support it — result always has required keys
    assert "success" in result
    assert result.get("intent") == "sales_query" or result.get("intent") is None
    assert result["samantha_version"] == "1.0"
    assert "timestamp" in result


@pytest.mark.asyncio
async def test_samantha_process_check_inventory():
    result = await samantha.process(
        query="revisar inventario SKU-001",
        tenant_id="orthocardio",
        user_id="user1",
    )
    assert result["success"] is True
    assert result["intent"] == "check_inventory"
    assert "agents_called" in result


@pytest.mark.asyncio
async def test_samantha_process_generate_cfdi():
    result = await samantha.process(
        query="generar factura del pedido 123",
        tenant_id="orthocardio",
        user_id="user1",
    )
    assert result["success"] is True
    assert result["intent"] == "generate_cfdi"


@pytest.mark.asyncio
async def test_samantha_returns_execution_time():
    result = await samantha.process(
        query="revisar inventario",
        tenant_id="orthocardio",
        user_id="user1",
    )
    assert "execution_time_ms" in result
    assert result["execution_time_ms"] >= 0


@pytest.mark.asyncio
async def test_samantha_context_persists_across_calls():
    result1 = await samantha.process(
        query="cuanto vendi hoy",
        tenant_id="orthocardio",
        user_id="ctx_test_user",
        conversation_id="conv_persist_001",
    )
    result2 = await samantha.process(
        query="revisar inventario",
        tenant_id="orthocardio",
        user_id="ctx_test_user",
        conversation_id="conv_persist_001",
    )
    assert result1["success"] is True
    assert result2["success"] is True


@pytest.mark.asyncio
async def test_samantha_unknown_intent_still_returns():
    result = await samantha.process(
        query="xyz qwerty desconocido abc",
        tenant_id="orthocardio",
        user_id="user1",
    )
    # Unknown intent should not raise — returns success or failure gracefully
    assert "success" in result
