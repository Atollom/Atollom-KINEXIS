"""
SamanthaCore — LLM orchestrator with pluggable provider and agent dispatcher.
Default: Gemini 2.5 Flash (free tier). Swap to Anthropic with LLM_PROVIDER=anthropic.

Flow:
  1. IntentClassifier detects if query maps to a specific agent
  2. AgentDispatcher executes the agent and formats the result
  3. Fallback: direct LLM conversational response (original path)
"""

import asyncio
import logging
import os
from abc import ABC, abstractmethod
from functools import partial
from typing import Any, Dict, List

from src.services.intent_classifier import get_intent_classifier
from src.services.agent_dispatcher import get_dispatcher

logger = logging.getLogger(__name__)

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
{memory_block}
INSTRUCCIONES:
- Responde en español, de forma profesional y concisa.
- Usa los datos anteriores para responder preguntas específicas.
- Si la pregunta requiere datos que no tienes, indica exactamente qué necesitarías configurar.
- Nunca inventes cifras — usa solo los datos provistos.
- Para reportes, estructura la respuesta con bullets o tabla markdown.
- Máximo 300 palabras salvo que pidan un reporte completo.
"""


def _build_system_prompt(ctx: Dict[str, Any]) -> str:
    low_stock = ctx.get("low_stock", [])
    low_stock_summary = (
        ", ".join(f"{p['name']} ({p['stock']} uds)" for p in low_stock)
        if low_stock
        else "sin alertas"
    )
    recent = ctx.get("recent_orders", [])
    recent_summary = (
        ", ".join(f"{o['order_number']} ${float(o['total']):,.0f} ({o['status']})" for o in recent)
        if recent
        else "sin órdenes recientes"
    )
    memory_block = ctx.get("memory_context", "")
    if memory_block:
        memory_block = memory_block + "\n"

    prompt = _SYSTEM_PROMPT.format(
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
    )
    logger.error("[PROMPT DEBUG] System prompt length: %d", len(prompt))
    logger.error("[PROMPT DEBUG] memory_block length: %d", len(memory_block))
    logger.error("[PROMPT DEBUG] Contains memories: %s", bool(memory_block))
    logger.error("[PROMPT DEBUG] Full system prompt:\n%s", prompt)
    return prompt


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
        for msg in history[-10:]:  # last 10 turns to stay within token limits
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


# ── Anthropic provider (future migration) ────────────────────────────────────

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
    Orchestrator: intent classification → agent dispatch → LLM fallback.
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
        logger.info("SamanthaCore initialized with provider: %s", provider_name)

    async def query(
        self,
        message: str,
        tenant_id: str,
        context: Dict[str, Any],
        history: List[Dict],
    ) -> str:
        # ── 1. Classify intent ────────────────────────────────────────────────
        intent = self._classifier.classify(message)
        logger.warning(
            "[ORCHESTRATOR] intent=%s agent=%s confidence=%.2f method=%s",
            intent.intent, intent.agent_id, intent.confidence, intent.method,
        )

        # ── 2. Agent path ─────────────────────────────────────────────────────
        if intent.intent == "agent" and intent.agent_id:
            # 2a. Enrich args via Gemini if regex returned empty dict
            if not intent.args:
                intent = await self._classifier.enrich_with_llm(intent, message, context)

            # 2b. If we still need info from the user, ask for it
            if intent.needs_clarification:
                logger.warning("[ORCHESTRATOR] needs_clarification for %s", intent.agent_id)
                return intent.needs_clarification

            # 2c. Execute agent
            result = await self._dispatcher.dispatch(intent, tenant_id)
            logger.warning(
                "[ORCHESTRATOR] agent=%s success=%s",
                intent.agent_id, result.get("success"),
            )

            if result.get("success"):
                return await self._dispatcher.format_response(
                    intent.agent_id, result, message, context
                )

            # 2d. Agent failed → log and fall through to conversational
            logger.error(
                "[ORCHESTRATOR] agent %s failed: %s",
                intent.agent_id, result.get("error"),
            )

        # ── 3. Conversational path (original) ─────────────────────────────────
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
