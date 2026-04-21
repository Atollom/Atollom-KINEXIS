"""
Agente #27: ML Questions Handler
Responsabilidad: Responder preguntas de Mercado Libre automáticamente con IA
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Patrones de preguntas frecuentes y sus respuestas plantilla
FAQ_PATTERNS: list[tuple[str, str]] = [
    (
        r"\b(envío|envio|despacho|shipping|llegada|entrega)\b",
        "Hacemos envíos a toda la república. Órdenes mayores a $599 tienen envío gratis. "
        "El tiempo de entrega es de 3-5 días hábiles.",
    ),
    (
        r"\b(stock|disponible|hay|existe|tienen|tienes)\b",
        "Sí, el producto está disponible. Si necesitas una cantidad específica, "
        "puedes indicárnosla y verificamos el stock.",
    ),
    (
        r"\b(precio|costo|cuánto|cuanto|descuento|oferta)\b",
        "El precio que ves es el precio final. Contamos con descuentos por volumen "
        "para pedidos mayores a 10 unidades.",
    ),
    (
        r"\b(factura|cfdi|fiscal|rfc)\b",
        "Sí, emitimos factura CFDI 4.0. Al finalizar tu compra, indícanos tu RFC "
        "y nombre fiscal por mensaje.",
    ),
    (
        r"\b(garantía|garantia|defecto|cambio|devolucion|devolución)\b",
        "Ofrecemos 30 días de garantía. En caso de producto defectuoso, "
        "realizamos cambio sin costo adicional.",
    ),
    (
        r"\b(medida|talla|tamaño|dimensión|dimension|peso)\b",
        "Las medidas exactas están en la descripción del producto. "
        "Si necesitas información adicional, con gusto te ayudamos.",
    ),
]

UNKNOWN_ANSWER = (
    "Gracias por tu pregunta. Un asesor la responderá a la brevedad. "
    "También puedes contactarnos por WhatsApp para atención inmediata."
)


class Agent27MLQuestions:
    """
    ML Questions Handler — Respuestas automáticas a preguntas ML con IA.

    Flujo:
      1. Recibe pregunta de comprador en ML
      2. Clasifica tipo de pregunta (envío, stock, precio, etc.)
      3. Genera respuesta usando FAQ + contexto del producto
      4. Si no reconoce → escala a humano
      5. Responde vía ML API

    Input:
        {
            "question_id":   str   — ID de la pregunta ML
            "product_id":    str   — MLMXXXXXXXX
            "question_text": str   — Texto de la pregunta
            "customer_id":   str   — ID del comprador
        }

    Output:
        {
            "question_id":  str
            "answer":       str
            "auto_answered": bool  — True si respuesta automática
            "category":     str   — shipping|stock|price|invoice|warranty|specs|unknown
            "answered_at":  str   — ISO timestamp
        }
    """

    REQUIRED_FIELDS = ["question_id", "product_id", "question_text"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #27 - ML Questions"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Clasifica y responde pregunta de ML."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} answered question {validated['question_id']} "
                f"category={result.get('category')} auto={result.get('auto_answered')}"
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        product_id = str(data["product_id"]).strip()
        if not product_id:
            raise ValueError("product_id cannot be empty")

        question = str(data["question_text"]).strip()
        if not question:
            raise ValueError("question_text cannot be empty")
        data["question_text"] = question

        return data

    def _classify_question(self, text: str) -> tuple[str, str, bool]:
        """Retorna (category, answer, auto_answered)."""
        categories = [
            "shipping", "stock", "price", "invoice",
            "warranty", "specs", "unknown",
        ]
        text_lower = text.lower()

        for i, (pattern, answer) in enumerate(FAQ_PATTERNS):
            if re.search(pattern, text_lower):
                return categories[i], answer, True

        return "unknown", UNKNOWN_ANSWER, False

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        category, answer, auto_answered = self._classify_question(
            data["question_text"]
        )

        answered_via_api = False
        try:
            from src.integrations import ml_integration
            if auto_answered and (ml_integration._access_token or ml_integration.test_access_token):
                qid = data["question_id"]
                if str(qid).isdigit():
                    await ml_integration.answer_question(int(qid), answer)
                    answered_via_api = True
                    logger.info(f"{self.name} posted answer to ML API for question {qid}")
        except Exception as e:
            logger.warning(f"{self.name} ML API answer post failed: {e}")

        result = {
            "question_id": data["question_id"],
            "product_id": data["product_id"],
            "category": category,
            "answer": answer,
            "auto_answered": auto_answered,
            "answered_via_api": answered_via_api,
            "answered_at": datetime.now(timezone.utc).isoformat(),
        }
        if not answered_via_api:
            result["note"] = "ML API answer posting pending — configure credentials in .env"
        return result


ml_questions = Agent27MLQuestions()
