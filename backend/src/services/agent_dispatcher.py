"""
AgentDispatcher — Loads, executes, and formats agent results for Samantha.

Supports the 7 Day-2 priority agents. Adding a new agent:
  1. Add entry to _AGENT_REGISTRY
  2. Add format template to _FORMAT_TEMPLATES (optional fallback)
"""

import asyncio
import json
import logging
import os
from functools import partial
from typing import Any, Dict, Optional

from src.services.intent_classifier import IntentResult

logger = logging.getLogger(__name__)


# ── Agent registry ────────────────────────────────────────────────────────────
# Lazy imports: tuples of (module_path, class_name)

_AGENT_REGISTRY: Dict[str, tuple] = {
    # Day 2 Phase 1 — priority agents
    "agent_05_inventory_monitor":  ("src.agents.erp.agent_05_inventory_monitor",  "Agent05InventoryMonitor"),
    "agent_18_finance_snapshot":   ("src.agents.erp.agent_18_finance_snapshot",   "Agent18FinanceSnapshot"),
    "agent_06_price_manager":      ("src.agents.ecommerce.agent_06_price_manager", "Agent06PriceManager"),
    "agent_32_quote_generator":    ("src.agents.crm.agent_32_quote_generator",    "Agent32QuoteGenerator"),
    "agent_13_cfdi_billing":       ("src.agents.erp.agent_13_cfdi_billing",       "Agent13CFDIBilling"),
    "agent_33_follow_up":          ("src.agents.crm.agent_33_follow_up",          "Agent33FollowUp"),
    "agent_27_ml_questions":       ("src.agents.ecommerce.agent_27_ml_questions", "Agent27MLQuestions"),
    # Day 2 Phase 2 — all remaining agents
    "agent_01_ml_fulfillment":     ("src.agents.ecommerce.agent_01_ml_fulfillment",  "Agent01MLFulfillment"),
    "agent_02_amazon_fba":         ("src.agents.ecommerce.agent_02_amazon_fba",      "Agent02AmazonFBA"),
    "agent_03_shopify_fulfillment":("src.agents.ecommerce.agent_03_shopify_fulfillment", "Agent03ShopifyFulfillment"),
    "agent_04_b2b_collector":      ("src.agents.crm.agent_04_b2b_collector",         "Agent04B2BCollector"),
    "agent_14_returns_manager":    ("src.agents.ecommerce.agent_14_returns_manager",  "Agent14ReturnsManager"),
    "agent_16_supplier_evaluator": ("src.agents.erp.agent_16_supplier_evaluator",    "Agent16SupplierEvaluator"),
    "agent_19_nps_collector":      ("src.agents.crm.agent_19_nps_collector",         "Agent19NPSCollector"),
    "agent_24_thermal_printer":    ("src.agents.erp.agent_24_thermal_printer",       "Agent24ThermalPrinter"),
    "agent_25_skydrop_shipping":   ("src.agents.erp.agent_25_skydrop_shipping",      "Agent25SkydropShipping"),
    "agent_30_purchase_orders":    ("src.agents.erp.agent_30_purchase_orders",       "Agent30PurchaseOrders"),
    "agent_31_lead_scorer":        ("src.agents.crm.agent_31_lead_scorer",           "Agent31LeadScorer"),
    "agent_37_support_tickets":    ("src.agents.crm.agent_37_support_tickets",       "Agent37SupportTickets"),
    # New agents — batch 3
    "agent_07_ml_analytics":      ("src.agents.ecommerce.agent_07_ml_analytics",    "Agent07MLAnalytics"),
    "agent_08_amazon_analytics":  ("src.agents.ecommerce.agent_08_amazon_analytics","Agent08AmazonAnalytics"),
    "agent_09_shopify_analytics": ("src.agents.ecommerce.agent_09_shopify_analytics","Agent09ShopifyAnalytics"),
    "agent_10_inventory_sync":    ("src.agents.ecommerce.agent_10_inventory_sync",  "Agent10InventorySync"),
    "agent_11_competitor_monitor":("src.agents.ecommerce.agent_11_competitor_monitor","Agent11CompetitorMonitor"),
    "agent_15_invoice_reconciler":("src.agents.erp.agent_15_invoice_reconciler",    "Agent15InvoiceReconciler"),
    "agent_17_cashflow_projector":("src.agents.erp.agent_17_cashflow_projector",    "Agent17CashflowProjector"),
    "agent_28_warehouse_manager": ("src.agents.erp.agent_28_warehouse_manager",     "Agent28WarehouseManager"),
    "agent_29_carrier_comparator":("src.agents.erp.agent_29_carrier_comparator",    "Agent29CarrierComparator"),
    "agent_20_customer_segmentation": ("src.agents.crm.agent_20_customer_segmentation", "Agent20CustomerSegmentation"),
    "agent_21_churn_predictor":   ("src.agents.crm.agent_21_churn_predictor",       "Agent21ChurnPredictor"),
    "agent_22_upsell_recommender":("src.agents.crm.agent_22_upsell_recommender",    "Agent22UpsellRecommender"),
    "agent_23_customer_ltv":      ("src.agents.crm.agent_23_customer_ltv",          "Agent23CustomerLTV"),
    "agent_34_review_aggregator": ("src.agents.crm.agent_34_review_aggregator",     "Agent34ReviewAggregator"),
    "agent_35_social_monitor":    ("src.agents.crm.agent_35_social_monitor",        "Agent35SocialMonitor"),
    "agent_36_survey_builder":    ("src.agents.crm.agent_36_survey_builder",        "Agent36SurveyBuilder"),
    "agent_12_ads_manager":        ("src.agents.meta.agent_12_ads_manager",          "Agent12AdsManager"),
    "agent_content_publisher":     ("src.agents.meta.agent_content_publisher",       "AgentContentPublisher"),
    "agent_wa_whatsapp":           ("src.agents.meta.agent_wa_whatsapp",             "AgentWAWhatsApp"),
    "agent_ig_instagram":          ("src.agents.meta.agent_ig_instagram",            "AgentIGInstagram"),
    "agent_fb_facebook":           ("src.agents.meta.agent_fb_facebook",             "AgentFBFacebook"),
}

# ── Plain-text fallback formatters (used when Gemini is unavailable) ──────────

def _fmt_inventory(data: Dict, query: str) -> str:
    action = data.get("action", "check_stock")
    if action == "check_stock":
        items = data.get("items", [])
        if not items:
            return "No encontré productos en el inventario con esos criterios."
        lines = ["**Stock actual:**"]
        for it in items[:10]:
            status_icon = {"ok": "✅", "low": "⚠️", "critical": "🔴", "out_of_stock": "⛔"}.get(it["status"], "❓")
            lines.append(f"- {it['sku']}: **{it['current_stock']} uds** {status_icon} (mínimo: {it['minimum_stock']})")
        return "\n".join(lines)
    elif action == "get_alerts":
        alerts = data.get("alerts", [])
        if not alerts:
            return "✅ Todos los productos tienen niveles de stock adecuados."
        lines = ["**Alertas de inventario:**"]
        for a in alerts:
            lines.append(f"- **{a['sku']}**: {a['current_stock']} uds (mínimo: {a['minimum_stock']}) — {a['status'].upper()}")
        return "\n".join(lines)
    else:  # suggest_reorder
        suggestions = data.get("reorder_suggestions", [])
        if not suggestions:
            return "No hay sugerencias de reorden en este momento."
        lines = ["**Sugerencias de reorden:**"]
        for s in suggestions:
            lines.append(f"- **{s['sku']}**: {s['current_stock']} uds disponibles — reordenar {s.get('suggestion', '')}")
        return "\n".join(lines)


def _fmt_finance(data: Dict, query: str) -> str:
    period_labels = {"today": "hoy", "week": "esta semana", "month": "este mes", "quarter": "este trimestre"}
    period = period_labels.get(data.get("period", "month"), data.get("period", "mes"))
    snap = data.get("snapshot", {})
    lines = [f"**Reporte financiero — {period}:**"]
    if "sales" in snap:
        s = snap["sales"]
        lines.append(f"- 💰 Ventas: **${s['total']:,.0f} MXN** ({s['count']} órdenes, promedio ${s['average']:,.0f})")
    if "receivables" in snap:
        r = snap["receivables"]
        lines.append(f"- 📥 CxC: **${r['total']:,.0f} MXN** ({r['count']} clientes) — vencidas: ${r['overdue']:,.0f}")
    if "payables" in snap:
        p = snap["payables"]
        lines.append(f"- 📤 CxP: **${p['total']:,.0f} MXN** — próximas a vencer: ${p['due_soon']:,.0f}")
    if "cashflow" in snap:
        c = snap["cashflow"]
        sign = "+" if c['net'] >= 0 else ""
        lines.append(f"- 💵 Flujo neto: **{sign}${c['net']:,.0f} MXN**")
    alerts = data.get("alerts", [])
    if alerts:
        lines.append("\n**Alertas:**")
        for a in alerts:
            lines.append(f"- ⚠️ {a}")
    return "\n".join(lines)


def _fmt_price(data: Dict, query: str) -> str:
    results = data.get("results", [])
    if not results:
        sku = data.get("sku", "SKU")
        return f"Precio actualizado para **{sku}** en los canales configurados."
    lines = ["**Precios actualizados:**"]
    for r in results:
        lines.append(f"- {r.get('channel', '').upper()}: **${r.get('price', 0):,.2f} MXN**")
    return "\n".join(lines)


def _fmt_quote(data: Dict, query: str) -> str:
    quote_number = data.get("quote_number", "")
    customer = data.get("customer_name", "")
    total = data.get("total", 0)
    valid_until = data.get("valid_until", "")
    lines = [
        f"**Cotización {quote_number}** generada para **{customer}**",
        f"- Total: **${total:,.2f} MXN** (IVA incluido)",
    ]
    if valid_until:
        lines.append(f"- Válida hasta: {valid_until}")
    items = data.get("items", [])
    if items:
        lines.append("\n**Conceptos:**")
        for it in items[:5]:
            lines.append(f"  - {it.get('description', it.get('name', ''))} ×{it.get('quantity', 1)} — ${float(it.get('unit_price', 0)):,.2f}")
    return "\n".join(lines)


def _fmt_cfdi(data: Dict, query: str) -> str:
    folio = data.get("folio", "")
    uuid = data.get("uuid", "en proceso")
    total = data.get("total", 0)
    return (
        f"✅ **Factura CFDI 4.0 generada**\n"
        f"- Folio: **{folio}**\n"
        f"- UUID (timbre SAT): `{uuid}`\n"
        f"- Total: **${total:,.2f} MXN**"
    )


def _fmt_followup(data: Dict, query: str) -> str:
    message = data.get("message_preview", "")
    action = data.get("action", "")
    days = data.get("days_inactive", 0)
    if not action:
        return "No se requiere seguimiento en este momento."
    lines = [
        f"**Seguimiento sugerido** (inactivo {days} días):",
        f"- Acción: `{action}`",
    ]
    if message:
        lines.append(f"- Mensaje: *\"{message}\"*")
    return "\n".join(lines)


def _fmt_ml_questions(data: Dict, query: str) -> str:
    category = data.get("category", "general")
    answer = data.get("answer", "")
    escalated = data.get("escalate_to_human", False)
    if escalated:
        return f"⚠️ Pregunta de ML escalada a soporte humano (categoría: {category})."
    return (
        f"**Respuesta enviada en ML:**\n"
        f"- Categoría: {category}\n"
        f"- Respuesta: *\"{answer[:200]}\"*"
    )


def _fmt_fulfillment(data: Dict, query: str) -> str:
    order_id = data.get("order_id", "")
    status = data.get("status", "procesada")
    tracking = data.get("tracking_number", "")
    lines = [f"✅ **Orden {order_id} despachada** — estado: {status}"]
    if tracking:
        lines.append(f"- Guía de rastreo: `{tracking}`")
    return "\n".join(lines)


def _fmt_amazon_fba(data: Dict, query: str) -> str:
    action = data.get("action", "")
    if action == "sync_inventory":
        synced = data.get("synced_skus", 0)
        return f"✅ Inventario Amazon FBA sincronizado — **{synced} SKUs** actualizados."
    if action == "create_shipment":
        shipment_id = data.get("shipment_id", "")
        return f"✅ Shipment FBA creado: **{shipment_id}**"
    status = data.get("status", "")
    return f"Estado del shipment Amazon FBA: **{status}**"


def _fmt_returns(data: Dict, query: str) -> str:
    order_id = data.get("order_id", "")
    refund = data.get("refund_amount", 0)
    label = data.get("return_label_url", "")
    lines = [
        f"✅ **Devolución procesada** — Orden {order_id}",
        f"- Reembolso: **${refund:,.2f} MXN**",
    ]
    if label:
        lines.append(f"- Etiqueta de retorno: {label}")
    return "\n".join(lines)


def _fmt_supplier(data: Dict, query: str) -> str:
    recommended = data.get("recommended", {})
    name = recommended.get("name", "N/A")
    score = recommended.get("score", 0)
    lines = [f"**Proveedor recomendado: {name}** (score: {score:.0f}/100)"]
    all_suppliers = data.get("ranked", [])
    if len(all_suppliers) > 1:
        lines.append("\n**Ranking completo:**")
        for i, s in enumerate(all_suppliers[:5], 1):
            lines.append(f"{i}. {s.get('name', '')} — {s.get('score', 0):.0f} pts")
    return "\n".join(lines)


def _fmt_nps(data: Dict, query: str) -> str:
    score = data.get("score", 0)
    category = data.get("category", "")
    sentiment = data.get("sentiment", "")
    icons = {"promotor": "⭐", "pasivo": "😐", "detractor": "⚠️"}
    return (
        f"{icons.get(category, '📊')} **NPS registrado**: score **{score}/10** — "
        f"{category.upper()} ({sentiment})"
    )


def _fmt_thermal(data: Dict, query: str) -> str:
    label_type = data.get("label_type", "")
    fmt = data.get("format", "zpl")
    size = data.get("size_bytes", 0)
    return (
        f"✅ **Etiqueta generada** ({label_type.replace('_', ' ')}, {fmt.upper()})\n"
        f"- Tamaño: {size} bytes — lista para enviar a impresora térmica."
    )


def _fmt_shipping(data: Dict, query: str) -> str:
    carrier = data.get("carrier", "")
    tracking = data.get("tracking_number", "")
    cost = data.get("cost", 0)
    eta = data.get("estimated_days", "")
    return (
        f"✅ **Guía {carrier.upper()} generada**\n"
        f"- Rastreo: `{tracking}`\n"
        f"- Costo: **${cost:,.2f} MXN** | Entrega estimada: {eta} días hábiles"
    )


def _fmt_purchase_order(data: Dict, query: str) -> str:
    po_number = data.get("po_number", "")
    action = data.get("action", "")
    total = data.get("total", 0)
    status = data.get("status", "")
    return (
        f"✅ **Orden de compra {po_number}** — acción: {action}\n"
        f"- Total: **${total:,.2f} MXN** | Estado: {status}"
    )


def _fmt_lead_score(data: Dict, query: str) -> str:
    score = data.get("score", 0)
    priority = data.get("priority", "")
    icons = {"high": "🔥", "medium": "🟡", "low": "❄️"}
    breakdown = data.get("breakdown", [])
    lines = [f"{icons.get(priority, '📊')} **Lead score: {score}/100** — prioridad {priority.upper()}"]
    if breakdown:
        lines.append("\n**Factores:**")
        for b in breakdown[:5]:
            lines.append(f"- {b}")
    return "\n".join(lines)


def _fmt_b2b_lead(data: Dict, query: str) -> str:
    lead_id = data.get("lead_id", "")
    score = data.get("score", 0)
    priority = data.get("priority", "")
    next_actions = data.get("next_actions", [])
    lines = [f"✅ **Lead capturado** `{lead_id}` — score {score}/100 ({priority})"]
    if next_actions:
        lines.append("**Próximas acciones:**")
        for a in next_actions[:3]:
            lines.append(f"- {a}")
    return "\n".join(lines)


def _fmt_support_ticket(data: Dict, query: str) -> str:
    ticket_id = data.get("ticket_id", "")
    category = data.get("category", "")
    priority = data.get("priority", "")
    sla = data.get("sla", {})
    return (
        f"✅ **Ticket {ticket_id}** creado — {category} ({priority})\n"
        f"- Respuesta esperada: {sla.get('response_deadline', 'N/A')}"
    )


def _fmt_ads(data: Dict, query: str) -> str:
    action = data.get("action", "")
    campaign_id = data.get("campaign_id", "")
    if action == "get_stats":
        impressions = data.get("impressions", 0)
        clicks = data.get("clicks", 0)
        cpc = data.get("cpc", 0)
        return (
            f"**Estadísticas campaña {campaign_id}:**\n"
            f"- Impresiones: **{impressions:,}** | Clics: **{clicks:,}** | CPC: **${cpc:.2f}**"
        )
    if action == "create":
        return f"✅ **Campaña {campaign_id} creada** y activa en Meta."
    return f"✅ Campaña {campaign_id} — acción `{action}` ejecutada."


def _fmt_content(data: Dict, query: str) -> str:
    post_id = data.get("post_id", "")
    action = data.get("action", "")
    platforms = data.get("platforms", [])
    return (
        f"✅ **Contenido {action}** (ID: {post_id}) en "
        f"{', '.join(p.capitalize() for p in platforms)}"
    )


def _fmt_messaging(data: Dict, query: str) -> str:
    msg_id = data.get("message_id", data.get("wamid", ""))
    status = data.get("status", "enviado")
    return f"✅ Mensaje **{status}** — ID: `{msg_id}`"


def _fmt_ml_analytics(data: Dict, query: str) -> str:
    period = data.get("period", "mes")
    metrics = data.get("metrics", {})
    revenue = metrics.get("revenue", 0)
    orders = metrics.get("orders", 0)
    return (
        f"**Analytics ML — {period}:**\n"
        f"- 💰 Ingresos: **${revenue:,.0f} MXN** ({orders} órdenes)\n"
        f"- Ticket promedio: **${metrics.get('avg_order_value', 0):,.0f} MXN**\n"
        f"- Conversión: **{metrics.get('conversion_rate_pct', 0):.1f}%**"
    )


def _fmt_ecommerce_analytics(data: Dict, query: str) -> str:
    platform = data.get("platform", "Canal")
    metrics = data.get("metrics", {})
    revenue = metrics.get("revenue", metrics.get("total_revenue", 0))
    return f"**Analytics {platform}:** ${revenue:,.0f} MXN | {metrics.get('orders', 0)} órdenes"


def _fmt_inventory_sync(data: Dict, query: str) -> str:
    synced = data.get("synced_items", 0)
    drift = data.get("drift_found", [])
    lines = [f"✅ **Inventario sincronizado** — {synced} SKUs actualizados"]
    if drift:
        lines.append(f"⚠️ {len(drift)} SKUs con diferencia entre canales — revisar")
    return "\n".join(lines)


def _fmt_competitor(data: Dict, query: str) -> str:
    avg = data.get("market_avg_price", 0)
    position = data.get("price_position", "")
    competitors = data.get("competitors", [])
    lines = [f"**Monitor de competencia:**\n- Precio promedio mercado: **${avg:,.0f} MXN** ({position})"]
    for c in competitors[:3]:
        lines.append(f"- {c.get('title', '')[:40]}: **${c.get('price', 0):,.0f}**")
    return "\n".join(lines)


def _fmt_invoice_reconciler(data: Dict, query: str) -> str:
    summary = data.get("summary", {})
    rate = summary.get("collection_rate_pct", 0)
    pending = summary.get("total_pending", 0)
    overdue = data.get("overdue", [])
    return (
        f"**Conciliación facturas:**\n"
        f"- Tasa de cobranza: **{rate:.1f}%**\n"
        f"- Pendiente de cobro: **${pending:,.0f} MXN**\n"
        f"- Facturas vencidas: **{len(overdue)}**"
    )


def _fmt_cashflow(data: Dict, query: str) -> str:
    proj = data.get("projection", {})
    horizon = data.get("horizon_days", 30)
    net = proj.get("projected_net", 0)
    sign = "+" if net >= 0 else ""
    return (
        f"**Flujo de caja — {horizon} días:**\n"
        f"- Ingresos proyectados: **${proj.get('projected_income', 0):,.0f} MXN**\n"
        f"- Gastos proyectados: **${proj.get('projected_expenses', 0):,.0f} MXN**\n"
        f"- Flujo neto: **{sign}${net:,.0f} MXN**"
    )


def _fmt_warehouse(data: Dict, query: str) -> str:
    action = data.get("action", "")
    if action == "get_layout":
        zones = data.get("zones", [])
        pct = data.get("total_capacity_pct", 0)
        return f"**Almacén — {pct}% ocupado:**\n" + "\n".join(
            f"- Zona {z['zone']}: {z['occupied']}/{z['locations']} loc. ({z['capacity_pct']}%)" for z in zones
        )
    movements = data.get("movements", [])
    if movements:
        return f"**Últimos movimientos ({len(movements)}):**\n" + "\n".join(
            f"- {m['sku']}: {m.get('quantity', 0)} uds ({m.get('type', '')})" for m in movements[:5]
        )
    return f"**Almacén — {action}:** operación completada."


def _fmt_carrier(data: Dict, query: str) -> str:
    recommended = data.get("recommended", "")
    cheapest = data.get("cheapest", "")
    fastest = data.get("fastest", "")
    options = data.get("options", [])
    lines = [f"**Comparador de paqueterías:**\n- ⭐ Recomendado: **{recommended.upper()}**"]
    if cheapest != recommended:
        lines.append(f"- 💰 Más económico: **{cheapest.upper()}**")
    if fastest != recommended:
        lines.append(f"- ⚡ Más rápido: **{fastest.upper()}**")
    for opt in options[:3]:
        lines.append(f"- {opt['carrier'].title()}: **${opt['cost_mxn']:,.0f}** — {opt['delivery_days']} días")
    return "\n".join(lines)


def _fmt_segmentation(data: Dict, query: str) -> str:
    segments = data.get("segments", [])
    total = data.get("summary", {}).get("total_customers", 0)
    lines = [f"**Segmentación de clientes ({total} total):**"]
    for s in segments[:4]:
        lines.append(f"- {s['name']}: **{s['count']}** clientes ({s['pct']}%) — ${s.get('avg_revenue', 0):,.0f} MXN promedio")
    return "\n".join(lines)


def _fmt_churn(data: Dict, query: str) -> str:
    count = data.get("at_risk_count", 0)
    rate = data.get("churn_rate_pct", 0)
    at_risk = data.get("at_risk", [])
    lines = [f"**Predicción de churn:** {count} clientes en riesgo ({rate}% tasa estimada)"]
    for c in at_risk[:3]:
        lines.append(f"- {c['customer_id']}: {c['days_inactive']} días inactivo — LTV ${c['lifetime_value']:,.0f}")
    return "\n".join(lines)


def _fmt_upsell(data: Dict, query: str) -> str:
    recs = data.get("recommendations", [])
    value = data.get("upsell_value_mxn", 0)
    lines = [f"**Oportunidades de upsell — ${value:,.0f} MXN potencial:**"]
    for r in recs[:4]:
        lines.append(f"- {r.get('name', r.get('sku', ''))}: **${r.get('price_mxn', r.get('estimated_price_mxn', 0)):,.0f}** ({r.get('type', '')})")
    return "\n".join(lines)


def _fmt_ltv(data: Dict, query: str) -> str:
    if "customer_id" in data:
        hist = data.get("historical_ltv", 0)
        proj = data.get("projected_ltv", 0)
        segment = data.get("segment", "")
        return (
            f"**LTV de cliente — {segment}:**\n"
            f"- Histórico: **${hist:,.0f} MXN**\n"
            f"- Proyectado ({data.get('projection_months', 12)} meses): **${proj:,.0f} MXN**"
        )
    top = data.get("top_customers", [])
    lines = [f"**Top clientes por LTV ({data.get('projection_months', 12)} meses):"]
    for c in top[:5]:
        lines.append(f"- {c['customer_id']}: hist ${c['historical_ltv']:,.0f} → proy ${c['projected_ltv']:,.0f}")
    return "\n".join(lines)


def _fmt_reviews(data: Dict, query: str) -> str:
    avg = data.get("avg_rating", 0)
    total = data.get("total_reviews", 0)
    sentiment = data.get("sentiment", "")
    issues = data.get("top_issues", [])
    lines = [f"**Reseñas ({total} total) — ⭐ {avg:.1f}/5 ({sentiment})**"]
    if issues:
        lines.append("**Problemas frecuentes:**")
        for issue in issues[:3]:
            lines.append(f"- {issue}")
    return "\n".join(lines)


def _fmt_social(data: Dict, query: str) -> str:
    score = data.get("sentiment_score", 0)
    mentions = data.get("total_mentions", 0)
    reach = data.get("reach_total", 0)
    return (
        f"**Monitor social — {mentions} menciones esta semana:**\n"
        f"- Sentimiento: **{score}/100** | Alcance: **{reach:,}**\n"
        f"- Positivas: {data.get('sentiment_breakdown', {}).get('positive', 0)} | "
        f"Negativas: {data.get('sentiment_breakdown', {}).get('negative', 0)}"
    )


def _fmt_survey(data: Dict, query: str) -> str:
    action = data.get("action", "")
    if action == "create":
        return (
            f"✅ **Encuesta creada** ({data.get('survey_type', '').upper()})\n"
            f"- ID: `{data.get('survey_id', '')}`\n"
            f"- {len(data.get('questions', []))} preguntas | Link: {data.get('share_url', '')}"
        )
    if action == "send":
        return f"✅ Encuesta **{data.get('survey_id', '')}** enviada por WhatsApp al cliente."
    rate = data.get("response_rate_pct", 0)
    avg = data.get("avg_score", 0)
    return f"**Resultados encuesta:** {rate:.0f}% respuesta | Score promedio: **{avg:.1f}**"


_FORMATTERS = {
    # Phase 1
    "agent_05_inventory_monitor": _fmt_inventory,
    "agent_18_finance_snapshot":  _fmt_finance,
    "agent_06_price_manager":     _fmt_price,
    "agent_32_quote_generator":   _fmt_quote,
    "agent_13_cfdi_billing":      _fmt_cfdi,
    "agent_33_follow_up":         _fmt_followup,
    "agent_27_ml_questions":      _fmt_ml_questions,
    # Phase 2 — e-commerce
    "agent_01_ml_fulfillment":     _fmt_fulfillment,
    "agent_02_amazon_fba":         _fmt_amazon_fba,
    "agent_03_shopify_fulfillment": _fmt_fulfillment,
    "agent_14_returns_manager":    _fmt_returns,
    # Phase 2 — ERP
    "agent_16_supplier_evaluator": _fmt_supplier,
    "agent_24_thermal_printer":    _fmt_thermal,
    "agent_25_skydrop_shipping":   _fmt_shipping,
    "agent_30_purchase_orders":    _fmt_purchase_order,
    # Phase 2 — CRM
    "agent_04_b2b_collector":      _fmt_b2b_lead,
    "agent_19_nps_collector":      _fmt_nps,
    "agent_31_lead_scorer":        _fmt_lead_score,
    "agent_37_support_tickets":    _fmt_support_ticket,
    # Batch 3 — E-commerce analytics
    "agent_07_ml_analytics":       _fmt_ml_analytics,
    "agent_08_amazon_analytics":   _fmt_ecommerce_analytics,
    "agent_09_shopify_analytics":  _fmt_ecommerce_analytics,
    "agent_10_inventory_sync":     _fmt_inventory_sync,
    "agent_11_competitor_monitor": _fmt_competitor,
    # Batch 3 — ERP
    "agent_15_invoice_reconciler": _fmt_invoice_reconciler,
    "agent_17_cashflow_projector": _fmt_cashflow,
    "agent_28_warehouse_manager":  _fmt_warehouse,
    "agent_29_carrier_comparator": _fmt_carrier,
    # Batch 3 — CRM
    "agent_20_customer_segmentation": _fmt_segmentation,
    "agent_21_churn_predictor":    _fmt_churn,
    "agent_22_upsell_recommender": _fmt_upsell,
    "agent_23_customer_ltv":       _fmt_ltv,
    "agent_34_review_aggregator":  _fmt_reviews,
    "agent_35_social_monitor":     _fmt_social,
    "agent_36_survey_builder":     _fmt_survey,
    # Phase 2 — Meta
    "agent_12_ads_manager":        _fmt_ads,
    "agent_content_publisher":     _fmt_content,
    "agent_wa_whatsapp":           _fmt_messaging,
    "agent_ig_instagram":          _fmt_messaging,
    "agent_fb_facebook":           _fmt_messaging,
}


# ── Dispatcher ────────────────────────────────────────────────────────────────

class AgentDispatcher:
    """Loads agents lazily and dispatches calls from Samantha intents."""

    def __init__(self) -> None:
        self._instances: Dict[str, Any] = {}
        self._api_key = os.getenv("GOOGLE_API_KEY", "")

    def _get_agent(self, agent_id: str) -> Any:
        if agent_id in self._instances:
            return self._instances[agent_id]

        entry = _AGENT_REGISTRY.get(agent_id)
        if not entry:
            raise ValueError(f"Agent '{agent_id}' not in registry")

        module_path, class_name = entry
        import importlib
        mod = importlib.import_module(module_path)
        cls = getattr(mod, class_name)
        instance = cls()
        self._instances[agent_id] = instance
        logger.info("[DISPATCH] loaded agent: %s", agent_id)
        return instance

    async def dispatch(
        self,
        intent: IntentResult,
        tenant_id: str,
    ) -> Dict[str, Any]:
        """Execute agent and return raw result dict."""
        agent_id = intent.agent_id
        if not agent_id:
            return {"success": False, "error": "No agent_id in intent"}

        try:
            agent = self._get_agent(agent_id)
        except Exception as exc:
            logger.error("[DISPATCH] failed to load %s: %s", agent_id, exc)
            return {"success": False, "error": f"Agent load failed: {exc}"}

        input_data = {**intent.args, "tenant_id": tenant_id}
        logger.warning("[DISPATCH] calling %s with input=%s", agent_id, input_data)

        try:
            result = await agent.execute(input_data)
            logger.warning("[DISPATCH] %s result: success=%s", agent_id, result.get("success"))
            return result
        except Exception as exc:
            logger.error("[DISPATCH] %s.execute() raised: %s", agent_id, exc, exc_info=True)
            return {"success": False, "error": str(exc)}

    async def format_response(
        self,
        agent_id: str,
        agent_result: Dict[str, Any],
        original_query: str,
        context: Dict[str, Any],
    ) -> str:
        """
        Convert agent JSON output to natural Spanish response.
        Tries Gemini first; falls back to template formatter.
        """
        data = agent_result.get("data", {})
        agent_name = agent_result.get("agent", agent_id)

        # Gemini formatting (preferred)
        if self._api_key:
            formatted = await self._format_with_gemini(
                agent_id, data, original_query, agent_name
            )
            if formatted:
                return formatted

        # Template fallback
        formatter = _FORMATTERS.get(agent_id)
        if formatter:
            try:
                return formatter(data, original_query)
            except Exception as exc:
                logger.warning("[DISPATCH] template formatter failed: %s", exc)

        # Last resort: dump JSON
        return f"Resultado del agente:\n```json\n{json.dumps(data, ensure_ascii=False, indent=2)}\n```"

    async def _format_with_gemini(
        self,
        agent_id: str,
        data: Dict,
        query: str,
        agent_name: str,
    ) -> Optional[str]:
        prompt = (
            f'Eres Samantha, una asistente de IA empresarial. '
            f'El usuario preguntó: "{query}"\n\n'
            f'El agente {agent_name} retornó estos datos:\n'
            f'{json.dumps(data, ensure_ascii=False, indent=2)}\n\n'
            f'Escribe una respuesta concisa y profesional en español (máximo 200 palabras). '
            f'Usa markdown: negritas para cifras importantes, bullets para listas. '
            f'No menciones JSON ni términos técnicos internos.'
        )
        try:
            import google.generativeai as genai
            genai.configure(api_key=self._api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            loop = asyncio.get_event_loop()
            resp = await loop.run_in_executor(
                None,
                partial(model.generate_content, prompt),
            )
            return resp.text.strip()
        except Exception as exc:
            logger.warning("[DISPATCH] Gemini format failed: %s", exc)
            return None


# Module-level singleton
_dispatcher: Optional[AgentDispatcher] = None


def get_dispatcher() -> AgentDispatcher:
    global _dispatcher
    if _dispatcher is None:
        _dispatcher = AgentDispatcher()
    return _dispatcher
