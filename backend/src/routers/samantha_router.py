"""
Samantha Chat Router
Responses mock inteligentes basados en keywords
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/samantha", tags=["samantha"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []
    tenant_id: str

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chat con Samantha - Responses mock por ahora.
    TODO: Integrar Samantha Core real
    """

    query_lower = request.query.lower()

    # Detección de intenciones — orden: específico → general
    if any(word in query_lower for word in ["hoy", "día", "today"]):
        response = "Hoy has tenido 3 órdenes nuevas por un total de $2,340 MXN. El sistema está operando normalmente. ✅"
        intent = "daily_summary"

    elif any(word in query_lower for word in ["ayuda", "help", "qué puedes hacer"]):
        response = """Puedo ayudarte con:

- 📦 Inventario y productos
- 💰 Ventas y órdenes
- 📄 Facturas CFDI
- 👥 Clientes
- 📊 Reportes y análisis
- ⚙️ Configuración del sistema

¿Con qué necesitas ayuda específicamente?"""
        intent = "help"

    else:
        response = f"Entiendo que preguntas sobre: '{request.query}'. Déjame consultar con mis agentes especializados y te respondo en un momento."
        intent = "general_query"

    return {
        "response": response,
        "intent": intent,
        "confidence": 0.95,
        "suggested_actions": []
    }
