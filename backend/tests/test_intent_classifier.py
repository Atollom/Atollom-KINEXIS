"""
Tests para IntentClassifier.

Unit tests: sin red, sin LLM.

Correr:
    pytest tests/test_intent_classifier.py -v
"""

import pytest
from src.services.intent_classifier import IntentClassifier, IntentResult

# ── Fixture ───────────────────────────────────────────────────────────────────

@pytest.fixture
def clf():
    return IntentClassifier()


# ── Helpers ───────────────────────────────────────────────────────────────────

def assert_agent(result: IntentResult, expected_agent: str):
    assert result.intent == "agent", f"Expected 'agent', got '{result.intent}'"
    assert result.agent_id == expected_agent, f"Expected {expected_agent}, got {result.agent_id}"
    assert result.confidence >= 0.7


def assert_conversational(result: IntentResult):
    assert result.intent == "conversational", f"Expected 'conversational', got '{result.intent}'"
    assert result.agent_id is None


# ─────────────────────────────────────────────────────────────────────────────
# agent_05_inventory_monitor
# ─────────────────────────────────────────────────────────────────────────────

class TestInventoryIntent:
    def test_stock_with_sku(self, clf):
        r = clf.classify("¿Cuánto stock tiene SKU-001?")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args["action"] == "check_stock"
        assert r.args.get("sku") == "SKU-001"

    def test_inventario_keyword(self, clf):
        r = clf.classify("Muéstrame el inventario completo")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args["action"] == "check_stock"

    def test_bajo_stock_alert(self, clf):
        r = clf.classify("¿Qué productos tienen bajo stock?")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args["action"] == "get_alerts"

    def test_alertas_inventario(self, clf):
        r = clf.classify("Dame las alertas de inventario")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args["action"] == "get_alerts"

    def test_reorden(self, clf):
        r = clf.classify("¿Qué necesito reordenar?")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args["action"] == "suggest_reorder"

    def test_sku_extraction_variant(self, clf):
        r = clf.classify("Dime el stock del producto TAL-003")
        assert_agent(r, "agent_05_inventory_monitor")
        assert r.args.get("sku") == "TAL-003"


# ─────────────────────────────────────────────────────────────────────────────
# agent_18_finance_snapshot
# ─────────────────────────────────────────────────────────────────────────────

class TestFinanceIntent:
    def test_reporte_financiero_mes(self, clf):
        r = clf.classify("Dame el reporte financiero del mes")
        assert_agent(r, "agent_18_finance_snapshot")
        assert r.args["period"] == "month"

    def test_flujo_de_efectivo(self, clf):
        r = clf.classify("¿Cuál es el flujo de efectivo?")
        assert_agent(r, "agent_18_finance_snapshot")
        assert "cashflow" in r.args["include"]

    def test_cxc(self, clf):
        r = clf.classify("Muéstrame las CxC de la semana")
        assert_agent(r, "agent_18_finance_snapshot")
        assert r.args["period"] == "week"
        assert "receivables" in r.args["include"]

    def test_cxp(self, clf):
        r = clf.classify("¿Cuánto tenemos en cuentas por pagar?")
        assert_agent(r, "agent_18_finance_snapshot")
        assert "payables" in r.args["include"]

    def test_period_today(self, clf):
        r = clf.classify("Estado de finanzas de hoy")
        assert_agent(r, "agent_18_finance_snapshot")
        assert r.args["period"] == "today"

    def test_period_quarter(self, clf):
        r = clf.classify("Reporte financiero del trimestre")
        assert_agent(r, "agent_18_finance_snapshot")
        assert r.args["period"] == "quarter"


# ─────────────────────────────────────────────────────────────────────────────
# agent_06_price_manager
# ─────────────────────────────────────────────────────────────────────────────

class TestPriceIntent:
    def test_actualizar_precio(self, clf):
        r = clf.classify("Actualiza el precio de SKU-003 a $450")
        assert_agent(r, "agent_06_price_manager")
        assert r.args.get("sku") == "SKU-003"
        assert r.args.get("base_price") == 450.0

    def test_cambiar_precio(self, clf):
        r = clf.classify("Cambia el precio del producto")
        assert_agent(r, "agent_06_price_manager")

    def test_channels_default(self, clf):
        r = clf.classify("Modifica el precio a $300")
        assert_agent(r, "agent_06_price_manager")
        assert r.args.get("channels") == ["ml", "amazon", "shopify"]


# ─────────────────────────────────────────────────────────────────────────────
# agent_32_quote_generator
# ─────────────────────────────────────────────────────────────────────────────

class TestQuoteIntent:
    def test_cotizacion_trigger(self, clf):
        r = clf.classify("Genera una cotización para Constructora ABC")
        assert_agent(r, "agent_32_quote_generator")

    def test_cotizar(self, clf):
        r = clf.classify("Cotízame 50 taladros a $450 c/u")
        assert_agent(r, "agent_32_quote_generator")

    def test_presupuesto(self, clf):
        r = clf.classify("Necesito un presupuesto para el cliente")
        assert_agent(r, "agent_32_quote_generator")

    def test_empty_args_signals_llm_needed(self, clf):
        r = clf.classify("Genera cotización para empresa XYZ")
        assert_agent(r, "agent_32_quote_generator")
        assert r.args == {}  # Gemini debe extraer los detalles
        assert r.method == "regex+llm"


# ─────────────────────────────────────────────────────────────────────────────
# agent_13_cfdi_billing
# ─────────────────────────────────────────────────────────────────────────────

class TestCFDIIntent:
    def test_factura_trigger(self, clf):
        r = clf.classify("Genera una factura para RFC ABC010101AAA")
        assert_agent(r, "agent_13_cfdi_billing")

    def test_facturar(self, clf):
        r = clf.classify("Necesito facturar la venta de hoy")
        assert_agent(r, "agent_13_cfdi_billing")

    def test_cfdi_keyword(self, clf):
        r = clf.classify("Crea el CFDI 4.0 para el cliente")
        assert_agent(r, "agent_13_cfdi_billing")


# ─────────────────────────────────────────────────────────────────────────────
# agent_33_follow_up
# ─────────────────────────────────────────────────────────────────────────────

class TestFollowUpIntent:
    def test_seguimiento_trigger(self, clf):
        r = clf.classify("¿Qué leads necesitan seguimiento?")
        assert_agent(r, "agent_33_follow_up")

    def test_lead_inactivo(self, clf):
        r = clf.classify("Hay leads sin respuesta esta semana")
        assert_agent(r, "agent_33_follow_up")

    def test_follow_up(self, clf):
        r = clf.classify("Genera follow-up para Constructora ABC")
        assert_agent(r, "agent_33_follow_up")


# ─────────────────────────────────────────────────────────────────────────────
# agent_27_ml_questions
# ─────────────────────────────────────────────────────────────────────────────

class TestMLQuestionsIntent:
    def test_preguntas_ml(self, clf):
        r = clf.classify("Responde las preguntas pendientes en Mercado Libre")
        assert_agent(r, "agent_27_ml_questions")

    def test_preguntas_de_ml(self, clf):
        r = clf.classify("Hay preguntas de ML sin responder")
        assert_agent(r, "agent_27_ml_questions")


# ─────────────────────────────────────────────────────────────────────────────
# Conversational detection
# ─────────────────────────────────────────────────────────────────────────────

class TestConversational:
    def test_hola(self, clf):
        assert_conversational(clf.classify("Hola"))

    def test_buenos_dias(self, clf):
        assert_conversational(clf.classify("Buenos días Samantha"))

    def test_quien_eres(self, clf):
        assert_conversational(clf.classify("¿Quién eres?"))

    def test_gracias(self, clf):
        assert_conversational(clf.classify("Gracias"))

    def test_short_query(self, clf):
        assert_conversational(clf.classify("ok"))

    def test_generic_question_no_agent(self, clf):
        r = clf.classify("¿Cómo estás hoy?")
        assert_conversational(r)


# ─────────────────────────────────────────────────────────────────────────────
# Param extractors (unit tests on helpers)
# ─────────────────────────────────────────────────────────────────────────────

class TestParamExtractors:
    def test_sku_extraction(self, clf):
        from src.services.intent_classifier import _extract_sku
        assert _extract_sku("Stock del SKU-001") == "SKU-001"
        assert _extract_sku("Producto TAL-003") == "TAL-003"
        assert _extract_sku("Sin SKU aquí") is None

    def test_price_extraction(self, clf):
        from src.services.intent_classifier import _extract_price
        assert _extract_price("precio de $450") == 450.0
        assert _extract_price("precio de $1,200.50") == 1200.50
        assert _extract_price("sin precio") is None

    def test_period_extraction(self, clf):
        from src.services.intent_classifier import _extract_period
        assert _extract_period("reporte de hoy") == "today"
        assert _extract_period("resumen de la semana") == "week"
        assert _extract_period("del trimestre") == "quarter"
        assert _extract_period("del mes") == "month"
        assert _extract_period("algo genérico") == "month"  # default

    def test_sections_extraction(self, clf):
        from src.services.intent_classifier import _extract_sections
        assert "receivables" in _extract_sections("cuentas por cobrar")
        assert "payables" in _extract_sections("cuentas por pagar")
        assert "cashflow" in _extract_sections("flujo de efectivo")
        assert "sales" in _extract_sections("ventas del mes")
        # No keyword → all sections
        assert len(_extract_sections("reporte financiero")) == 4
