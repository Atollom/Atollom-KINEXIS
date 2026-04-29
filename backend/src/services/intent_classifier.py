"""
IntentClassifier — Hybrid intent detection for Samantha.

Strategy:
  1. Conversational fast-path  (regex, O(1))
  2. Agent regex patterns      (regex, O(n_agents))
  3. Gemini structured output  (LLM, only for complex agents with empty args)
"""

import asyncio
import json
import logging
import os
import re
import unicodedata
from dataclasses import dataclass
from functools import partial
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class IntentResult:
    intent: str                     # "agent" | "conversational"
    agent_id: Optional[str]         # agent_05_inventory_monitor, etc.
    confidence: float               # 0.0 – 1.0
    args: Dict[str, Any]            # extracted params for agent.execute()
    method: str                     # "regex" | "regex+llm" | "fallback"
    needs_clarification: Optional[str] = None  # question to ask user


# ── String normalization ──────────────────────────────────────────────────────

def _strip_accents(text: str) -> str:
    """Remove accent marks so regex patterns work on accented Spanish input."""
    return unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode("ascii")


# ── Param extraction helpers ──────────────────────────────────────────────────

def _extract_sku(query: str) -> Optional[str]:
    m = re.search(r'\b([A-ZÁÉÍÓÚÑ]{2,6}-\d{1,5})\b', query.upper())
    return m.group(1) if m else None


def _extract_price(query: str) -> Optional[float]:
    clean = query.replace(',', '')
    m = re.search(r'\$\s*([\d]+(?:\.\d{1,2})?)', clean)
    if not m:
        m = re.search(r'([\d]+(?:\.\d{1,2})?)\s*(?:pesos?|mxn)', clean, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None


def _extract_period(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ('hoy', 'today', 'diario', 'del día')):
        return 'today'
    if any(w in q for w in ('semana', 'week', 'semanal')):
        return 'week'
    if any(w in q for w in ('trimestre', 'quarter', 'trimestral')):
        return 'quarter'
    return 'month'  # safe default


def _extract_sections(query: str) -> List[str]:
    q = query.lower()
    sections: List[str] = []
    if any(w in q for w in ('cobrar', 'cxc', 'por cobrar', 'receivable')):
        sections.append('receivables')
    if any(w in q for w in ('pagar', 'cxp', 'por pagar', 'payable', 'proveedor')):
        sections.append('payables')
    if any(w in q for w in ('flujo', 'efectivo', 'cashflow', 'cash')):
        sections.append('cashflow')
    if any(w in q for w in ('venta', 'sale', 'ingreso', 'revenue')):
        sections.append('sales')
    return sections or ['receivables', 'payables', 'cashflow', 'sales']


def _extract_inventory_action(query: str) -> str:
    q = query.lower()
    if re.search(r'reorden|reordenar|sugerir\s+compra|qué\s+(pedir|comprar)', q):
        return 'suggest_reorder'
    if re.search(r'alert|bajo\s+stock|crítico|agotad|sin\s+stock|falt', q):
        return 'get_alerts'
    return 'check_stock'


# ── Agent pattern registry ────────────────────────────────────────────────────
# Each tuple: (agent_id, compiled_pattern, param_fn(query, match) -> dict)
# param_fn returning {} signals that Gemini extraction is needed.

_AGENT_PATTERNS: List[tuple] = [
    (
        "agent_05_inventory_monitor",
        re.compile(
            r'(stock|inventario|existencia|cuánto\s+hay|disponible\b|'
            r'bajo\s+stock|reorden(ar)?|alertas?\s+(de\s+)?inventario|'
            r'producto[s]?\s+(agotado|sin\s+stock|crítico))',
            re.IGNORECASE,
        ),
        lambda q, _m: {
            "action": _extract_inventory_action(q),
            **( {"sku": _extract_sku(q)} if _extract_sku(q) else {} ),
        },
    ),
    (
        "agent_18_finance_snapshot",
        re.compile(
            r'(reporte\s+financiero|estado\s+(de\s+)?finanzas|resumen\s+(financiero|del?\s+mes|de\s+la\s+semana)|'
            r'cuentas?\s+por\s+(cobrar|pagar)|cxc\b|cxp\b|flujo\s+de\s+efectivo|'
            r'balance\s+financiero|snapshot\s+financiero|finanzas\s+del)',
            re.IGNORECASE,
        ),
        lambda q, _m: {
            "period": _extract_period(q),
            "include": _extract_sections(q),
        },
    ),
    (
        "agent_06_price_manager",
        re.compile(
            r'(actualiza(r)?|cambia(r)?|modifica(r)?|sube|baja|ajusta(r)?)\s+'
            r'(?:el\s+)?precio',
            re.IGNORECASE,
        ),
        lambda q, _m: {
            "strategy": "fixed",
            "channels": ["ml", "amazon", "shopify"],
            **( {"sku": _extract_sku(q)} if _extract_sku(q) else {} ),
            **( {"base_price": _extract_price(q)} if _extract_price(q) else {} ),
        },
    ),
    (
        "agent_32_quote_generator",
        re.compile(
            r'(cotiza(cion|r|me|nos)\b|genera\s+(una\s+)?cotizacion|'
            r'presupuesto\s+para|hace\s+(una\s+)?cotizacion)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # Gemini extracts customer + items
    ),
    (
        "agent_13_cfdi_billing",
        re.compile(
            r'(factura(r|ción|me)?\b|cfdi\b|timbra(r)?\b|generar?\s+factura|'
            r'necesito\s+(una\s+)?factura)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # Gemini extracts RFC + items
    ),
    (
        "agent_33_follow_up",
        re.compile(
            r'(seguimiento\b|follow[\s-]?up|lead[s]?\s+(inactivo|sin\s+respuesta)|'
            r'contactar\s+lead|quién\s+necesita\s+(seguimiento|contacto)|'
            r'leads?\s+sin\s+respuesta)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # Needs lead context from DB
    ),
    (
        "agent_27_ml_questions",
        re.compile(
            r'(pregunta[s]?\s+(de|en)\s+(ml|mercado\s*libre)|'
            r'(responde?|contesta?)\s+(las?\s+)?pregunta[s]?\s+(de|en)\s+(ml|mercado)|'
            r'pregunta[s]?\s+pendiente[s]?\s+(de|en)\s+(ml|mercado))',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # question_text + product_id from context
    ),
]

# Queries that are clearly conversational (greetings, meta-questions)
_CONVERSATIONAL_RE = re.compile(
    r'^(hola\b|hi\b|hey\b|buen(os|as)\s+(días|tardes|noches)|'
    r'gracias|de\s+nada|cómo\s+(estás|te\s+llamas|te\s+va)|'
    r'quién\s+eres|qué\s+(eres|puedes\s+hacer)|preséntate|'
    r'ayuda\b|help\b)',
    re.IGNORECASE,
)

# Gemini extraction schemas per complex agent
_LLM_SCHEMAS: Dict[str, Dict] = {
    "agent_32_quote_generator": {
        "label": "Quote Generator",
        "required": "customer_name (string), items (list of {name, quantity, unit_price})",
        "optional": "payment_terms (immediate/15_days/30_days/60_days/90_days), customer_email, notes",
        "clarification": "Para generar la cotización necesito: ¿Para qué empresa/cliente es, qué productos y en qué cantidades?",
    },
    "agent_13_cfdi_billing": {
        "label": "CFDI Billing",
        "required": "receptor_rfc (Mexican RFC, e.g. ABC010101AAA), receptor_name, items (list of {description, quantity, unit_price}), payment_form (PUE or PPD), use (G01/G03/I01/P01/S01)",
        "optional": "payment_method (01=efectivo 28=tarjeta)",
        "clarification": "Para la factura necesito: RFC del receptor, nombre fiscal, productos y montos, y si es pago en una exhibición (PUE) o diferido (PPD).",
    },
    "agent_33_follow_up": {
        "label": "Follow-up Manager",
        "required": "lead_id (string), last_contact_date (YYYY-MM-DD), stage (interested/quoted/negotiation)",
        "optional": "channel (whatsapp/email/phone), lead_name, company",
        "clarification": "¿Para qué lead específico necesitas el seguimiento? Puedes indicarme el nombre de la empresa o el ID.",
    },
    "agent_27_ml_questions": {
        "label": "ML Questions Handler",
        "required": "question_text (string), product_id (string)",
        "optional": "question_id, buyer_nickname",
        "clarification": "¿Cuál es la pregunta de Mercado Libre que deseas responder y a qué producto corresponde?",
    },
}


# ── Classifier ────────────────────────────────────────────────────────────────

class IntentClassifier:
    """
    Hybrid intent classifier:
      1. Regex fast-path for obvious intents
      2. Gemini structured extraction for complex arg sets
      3. Conversational fallback
    """

    def __init__(self) -> None:
        self._api_key = os.getenv("GOOGLE_API_KEY", "")

    def classify(self, query: str) -> IntentResult:
        q = query.strip()
        # Normalize for matching (strips accents); keep original for param extraction
        q_norm = _strip_accents(q)

        # 1. Conversational fast-path
        if _CONVERSATIONAL_RE.match(q_norm) or len(q.split()) <= 2:
            return IntentResult(
                intent="conversational", agent_id=None,
                confidence=0.95, args={}, method="regex",
            )

        # 2. Scan agent patterns
        for agent_id, pattern, param_fn in _AGENT_PATTERNS:
            m = pattern.search(q_norm)
            if m:
                args = param_fn(q, m)
                has_args = bool(args)
                logger.warning(
                    "[INTENT] regex hit: agent=%s has_args=%s args=%s",
                    agent_id, has_args, args,
                )
                return IntentResult(
                    intent="agent",
                    agent_id=agent_id,
                    confidence=0.90 if has_args else 0.75,
                    args=args,
                    method="regex" if has_args else "regex+llm",
                )

        # 3. Conversational fallback
        logger.warning("[INTENT] no pattern matched → conversational")
        return IntentResult(
            intent="conversational", agent_id=None,
            confidence=0.55, args={}, method="fallback",
        )

    async def enrich_with_llm(
        self,
        result: IntentResult,
        query: str,
        context: Dict[str, Any],
    ) -> IntentResult:
        """
        Fill missing args via Gemini structured extraction.
        Returns updated IntentResult; sets needs_clarification if
        required fields cannot be extracted.
        """
        if not result.agent_id or result.args:
            return result

        schema = _LLM_SCHEMAS.get(result.agent_id)
        if not schema:
            return result

        if not self._api_key:
            result.needs_clarification = schema["clarification"]
            return result

        prompt = (
            f'Extract parameters from this business query for a {schema["label"]}.\n\n'
            f'Query: "{query}"\n'
            f'Required fields: {schema["required"]}\n'
            f'Optional fields: {schema["optional"]}\n'
            f'Tenant context: {context.get("tenant_name", "unknown")}\n\n'
            'Return ONLY a valid JSON object with extracted parameters. '
            'Set missing required fields to null. '
            'Return null (as plain text) if the query lacks enough info.\n\nJSON:'
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
            text = resp.text.strip()
            text = re.sub(r'^```(?:json)?\s*|\s*```$', '', text, flags=re.MULTILINE).strip()

            if text.lower() == 'null':
                result.needs_clarification = schema["clarification"]
                return result

            extracted = json.loads(text)
            # Check any null required field
            has_nulls = any(v is None for v in extracted.values())
            if has_nulls:
                result.needs_clarification = schema["clarification"]
            else:
                result.args = extracted
                result.method = "regex+llm"
                result.confidence = 0.85

        except Exception as exc:
            logger.warning("[INTENT] LLM extraction failed: %s", exc)
            result.needs_clarification = schema["clarification"]

        return result


# Module-level singleton
_classifier: Optional[IntentClassifier] = None


def get_intent_classifier() -> IntentClassifier:
    global _classifier
    if _classifier is None:
        _classifier = IntentClassifier()
    return _classifier
