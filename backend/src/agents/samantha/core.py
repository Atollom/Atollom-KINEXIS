"""
SamanthaCore — LLM orchestrator with pluggable provider and agent dispatcher.
Default: Gemini 2.5 Flash (free tier). Swap to Anthropic with LLM_PROVIDER=anthropic.

Flow:
  1. Context analysis runs in parallel (psycopg2, non-blocking)
  2. IntentClassifier detects if query maps to a specific agent
  3. AgentDispatcher executes the agent and formats the result
  4. Greeting detection → proactive response with urgencies
  5. Fallback: direct LLM conversational response with urgencies in system prompt
"""

import asyncio
import logging
import os
import re
from abc import ABC, abstractmethod
from functools import partial
from typing import Any, Dict, List

from src.services.intent_classifier import get_intent_classifier
from src.services.agent_dispatcher import get_dispatcher
from src.services.context_analyzer import get_context_analyzer

logger = logging.getLogger(__name__)

# ── Greeting detection ────────────────────────────────────────────────────────

_GREETING_RE = re.compile(
    r'^(hola\b|hi\b|hey\b|buenas?\b|buen[oa]s\s+(d[ií]as?|tardes?|noches?)|'
    r'qué\s+tal|cómo\s+(estás|te\s+(va|llamas|encuentras))|good\s+(morning|afternoon|evening))',
    re.IGNORECASE,
)


# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """Eres Samantha, la asistente de inteligencia artificial de {tenant_name} en la plataforma KINEXIS.

DATOS EN TIEMPO REAL DE {tenant_name}:
- Plan: {plan}
- Productos activos: {products_count}
- Órdenes últimos 30 días: {orders_count}
- Revenue últimos 30 días: ${revenue_30d:,.2f} MXN
- Clientes registrados: {customers_count}
- Facturas CFDI válidas: {invoices_count}
- Productos con bajo stock (top 5): {low_stock_summary}
- Órdenes recientes: {recent_orders_summary}
{memory_block}{urgencies_block}
INSTRUCCIONES:
- Responde en español, de forma profesional y concisa.
- Usa los datos anteriores para responder preguntas específicas.
- Si la pregunta requiere datos que no tienes, indica exactamente qué necesitarías configurar.
- Nunca inventes cifras — usa solo los datos provistos.
- Para reportes, estructura la respuesta con bullets o tabla markdown.
- Máximo 300 palabras salvo que pidan un reporte completo.
- Si hay urgencias detectadas y la pregunta es genérica, mencionarlas brevemente.
"""


def _format_urgencies_block(urgencies: List[Dict]) -> str:
    """Format urgencies for injection into the system prompt."""
    if not urgencies:
        return ""
    lines = ["URGENCIAS ACTIVAS (mencionar si la pregunta es relevante):"]
    for u in urgencies[:5]:
        label = {"critical": "CRÍTICO", "high": "IMPORTANTE", "medium": "ATENCIÓN"}.get(
            u["severity"], u["severity"].upper()
        )
        lines.append(f"• [{label}] {u['title']} — {u['suggested_action']}")
    return "\n".join(lines) + "\n"


def _build_system_prompt(ctx: Dict[str, Any]) -> str:
    low_stock = ctx.get("low_stock", [])
    low_stock_summary = (
        ", ".join(f"{p['name']} ({p['stock']} uds)" for p in low_stock)
        if low_stock else "sin alertas"
    )
    recent = ctx.get("recent_orders", [])
    recent_summary = (
        ", ".join(f"{o['order_number']} ${float(o['total']):,.0f} ({o['status']})" for o in recent)
        if recent else "sin órdenes recientes"
    )

    memory_block = ctx.get("memory_context", "")
    if memory_block:
        memory_block = memory_block + "\n"

    urgencies_block = _format_urgencies_block(ctx.get("urgencies", []))

    return _SYSTEM_PROMPT.format(
        tenant_name=ctx["tenant_name"],
        plan=ctx["plan"],
        products_count=ctx["products_count"],
        orders_count=ctx["orders_count"],
        revenue_30d=ctx["revenue_30d"],
        customers_count=ctx["customers_count"],
        invoices_count=ctx["invoices_count"],
        low_stock_summary=low_stock_summary,
        recent_orders_summary=recent_summary,
        memory_block=memory_block,
        urgencies_block=urgencies_block,
    )


# ── Proactive greeting ────────────────────────────────────────────────────────

def _build_proactive_greeting(analysis: Dict[str, Any]) -> str:
    """Return a proactive greeting that surfaces the top urgencies."""
    urgencies = analysis["urgencies"]
    critical = [u for u in urgencies if u["severity"] == "critical"]
    high = [u for u in urgencies if u["severity"] == "high"]
    medium = [u for u in urgencies if u["severity"] == "medium"]

    if critical:
        n = len(critical)
        lines = [
            f"Hola. Detecté {n} {'situaciones' if n > 1 else 'situación'} "
            f"{'críticas' if n > 1 else 'crítica'} que {'requieren' if n > 1 else 'requiere'} atención:\n"
        ]
        for u in critical:
            lines.append(f"🔴 **{u['title']}** — {u['description']}")
            lines.append(f"   → *{u['suggested_action']}*\n")
        if high:
            lines.append(f"También hay {len(high)} tema{'s' if len(high) > 1 else ''} importante{'s' if len(high) > 1 else ''}:")
            for u in high[:2]:
                lines.append(f"🟡 {u['title']}")
        lines.append("\n¿En cuál te gustaría que te ayude primero?")
        return "\n".join(lines)

    if high:
        lines = [
            f"Hola. Todo funcionando bien. Tengo {len(high)} tema{'s' if len(high) > 1 else ''} "
            f"importante{'s' if len(high) > 1 else ''} para ti:\n"
        ]
        for u in high[:3]:
            lines.append(f"🟡 **{u['title']}** — {u['description']}")
            lines.append(f"   → *{u['suggested_action']}*\n")
        lines.append("¿Necesitas ayuda con alguno?")
        return "\n".join(lines)

    if medium:
        lines = [f"Hola. Tengo {len(medium)} sugerencia{'s' if len(medium) > 1 else ''}:\n"]
        for u in medium[:3]:
            lines.append(f"⚪ {u['title']} — {u['suggested_action']}")
        lines.append("\n¿Te ayudo con alguna de estas?")
        return "\n".join(lines)

    return "Hola. Todo bajo control. ¿En qué puedo ayudarte?"


# ── Abstract provider ─────────────────────────────────────────────────────────

class AbstractLLMProvider(ABC):
    @abstractmethod
    async def generate(self, system: str, history: List[Dict], message: str) -> str: ...


# ── Gemini provider ───────────────────────────────────────────────────────────

class GeminiProvider(AbstractLLMProvider):
    _MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def __init__(self, api_key: str) -> None:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self._genai = genai
        self._model_name = self._MODEL

    def _call_sync(self, system: str, history: List[Dict], message: str) -> str:
        model = self._genai.GenerativeModel(
            model_name=self._model_name,
            system_instruction=system,
        )
        gemini_history = []
        for msg in history[-10:]:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.get("content", "")]})

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        return response.text

    async def generate(self, system: str, history: List[Dict], message: str) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, partial(self._call_sync, system, history, message)
        )


# ── Anthropic provider ────────────────────────────────────────────────────────

class AnthropicProvider(AbstractLLMProvider):
    _MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    def __init__(self, api_key: str) -> None:
        import anthropic
        self._client = anthropic.Anthropic(api_key=api_key)

    async def generate(self, system: str, history: List[Dict], message: str) -> str:
        messages = [
            {"role": m["role"], "content": m["content"]}
            for m in history[-10:]
            if m.get("role") in ("user", "assistant")
        ]
        messages.append({"role": "user", "content": message})

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self._client.messages.create(
                model=self._MODEL,
                max_tokens=1024,
                system=system,
                messages=messages,
            ),
        )
        return response.content[0].text


# ── SamanthaCore ─────────────────────────────────────────────────────────────

class SamanthaCore:
    """
    Orchestrator: context analysis (parallel) → intent classification →
    agent dispatch → proactive greeting → conversational LLM fallback.
    Switch provider with LLM_PROVIDER env var: 'gemini' (default) | 'anthropic'.
    """

    def __init__(self) -> None:
        provider_name = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider_name == "anthropic":
            key = os.getenv("ANTHROPIC_API_KEY", "")
            self._provider: AbstractLLMProvider = AnthropicProvider(key)
        else:
            key = os.getenv("GOOGLE_API_KEY", "")
            self._provider = GeminiProvider(key)
        self._classifier = get_intent_classifier()
        self._dispatcher = get_dispatcher()
        self._context_analyzer = get_context_analyzer()
        logger.info("SamanthaCore initialized with provider: %s", provider_name)

    async def query(
        self,
        message: str,
        tenant_id: str,
        context: Dict[str, Any],
        history: List[Dict],
    ) -> str:
        # ── 0. Start context analysis concurrently ────────────────────────────
        # Runs in thread pool while we classify intent — zero wait overhead for agent path.
        analysis_task: asyncio.Task = asyncio.create_task(
            self._context_analyzer.analyze(tenant_id)
        )

        # ── 1. Classify intent ────────────────────────────────────────────────
        intent = self._classifier.classify(message)
        logger.warning(
            "[ORCHESTRATOR] intent=%s agent=%s confidence=%.2f method=%s",
            intent.intent, intent.agent_id, intent.confidence, intent.method,
        )

        # ── 2. Agent path ─────────────────────────────────────────────────────
        if intent.intent == "agent" and intent.agent_id:
            if not intent.args:
                intent = await self._classifier.enrich_with_llm(intent, message, context)

            if intent.needs_clarification:
                logger.warning("[ORCHESTRATOR] needs_clarification for %s", intent.agent_id)
                return intent.needs_clarification

            result = await self._dispatcher.dispatch(intent, tenant_id)
            logger.warning(
                "[ORCHESTRATOR] agent=%s success=%s",
                intent.agent_id, result.get("success"),
            )

            if result.get("success"):
                return await self._dispatcher.format_response(
                    intent.agent_id, result, message, context
                )

            logger.error(
                "[ORCHESTRATOR] agent %s failed: %s",
                intent.agent_id, result.get("error"),
            )

        # ── 3. Collect context analysis (likely already done by now) ──────────
        analysis = await analysis_task
        logger.warning(
            "[ORCHESTRATOR] context_analysis: %d urgencies (total_issues=%d)",
            len(analysis["urgencies"]), analysis["total_issues"],
        )

        # ── 4. Greeting → proactive response ──────────────────────────────────
        if _GREETING_RE.match(message.strip()) and analysis["urgencies"]:
            logger.warning("[ORCHESTRATOR] proactive greeting triggered")
            return _build_proactive_greeting(analysis)

        # ── 5. Conversational path with urgencies in system prompt ────────────
        context = {**context, "urgencies": analysis["urgencies"]}
        system = _build_system_prompt(context)
        try:
            return await self._provider.generate(system, history, message)
        except Exception as exc:
            logger.error("LLM provider error: %s", exc)
            raise


# Module-level singleton
_samantha: SamanthaCore | None = None


def get_samantha() -> SamanthaCore:
    global _samantha
    if _samantha is None:
        _samantha = SamanthaCore()
    return _samantha
