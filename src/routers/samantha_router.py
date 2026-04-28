"""
Samantha Router — real LLM-powered chat with DB context and credit tracking.
Provider: Gemini 2.5 Flash (default) | Anthropic (LLM_PROVIDER=anthropic)
"""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from src.agents.samantha.core import get_samantha
from src.agents.samantha.credits import check_credits, decrement_credits
from src.agents.samantha.db_queries import get_tenant_context
from src.middleware.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/samantha", tags=["samantha"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []
    tenant_id: str


@router.post("/chat")
@limiter.limit("10/minute")
async def chat(request: Request, body: ChatRequest):
    # 1. Check credits
    credits = await check_credits(body.tenant_id)
    if not credits["ok"]:
        return {
            "response": (
                f"Has alcanzado el límite mensual de consultas ({credits['limit']} "
                "preguntas). Actualiza tu plan para continuar."
            ),
            "intent": "credit_limit",
            "credits_remaining": 0,
            "confidence": 1.0,
            "suggested_actions": [{"label": "Actualizar plan", "action": "upgrade"}],
        }

    # 2. Fetch live DB context
    try:
        context = await get_tenant_context(body.tenant_id)
    except Exception as exc:
        logger.warning("DB context fetch failed: %s — using empty context", exc)
        context = {
            "tenant_name": "tu empresa",
            "plan": "starter",
            "products_count": 0, "orders_count": 0, "revenue_30d": 0.0,
            "customers_count": 0, "invoices_count": 0,
            "low_stock": [], "recent_orders": [],
        }

    # 3. Call LLM
    import os
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    api_key = os.getenv("GOOGLE_API_KEY") if provider == "gemini" else os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        key_name = "GOOGLE_API_KEY" if provider == "gemini" else "ANTHROPIC_API_KEY"
        return {
            "response": (
                f"Samantha aún no está activada. El administrador debe configurar "
                f"`{key_name}` en las variables de entorno del servidor."
            ),
            "intent": "config_missing",
            "confidence": 1.0,
            "credits_remaining": credits["remaining"],
            "suggested_actions": [],
        }

    history: List[Dict[str, Any]] = [
        {"role": m.role, "content": m.content} for m in body.history
    ]
    try:
        samantha = get_samantha()
        response_text = await samantha.query(
            message=body.query,
            tenant_id=body.tenant_id,
            context=context,
            history=history,
        )
    except Exception as exc:
        logger.error("Samantha LLM error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Error al consultar el modelo de IA: {exc}",
        )

    # 4. Decrement credits (fire-and-forget)
    try:
        await decrement_credits(body.tenant_id)
    except Exception:
        pass  # non-blocking

    return {
        "response": response_text,
        "intent": "llm_response",
        "confidence": 1.0,
        "credits_remaining": credits["remaining"] - 1,
        "suggested_actions": [],
    }


@router.get("/credits/{tenant_id}")
@limiter.limit("30/minute")
async def get_credits(request: Request, tenant_id: str):
    return await check_credits(tenant_id)
