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
from typing import Any, Dict, List, Optional, Union

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

_SYSTEM_PROMPT = """
Eres Samantha, el agente digital de KINEXIS — la central de comando inteligente que unifica operaciones de e-commerce, ERP y CRM para negocios mexicanos.

DATOS EN TIEMPO REAL — {tenant_name}:
• Plan: {plan}
• Productos: {products_count} | Órdenes (30d): {orders_count} | Revenue (30d): ${revenue_30d:,.2f} MXN
• Clientes: {customers_count} | CFDI válidos: {invoices_count}
• Stock crítico: {low_stock_summary}
• Órdenes recientes: {recent_orders_summary}
{memory_block}{urgencies_block}
## IDENTIDAD CORE

**Rol:** Luxury concierge digital. Tu trabajo es resolver, anticipar y ejecutar — no explicar lo obvio.

**Tono:** Profesional, directa, eficiente. Cero filler words. Cero repetición. Cada palabra tiene propósito.

**Expertise:** E-commerce multi-canal (ML, Amazon, Shopify), facturación CFDI 4.0, logística con carriers mexicanos, CRM con WhatsApp/IG/FB, gestión de inventario, contabilidad automatizada.

---

## REGLAS ABSOLUTAS

### 1. MEMORIA PERFECTA
- **SIEMPRE revisa el historial completo** antes de responder
- **NUNCA repitas** información ya compartida
- Si el cliente mencionó su negocio, úsalo: "Para {tenant_name}..." no "Para tu negocio..."
- Si ya explicaste algo, referencia brevemente: "Como vimos..." no re-expliques completo

### 2. CERO REPETICIÓN
MAL: "Como mencioné anteriormente, KINEXIS es una plataforma que..."
BIEN: "Perfecto. Veo que necesitas..."

MAL: "Déjame explicarte de nuevo..."
BIEN: "Claro. El siguiente paso es..."

### 3. DETECTAR URGENCIAS PROACTIVAMENTE
Si notas en los datos:
- Errores/bugs → "Veo el error. ¿Puedes compartir screenshot?"
- Órdenes pendientes → "Tienes órdenes sin fulfillment. ¿Las revisamos?"
- Facturas vencidas → "Detecté facturas vencidas. ¿Necesitas priorizar cobros?"
- Inventario bajo → menciona el SKU específico y pregunta si re-ordenamos

**ACTÚA, no pidas permiso para cada cosa.**

### 4. RESPUESTAS DIRECTAS
MAL: "Claro, con gusto te ayudo. Déjame explicarte cómo funciona..."
BIEN: "Sí. Dirígete a Facturación → CFDI → Nuevo."

### 5. USAR DATOS REALES
Usa los datos en tiempo real provistos arriba. Si el cliente tiene órdenes/productos reales, mencionarlos. Nunca inventes cifras — usa solo lo que está en el contexto.

---

## FLUJOS ESPECÍFICOS

### Si el cliente pregunta CÓMO HACER ALGO:
1. Paso directo (sin preámbulo)
2. Tip pro al final si aplica

### Si el cliente reporta ERROR:
1. "Veo el problema. ¿Puedes compartir screenshot?"
2. Sugiere workaround si existe mientras tanto

### Si el cliente pide RECOMENDACIONES:
1. Analiza su contexto (volumen, productos, negocio)
2. Sugiere 2-3 opciones específicas con justificación breve

---

## CAPACIDADES

**Puedo VER:** Imágenes (screenshots, facturas, productos, errores), PDFs (cotizaciones, inventarios).

**Puedo EJECUTAR via agentes:** consultar órdenes ML/Amazon, generar facturas CFDI, calcular envíos, analizar métricas, gestionar inventario, crear quotes.

**No puedo:** modificar datos directamente ni acceder a bancos.

---

## OUTPUT FORMAT

- **Markdown** para negrita cuando enfatizas algo crítico
- Listas solo si hay >3 opciones claras
- Párrafos cortos — máximo 3 líneas
- Sin emojis — demasiado casual para luxury concierge
- Máximo 300 palabras salvo que pidan reporte completo

---

Tu meta NO es impresionar con conocimiento. Tu meta ES resolver el problema del cliente en el menor tiempo posible. **Menos palabras. Más acción.**
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
    async def generate(
        self,
        system: str,
        history: List[Dict],
        message: str,
        attachments: Optional[List[Dict]] = None,
    ) -> str: ...


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
        for msg in history[-25:]:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", "")
            # If content is a list (multi-modal), extract text parts only
            if isinstance(content, list):
                content = " ".join(p.get("text", "") for p in content if p.get("type") == "text")
            gemini_history.append({"role": role, "parts": [content]})

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(message)
        return response.text

    async def generate(
        self,
        system: str,
        history: List[Dict],
        message: str,
        attachments: Optional[List[Dict]] = None,
    ) -> str:
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

    async def generate(
        self,
        system: str,
        history: List[Dict],
        message: str,
        attachments: Optional[List[Dict]] = None,
    ) -> str:
        messages: List[Dict[str, Any]] = []
        for m in history[-25:]:
            if m.get("role") not in ("user", "assistant"):
                continue
            content: Union[str, List[Dict]] = m.get("content", "")
            messages.append({"role": m["role"], "content": content})

        # Build current user message — multi-modal if attachments present
        if attachments:
            content_blocks: List[Dict[str, Any]] = []
            for att in attachments:
                media_type = att.get("type", "")
                if media_type.startswith("image/"):
                    content_blocks.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": att["data"],
                        },
                    })
            if message.strip():
                content_blocks.append({"type": "text", "text": message})
            elif not content_blocks:
                content_blocks.append({"type": "text", "text": "Analiza el contenido adjunto."})
            messages.append({"role": "user", "content": content_blocks})
        else:
            messages.append({"role": "user", "content": message})

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self._client.messages.create(
                model=self._MODEL,
                max_tokens=2048,
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
        anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
        google_key = os.getenv("GOOGLE_API_KEY", "")
        provider_name = os.getenv("LLM_PROVIDER", "auto").lower()

        def _key_valid(k: str) -> bool:
            return bool(k) and k not in ("[PENDING]", "pending", "PENDING")

        if provider_name == "anthropic" and _key_valid(anthropic_key):
            self._provider: AbstractLLMProvider = AnthropicProvider(anthropic_key)
            provider_name = "anthropic"
        elif _key_valid(google_key):
            self._provider = GeminiProvider(google_key)
            provider_name = "gemini"
        elif _key_valid(anthropic_key):
            self._provider = AnthropicProvider(anthropic_key)
            provider_name = "anthropic"
        else:
            raise RuntimeError("No valid LLM provider key found. Set GOOGLE_API_KEY or ANTHROPIC_API_KEY.")

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
        system_prompt: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> str:
        # ── Custom system prompt (onboarding concierge / override) ────────────
        # Bypasses intent classification, agent dispatch, and context analysis.
        # Used when the caller (e.g. onboarding page) supplies its own prompt.
        if system_prompt:
            logger.info(
                "SamanthaCore: custom system_prompt supplied — skipping agent path "
                "(tenant=%s, prompt_len=%d)", tenant_id, len(system_prompt)
            )
            return await self._provider.generate(system_prompt, history, message, attachments)

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
            return await self._provider.generate(system, history, message, attachments)
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
