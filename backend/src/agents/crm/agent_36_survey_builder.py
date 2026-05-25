"""
Agente #36: Survey Builder
Responsabilidad: Crear y gestionar encuestas de satisfacción y feedback de clientes
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"create", "get_results", "get_pending", "send"}
VALID_TYPES = {"nps", "csat", "ces", "custom"}

_TEMPLATES = {
    "nps": {
        "title": "¿Qué tan probable es que nos recomiendes?",
        "questions": [
            {"id": "q1", "type": "nps_scale", "text": "En una escala del 0-10, ¿qué tan probable es que recomiendes nuestros productos a un amigo o colega?"},
            {"id": "q2", "type": "open", "text": "¿Qué podríamos mejorar para darte una mejor experiencia?"},
        ],
    },
    "csat": {
        "title": "¿Cómo calificarías tu experiencia de compra?",
        "questions": [
            {"id": "q1", "type": "rating_5", "text": "¿Cómo calificarías tu experiencia general de compra?"},
            {"id": "q2", "type": "rating_5", "text": "¿Cómo calificarías el tiempo de entrega?"},
            {"id": "q3", "type": "rating_5", "text": "¿Cómo calificarías la calidad del producto?"},
            {"id": "q4", "type": "open",     "text": "¿Tienes algún comentario adicional?"},
        ],
    },
    "ces": {
        "title": "¿Fue fácil resolver tu solicitud?",
        "questions": [
            {"id": "q1", "type": "ces_scale", "text": "¿Qué tan fácil fue resolver tu solicitud con nosotros? (1=Muy difícil, 7=Muy fácil)"},
            {"id": "q2", "type": "open",      "text": "¿Qué podríamos hacer para simplificar el proceso?"},
        ],
    },
}


class Agent36SurveyBuilder:
    """
    Survey Builder — Crea y gestiona encuestas post-compra y de satisfacción.

    Input:
        {
            "action":       str  — create | get_results | get_pending | send
            "survey_type":  str  — nps | csat | ces | custom
            "customer_id":  str  — (para send)
            "order_id":     str  — (opcional)
            "tenant_id":    str
        }
    Output:
        { "action", "survey_id", "survey_type", "questions": [...], "results", "source" }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #36 - Survey Builder"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data.get("action", "create")
        if action not in VALID_ACTIONS:
            action = "create"
        survey_type = data.get("survey_type", "csat")
        if survey_type not in VALID_TYPES:
            survey_type = "csat"
        return {
            "action": action,
            "survey_type": survey_type,
            "customer_id": data.get("customer_id"),
            "order_id": data.get("order_id"),
            "tenant_id": str(data.get("tenant_id", "")),
        }

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data["action"]
        survey_type = data["survey_type"]
        survey_id = f"SRV-{str(uuid.uuid4())[:8].upper()}"

        if action == "create":
            template = _TEMPLATES.get(survey_type, _TEMPLATES["csat"])
            return {
                "action": action,
                "survey_id": survey_id,
                "survey_type": survey_type,
                "title": template["title"],
                "questions": template["questions"],
                "status": "created",
                "share_url": f"https://kinexis.app/survey/{survey_id}",
                "source": "local",
            }

        if action == "send":
            return {
                "action": action,
                "survey_id": survey_id,
                "survey_type": survey_type,
                "customer_id": data.get("customer_id"),
                "channel": "whatsapp",
                "status": "queued",
                "message_preview": f"Hola, ¿cómo calificarías tu experiencia? {survey_id}",
                "source": "local",
            }

        return self._mock_results(survey_type)

    def _mock_results(self, survey_type: str) -> Dict:
        return {
            "action": "get_results",
            "survey_type": survey_type,
            "total_sent": 186,
            "total_responses": 94,
            "response_rate_pct": 50.5,
            "avg_score": 4.2 if survey_type != "nps" else 7.8,
            "results_by_question": [
                {"question": "Experiencia general",   "avg": 4.2, "responses": 94},
                {"question": "Tiempo de entrega",     "avg": 3.8, "responses": 94},
                {"question": "Calidad del producto",  "avg": 4.6, "responses": 88},
            ],
            "open_responses": [
                "El envío tardó más de lo esperado pero el producto es excelente.",
                "Muy buen precio, volvería a comprar.",
                "El empaque estaba un poco dañado.",
            ],
            "alerts": [
                {"type": "warning", "message": "Tiempo de entrega score 3.8 — revisar proceso logístico"},
            ],
            "source": "mock_data",
        }
