"""
Response Generator - Formato conversacional
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

_GENERIC_TEMPLATES: Dict[str, str] = {
    "fulfill_order":      "Orden procesada y lista para envio.",
    "update_price":       "Precio actualizado correctamente.",
    "handle_return":      "Devolucion procesada.",
    "answer_question":    "Pregunta respondida automaticamente.",
    "capture_lead":       "Lead capturado y calificado.",
    "score_lead":         "Lead evaluado.",
    "generate_quote":     "Cotizacion generada.",
    "follow_up":          "Seguimiento programado.",
    "create_ticket":      "Ticket de soporte creado.",
    "collect_nps":        "Encuesta NPS registrada.",
    "generate_cfdi":      "Factura CFDI generada.",
    "check_inventory":    "Inventario consultado.",
    "get_finance_snapshot": "Resumen financiero listo.",
    "evaluate_supplier":  "Proveedor evaluado.",
    "create_po":          "Orden de compra generada.",
    "create_shipment":    "Guia de envio creada.",
    "print_label":        "Etiqueta impresa.",
    "send_message":       "Mensaje enviado.",
    "manage_ads":         "Campana procesada.",
    "publish_content":    "Contenido publicado.",
}


class ResponseGenerator:
    """Genera respuestas conversacionales a partir de resultados tecnicos."""

    def __init__(self):
        self.name = "Response Generator"

    async def generate(
        self,
        query: str,
        intent: Dict[str, Any],
        result: Dict[str, Any],
        context: Dict[str, Any],
    ) -> str:
        """Genera respuesta conversacional."""
        if not result.get("success"):
            error = result.get("error", "Error desconocido")
            return f"Lo siento, hubo un error: {error}"

        intent_type = intent.get("intent", "unknown")

        if intent_type == "sales_query":
            return self._format_sales(result, intent)
        if intent_type == "generate_cfdi":
            return self._format_cfdi(result)
        if intent_type == "check_inventory":
            return self._format_inventory(result)
        if intent_type == "generate_quote":
            return self._format_quote(result)

        # Fallback generico
        template = _GENERIC_TEMPLATES.get(intent_type, "Tarea completada.")
        return template

    # ── Formatters especificos ────────────────────────────────────────────────

    def _format_sales(self, result: Dict[str, Any], intent: Dict[str, Any]) -> str:
        channel = intent.get("entities", {}).get("channel", "todos los canales")
        period = intent.get("entities", {}).get("period", "hoy")
        data = result.get("result", {})
        total = data.get("total_sales", data.get("total", "N/D"))
        return f"Ventas en {channel} ({period}): ${total} MXN"

    def _format_cfdi(self, result: Dict[str, Any]) -> str:
        data = result.get("result", {})
        folio = data.get("folio", "N/D")
        total = data.get("total", "N/D")
        return f"Factura generada correctamente. Folio: {folio} | Total: ${total}"

    def _format_inventory(self, result: Dict[str, Any]) -> str:
        data = result.get("result", {})
        status = data.get("status", "ok")
        sku = data.get("sku", "")
        label = f" para {sku}" if sku else ""
        return f"Inventario{label}: {status}."

    def _format_quote(self, result: Dict[str, Any]) -> str:
        data = result.get("result", {})
        quote_number = data.get("quote_number", "N/D")
        total = data.get("total", "N/D")
        return f"Cotizacion {quote_number} generada. Total: ${total} MXN"


response_generator = ResponseGenerator()
