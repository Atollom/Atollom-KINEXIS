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
    "agent_05_inventory_monitor":  ("src.agents.erp.agent_05_inventory_monitor",  "Agent05InventoryMonitor"),
    "agent_18_finance_snapshot":   ("src.agents.erp.agent_18_finance_snapshot",   "Agent18FinanceSnapshot"),
    "agent_06_price_manager":      ("src.agents.ecommerce.agent_06_price_manager", "Agent06PriceManager"),
    "agent_32_quote_generator":    ("src.agents.crm.agent_32_quote_generator",    "Agent32QuoteGenerator"),
    "agent_13_cfdi_billing":       ("src.agents.erp.agent_13_cfdi_billing",       "Agent13CFDIBilling"),
    "agent_33_follow_up":          ("src.agents.crm.agent_33_follow_up",          "Agent33FollowUp"),
    "agent_27_ml_questions":       ("src.agents.ecommerce.agent_27_ml_questions", "Agent27MLQuestions"),
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


_FORMATTERS = {
    "agent_05_inventory_monitor": _fmt_inventory,
    "agent_18_finance_snapshot":  _fmt_finance,
    "agent_06_price_manager":     _fmt_price,
    "agent_32_quote_generator":   _fmt_quote,
    "agent_13_cfdi_billing":      _fmt_cfdi,
    "agent_33_follow_up":         _fmt_followup,
    "agent_27_ml_questions":      _fmt_ml_questions,
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
