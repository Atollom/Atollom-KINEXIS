"""
NLP Engine - Comprension de intencion
Usa Claude Sonnet 4 para entender queries
"""

from typing import Dict, Any
import logging
import re

logger = logging.getLogger(__name__)

class NLPEngine:
    """
    Motor de procesamiento de lenguaje natural.

    Identifica:
    - Intent (que quiere hacer)
    - Entities (sobre que)
    - Context hints (informacion adicional)
    """

    def __init__(self):
        self.name = "NLP Engine"

        self.intent_patterns = {
            # E-commerce
            "sales_query": [
                r"\bcuanto vend",
                r"\b(ventas|ingresos)\b",
                r"\b(total|suma) (de )?(ventas|ingresos)\b",
            ],
            "fulfill_order": [
                r"\b(cumplir|despachar|enviar) (orden|pedido)\b",
                r"\b(procesar|completar) (orden|pedido)\b",
            ],
            "update_price": [
                r"\b(actualizar|cambiar|modificar) precio\b",
                r"\b(subir|bajar) precio\b",
            ],
            "handle_return": [
                r"\b(devolucion|devolver|retorno|return)\b",
            ],
            "answer_question": [
                r"\b(pregunta|responder|responde|consulta)\b",
            ],
            # CRM
            "capture_lead": [
                r"\b(nuevo|registrar|capturar) lead\b",
                r"\b(cliente potencial|prospecto)\b",
            ],
            "score_lead": [
                r"\b(calificar|puntuar|score) lead\b",
            ],
            "generate_quote": [
                r"\b(generar|crear|hacer) cotizacion\b",
                r"\bpresupuesto\b",
            ],
            "follow_up": [
                r"\b(seguimiento|follow.?up)\b",
            ],
            "create_ticket": [
                r"\b(crear|abrir|registrar) (ticket|soporte|caso)\b",
            ],
            "collect_nps": [
                r"\b(nps|satisfaccion|encuesta)\b",
            ],
            # ERP
            "generate_cfdi": [
                r"\b(generar|crear|hacer) factura\b",
                r"\bcfdi\b",
            ],
            "check_inventory": [
                r"\b(revisar|verificar|consultar) (inventario|stock)\b",
                r"\b(cuanto|que) (tengo|hay) en stock\b",
            ],
            "get_finance_snapshot": [
                r"\b(finanzas|snapshot|resumen financiero|caja)\b",
            ],
            "evaluate_supplier": [
                r"\b(evaluar|comparar) proveedor\b",
            ],
            "create_po": [
                r"\b(orden de compra|purchase order|po)\b",
            ],
            "create_shipment": [
                r"\b(crear|generar) (envio|guia|embarque)\b",
            ],
            "print_label": [
                r"\b(imprimir|etiquetar|etiqueta)\b",
            ],
            # Meta
            "send_message": [
                r"\b(enviar|mandar) mensaje\b",
                r"\bwhatsapp|instagram|facebook\b",
            ],
            "manage_ads": [
                r"\b(campana|anuncio|publicidad|ads)\b",
            ],
            "publish_content": [
                r"\b(publicar|post|contenido)\b",
            ],
        }

    async def understand(self, query: str) -> Dict[str, Any]:
        """Comprende intencion del usuario."""
        query_lower = query.lower()

        matched_intent = None
        max_matches = 0

        for intent, patterns in self.intent_patterns.items():
            matches = sum(1 for p in patterns if re.search(p, query_lower))
            if matches > max_matches:
                max_matches = matches
                matched_intent = intent

        entities = self._extract_entities(query_lower)

        pattern_count = len(self.intent_patterns.get(matched_intent or "", []))
        confidence = (max_matches / pattern_count) if matched_intent and pattern_count else 0.0

        return {
            "intent": matched_intent or "unknown",
            "entities": entities,
            "confidence": round(confidence, 2),
            "original_query": query,
        }

    def _extract_entities(self, query: str) -> Dict[str, Any]:
        """Extrae entidades del query."""
        entities = {}

        if "mercado libre" in query or r"\bml\b" in query:
            entities["channel"] = "mercadolibre"
        elif "amazon" in query:
            entities["channel"] = "amazon"
        elif "shopify" in query:
            entities["channel"] = "shopify"

        if "hoy" in query or "today" in query:
            entities["period"] = "today"
        elif "semana" in query or "week" in query:
            entities["period"] = "week"
        elif "mes" in query or "month" in query:
            entities["period"] = "month"

        order_match = re.search(r"(pedido|orden)\s*#?(\d+)", query)
        if order_match:
            entities["order_id"] = order_match.group(2)

        sku_match = re.search(r"sku[-\s]?(\w+)", query)
        if sku_match:
            entities["sku"] = f"SKU-{sku_match.group(1).upper()}"

        return entities


nlp_engine = NLPEngine()
