"""
KINEXIS — 43 Agentes Especializados
Each import is wrapped in try/except so a single stub failure never blocks startup.
"""
import logging

_log = logging.getLogger(__name__)

def _safe_import(module_path: str, symbol: str):
    try:
        mod = __import__(module_path, fromlist=[symbol])
        return getattr(mod, symbol)
    except Exception as exc:
        _log.warning("Agent import skipped [%s.%s]: %s", module_path, symbol, exc)
        return None

# ── Core ──────────────────────────────────────────────────────────────────────
guardian   = _safe_import("src.agents.core.agent_00_guardian", "guardian")
validation = _safe_import("src.agents.core.agent_26_validation", "validation")

# ── E-commerce ────────────────────────────────────────────────────────────────
ml_fulfillment      = _safe_import("src.agents.ecommerce.agent_01_ml_fulfillment", "ml_fulfillment")
amazon_fba          = _safe_import("src.agents.ecommerce.agent_02_amazon_fba", "amazon_fba")
shopify_fulfillment = _safe_import("src.agents.ecommerce.agent_03_shopify_fulfillment", "shopify_fulfillment")
price_manager       = _safe_import("src.agents.ecommerce.agent_06_price_manager", "price_manager")
returns_manager     = _safe_import("src.agents.ecommerce.agent_14_returns_manager", "returns_manager")
ml_questions        = _safe_import("src.agents.ecommerce.agent_27_ml_questions", "ml_questions")

# ── ERP ───────────────────────────────────────────────────────────────────────
inventory_monitor = _safe_import("src.agents.erp.agent_05_inventory_monitor", "inventory_monitor")
cfdi_billing      = _safe_import("src.agents.erp.agent_13_cfdi_billing", "cfdi_billing")
supplier_evaluator = _safe_import("src.agents.erp.agent_16_supplier_evaluator", "supplier_evaluator")
finance_snapshot  = _safe_import("src.agents.erp.agent_18_finance_snapshot", "finance_snapshot")
thermal_printer   = _safe_import("src.agents.erp.agent_24_thermal_printer", "thermal_printer")
skydrop_shipping  = _safe_import("src.agents.erp.agent_25_skydrop_shipping", "skydrop_shipping")
purchase_orders   = _safe_import("src.agents.erp.agent_30_purchase_orders", "purchase_orders")

# ── Meta ──────────────────────────────────────────────────────────────────────
wa_agent          = _safe_import("src.agents.meta.agent_wa_whatsapp", "wa_agent")
ig_agent          = _safe_import("src.agents.meta.agent_ig_instagram", "ig_agent")
fb_agent          = _safe_import("src.agents.meta.agent_fb_facebook", "fb_agent")
ads_manager       = _safe_import("src.agents.meta.agent_12_ads_manager", "ads_manager")
content_publisher = _safe_import("src.agents.meta.agent_content_publisher", "content_publisher")

# ── CRM ───────────────────────────────────────────────────────────────────────
b2b_collector  = _safe_import("src.agents.crm.agent_04_b2b_collector", "b2b_collector")
nps_collector  = _safe_import("src.agents.crm.agent_19_nps_collector", "nps_collector")
lead_scorer    = _safe_import("src.agents.crm.agent_31_lead_scorer", "lead_scorer")
quote_generator = _safe_import("src.agents.crm.agent_32_quote_generator", "quote_generator")
follow_up      = _safe_import("src.agents.crm.agent_33_follow_up", "follow_up")
support_tickets = _safe_import("src.agents.crm.agent_37_support_tickets", "support_tickets")
