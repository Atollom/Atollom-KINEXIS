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
    if re.search(r'reorden|reordenar|sugerir\s+compra|que\s+(pedir|comprar)', q):
        return 'suggest_reorder'
    if re.search(r'alert|bajo\s+stock|critico|agotad|sin\s+stock|falt', q):
        return 'get_alerts'
    return 'check_stock'


def _extract_amazon_action(query: str) -> str:
    q = _strip_accents(query).lower()
    if re.search(r'crea.*shipment|inbound|envia.*amazon|manda.*fba', q):
        return 'create_shipment'
    if re.search(r'estado|status|shipment\s+\w+', q):
        return 'get_status'
    return 'sync_inventory'


def _extract_po_action(query: str) -> str:
    q = _strip_accents(query).lower()
    if re.search(r'aproba|aprueba|autoriza', q):
        return 'approve'
    if re.search(r'envia|manda.*proveedor', q):
        return 'send'
    return 'create'


def _extract_ads_action(query: str) -> str:
    q = _strip_accents(query).lower()
    if re.search(r'pausa|detiene|desactiva', q):
        return 'pause'
    if re.search(r'reactiva|reanuda|activa', q):
        return 'resume'
    if re.search(r'stats|metricas|resultados|rendimiento|ctr|roas|impresiones', q):
        return 'get_stats'
    return 'create'


def _extract_supplier_priority(query: str) -> str:
    q = _strip_accents(query).lower()
    if re.search(r'precio|costo|barato|economico|mas\s+barato', q):
        return 'cost'
    if re.search(r'rapido|velocidad|entrega\s+rapida|tiempo', q):
        return 'speed'
    return 'quality'


def _extract_carrier(query: str) -> Optional[str]:
    q = _strip_accents(query).lower()
    if 'fedex' in q:
        return 'fedex'
    if 'dhl' in q:
        return 'dhl'
    if 'estafeta' in q:
        return 'estafeta'
    return None


def _extract_shipping_service(query: str) -> str:
    return 'express' if re.search(r'express|urgente|rapido', _strip_accents(query).lower()) else 'standard'


def _extract_ticket_channel(query: str) -> str:
    q = _strip_accents(query).lower()
    if 'whatsapp' in q:
        return 'whatsapp'
    if 'email' in q or 'correo' in q:
        return 'email'
    return 'chat'


def _extract_label_type(query: str) -> str:
    q = _strip_accents(query).lower()
    if re.search(r'envio|guia|shipping', q):
        return 'shipping_label'
    if re.search(r'ticket|comprobante|recibo', q):
        return 'invoice_ticket'
    return 'product_label'


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
    # ── E-commerce fulfillment ────────────────────────────────────────────────
    (
        "agent_01_ml_fulfillment",
        re.compile(
            r'(cumpl[ei]|despacha|fulfillment\s+(de\s+)?ml|procesa.*orden.*ml|'
            r'enviar?\s+(la\s+)?venta\s+(de\s+)?ml|marcar.*enviado.*ml)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # order_id required — Gemini or clarification
    ),
    (
        "agent_02_amazon_fba",
        re.compile(
            r'(amazon\s*fba|fba\b|shipment.*amazon|inventario.*amazon|'
            r'sincroniza.*amazon|inbound.*amazon)',
            re.IGNORECASE,
        ),
        lambda q, _m: {"action": _extract_amazon_action(q)},
    ),
    (
        "agent_03_shopify_fulfillment",
        re.compile(
            r'(shopify|despacha.*shopify|orden.*shopify|fulfillment.*shopify|'
            r'procesa.*shopify)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # order_id required
    ),
    (
        "agent_14_returns_manager",
        re.compile(
            r'(devolucion|devolver|reembolso|retorno\b|'
            r'cambio.*producto|producto.*defectuoso|llegó\s+dañado)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # order_id + channel + reason
    ),
    # ── ERP operations ────────────────────────────────────────────────────────
    (
        "agent_16_supplier_evaluator",
        re.compile(
            r'(evalua.*proveedor|compara.*proveedor|mejor\s+proveedor|'
            r'ranking\s+proveedor|que\s+proveedor)',
            re.IGNORECASE,
        ),
        lambda q, _m: {
            "action": "recommend",
            "priority": _extract_supplier_priority(q),
        },
    ),
    (
        "agent_24_thermal_printer",
        re.compile(
            r'(imprim[ei]|etiqueta\s+(de\s+)?(envio|producto)|'
            r'ticket\s+(de\s+)?impresion|zpl\b|impresora\s+termica)',
            re.IGNORECASE,
        ),
        lambda q, _m: {"label_type": _extract_label_type(q), "format": "zpl"},
    ),
    (
        "agent_25_skydrop_shipping",
        re.compile(
            r'(guia\s*(de\s+)?envio|genera\s+guia|skydrop|estafeta\b|'
            r'dhl\b|fedex\b|paqueteria\b)',
            re.IGNORECASE,
        ),
        lambda q, _m: {
            "service": _extract_shipping_service(q),
            **( {"carrier": _extract_carrier(q)} if _extract_carrier(q) else {} ),
        },
    ),
    (
        "agent_30_purchase_orders",
        re.compile(
            r'(orden\s+(de\s+)?compra|orden\s+a\s+proveedor|\boc\b|'
            r'compra\s+a\s+proveedor|aproba.*compra|genera.*oc)',
            re.IGNORECASE,
        ),
        lambda q, _m: {"action": _extract_po_action(q)},
    ),
    # ── CRM operations ────────────────────────────────────────────────────────
    (
        "agent_04_b2b_collector",
        re.compile(
            r'(nuevo\s+lead|captura\s+(el\s+)?lead|registra\s+(el\s+)?prospecto|'
            r'lead\s+b2b|agregar\s+lead)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # contact info — Gemini extraction
    ),
    (
        "agent_19_nps_collector",
        re.compile(
            r'(registra.*nps|\bnps\b|satisfaccion.*cliente|encuesta.*cliente|'
            r'calificacion.*cliente|promotor\b|detractor\b)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # customer_id + score required
    ),
    (
        "agent_31_lead_scorer",
        re.compile(
            r'(score\s+(del?\s+)?lead|puntua\s+(el\s+)?lead|califica\s+(el\s+)?lead|'
            r'scoring\s+lead|puntuacion\s+lead)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # lead_data required
    ),
    (
        "agent_37_support_tickets",
        re.compile(
            r'(abre\s+(un\s+)?ticket|crea\s+(un\s+)?ticket|\bticket\s+de\s+soporte|'
            r'registra\s+(una?\s+)?queja|registra\s+(un\s+)?reclamo|incidencia)',
            re.IGNORECASE,
        ),
        lambda q, _m: {"channel": _extract_ticket_channel(q)},
    ),
    # ── Meta / Social ─────────────────────────────────────────────────────────
    (
        "agent_12_ads_manager",
        re.compile(
            r'(crea\s+(una?\s+)?campana|pausa\s+(la\s+)?campana|reactiva\s+(la\s+)?campana|'
            r'facebook\s+ads|instagram\s+ads|publicidad\s+pagada|stats\s+(de\s+(?:la\s+)?)?campana)',
            re.IGNORECASE,
        ),
        lambda q, _m: {"action": _extract_ads_action(q)},
    ),
    (
        "agent_content_publisher",
        re.compile(
            r'(publica\s+(?:(?:un|una|este|ese|el|la)\s+)?(post|story|reel|contenido)|'
            r'programa\s+(la\s+)?publicacion|sube\s+(el\s+)?(post|contenido))',
            re.IGNORECASE,
        ),
        lambda _q, _m: {},  # content + platform required
    ),
    (
        "agent_wa_whatsapp",
        re.compile(
            r'(envia\s+(por\s+|el\s+)?whatsapp|manda\s+(por\s+|el\s+)?whatsapp|'
            r'mensaje\s+(por\s+)?whatsapp|whatsapp\s+(a|para)\s)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {"action": "send"},
    ),
    (
        "agent_ig_instagram",
        re.compile(
            r'(instagram\s+dm|dm\s+(de\s+)?instagram|envia\s+(por\s+)?instagram|'
            r'mensaje\s+(por\s+)?instagram)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {"action": "send"},
    ),
    (
        "agent_fb_facebook",
        re.compile(
            r'(messenger\b|envia\s+(por\s+)?facebook|mensaje\s+(por\s+)?facebook|'
            r'facebook\s+messenger)',
            re.IGNORECASE,
        ),
        lambda _q, _m: {"action": "send"},
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
    "agent_01_ml_fulfillment": {
        "label": "ML Fulfillment",
        "required": "order_id (string)",
        "optional": "items (list), buyer_phone",
        "clarification": "¿Cuál es el número de orden de Mercado Libre que deseas despachar?",
    },
    "agent_03_shopify_fulfillment": {
        "label": "Shopify Fulfillment",
        "required": "order_id (string)",
        "optional": "items (list), customer_phone",
        "clarification": "¿Cuál es el número de orden de Shopify que deseas despachar?",
    },
    "agent_14_returns_manager": {
        "label": "Returns Manager",
        "required": "order_id (string), channel (mercadolibre/amazon/shopify), reason (producto_defectuoso/no_deseado/error_envio/descripcion_incorrecta/llegó_dañado), items (list of {sku, quantity, unit_price})",
        "optional": "customer_id",
        "clarification": "Para procesar la devolución necesito: número de orden, canal (ML/Amazon/Shopify), motivo y productos a devolver.",
    },
    "agent_04_b2b_collector": {
        "label": "B2B Lead Collector",
        "required": "contact.name (string), contact.email (string)",
        "optional": "contact.company, contact.position, context.budget, context.urgency (high/medium/low), source (web_form/whatsapp/linkedin/referral)",
        "clarification": "Para registrar el lead necesito: nombre, email y preferiblemente empresa y presupuesto estimado.",
    },
    "agent_19_nps_collector": {
        "label": "NPS Collector",
        "required": "customer_id (string), score (integer 0-10)",
        "optional": "feedback (string), order_id",
        "clarification": "¿De qué cliente es la calificación NPS y cuál fue el puntaje (0-10)?",
    },
    "agent_31_lead_scorer": {
        "label": "Lead Scorer",
        "required": "lead_data.name (string), lead_data.email (string)",
        "optional": "lead_data.company, lead_data.budget, lead_data.source",
        "clarification": "¿Qué información tienes del lead para calcular su score?",
    },
    "agent_content_publisher": {
        "label": "Content Publisher",
        "required": "action (publish/schedule/delete), content_type (post/story/reel), platforms (list: facebook/instagram)",
        "optional": "caption, media_url, scheduled_at",
        "clarification": "Para publicar contenido necesito: tipo (post/story/reel), plataformas y el texto o imagen.",
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
                # Platform-specific overrides: skip generic agent when explicit platform mentioned
                if agent_id == "agent_05_inventory_monitor" and re.search(
                    r'\b(?:amazon[\s_]*fba|fba)\b', q_norm, re.IGNORECASE
                ):
                    continue
                if agent_id == "agent_01_ml_fulfillment" and re.search(
                    r'\bshopify\b', q_norm, re.IGNORECASE
                ):
                    continue
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
