"""Agent #27 — ML Questions Handler (auto-respuesta)"""
import logging
from src.integrations.mercadolibre_integration import MercadoLibreIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)

_TEMPLATES = {
    "shipping": "¡Hola! El envío se realiza mediante {carrier} en {days} días hábiles a todo México. Precio de envío incluido en la compra.",
    "stock": "¡Hola! Sí tenemos stock disponible. Puedes comprar con confianza.",
    "price": "¡Hola! El precio indicado es el precio final, incluye IVA.",
    "invoice": "¡Hola! Sí emitimos factura (CFDI 4.0). Envíanos tu RFC después de la compra.",
    "warranty": "¡Hola! El producto tiene garantía de {months} meses. En caso de falla, gestionamos cambio o reembolso.",
    "specs": "¡Hola! Las especificaciones técnicas están en la descripción del producto. ¿Tienes alguna duda específica?",
    "general": "¡Hola! Gracias por tu pregunta. Te respondemos a la brevedad. Tenemos más de {years} años en el mercado.",
}


def _classify(text: str) -> str:
    text = text.lower()
    if any(w in text for w in ["envío", "envio", "llegará", "llega", "demora", "días", "entrega"]):
        return "shipping"
    if any(w in text for w in ["stock", "disponible", "hay", "tienes", "tienen", "existe"]):
        return "stock"
    if any(w in text for w in ["precio", "costo", "cuánto", "cuanto", "descuento"]):
        return "price"
    if any(w in text for w in ["factura", "rfc", "cfdi", "fiscal", "facturar"]):
        return "invoice"
    if any(w in text for w in ["garantía", "garantia", "cambio", "devolución", "falla"]):
        return "warranty"
    if any(w in text for w in ["medida", "tamaño", "peso", "especificación", "modelo", "voltaje"]):
        return "specs"
    return "general"


async def _get_ml_client(tenant_id: str):
    creds = await db.fetch_one(
        "SELECT access_token, refresh_token, ml_user_id FROM ml_credentials WHERE tenant_id=$1",
        tenant_id,
    )
    if not creds:
        return None, "MercadoLibre not connected"
    ml = MercadoLibreIntegration()
    await ml.set_tokens(creds["access_token"], creds["refresh_token"], creds["ml_user_id"])
    return ml, None


class MLQuestionsAgent:
    name = "ML Questions #27"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        question_text = data.get("question_text", "")
        question_id = data.get("question_id")
        product_id = data.get("product_id", "")

        try:
            category = _classify(question_text)
            template = _TEMPLATES.get(category, _TEMPLATES["general"])
            answer = template.format(
                carrier="DHL/Estafeta", days="3-5",
                months="12", years="5",
            )

            if question_id:
                ml, err = await _get_ml_client(tenant_id)
                if not err:
                    await ml.answer_question(question_id, answer)
                    await db.execute(
                        """INSERT INTO ml_questions (tenant_id, question_id, product_id, question_text, category, answer, answered_at)
                           VALUES ($1,$2,$3,$4,$5,$6,NOW())
                           ON CONFLICT (tenant_id, question_id) DO UPDATE SET answer=$6, answered_at=NOW()""",
                        tenant_id, str(question_id), product_id, question_text, category, answer,
                    )

            return {
                "success": True,
                "data": {
                    "question_id": question_id,
                    "question_text": question_text,
                    "category": category,
                    "answer": answer,
                    "auto_responded": question_id is not None,
                    "escalate_to_human": category == "general",
                },
            }
        except Exception as exc:
            logger.error("MLQuestions failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


ml_questions = MLQuestionsAgent()
