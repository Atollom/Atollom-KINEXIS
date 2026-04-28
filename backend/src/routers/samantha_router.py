"""
Samantha Router — real LLM-powered chat with DB context, credit tracking, and vector memory.
Provider: Gemini 2.5 Flash (default) | Anthropic (LLM_PROVIDER=anthropic)
"""

import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.agents.samantha.core import get_samantha
from src.agents.samantha.credits import check_credits, decrement_credits
from src.agents.samantha.db_queries import get_tenant_context
from src.services.memory_service import get_memory_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/samantha", tags=["samantha"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str
    history: List[ChatMessage] = []
    tenant_id: str
    user_id: Optional[str] = None  # Required for memory features; skipped if absent
    session_id: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    # 1. Check credits
    credits = await check_credits(request.tenant_id)
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
        context = await get_tenant_context(request.tenant_id)
    except Exception as exc:
        logger.warning("DB context fetch failed: %s — using empty context", exc)
        context = {
            "tenant_name": "tu empresa",
            "plan": "starter",
            "products_count": 0, "orders_count": 0, "revenue_30d": 0.0,
            "customers_count": 0, "invoices_count": 0,
            "low_stock": [], "recent_orders": [],
        }

    # 3. Load memory context (non-blocking: failures are silently skipped)
    memory_context = ""
    if request.user_id:
        try:
            memory_svc = get_memory_service()
            boot_memories, relevant_memories = await _load_memories(
                memory_svc,
                tenant_id=request.tenant_id,
                user_id=request.user_id,
                query=request.query,
            )
            memory_context = memory_svc.format_memory_context(boot_memories, relevant_memories)
            if memory_context:
                logger.debug(
                    "Memory context loaded: %d boot + %d relevant",
                    len(boot_memories), len(relevant_memories),
                )
        except Exception as exc:
            logger.warning("Memory load failed (non-fatal): %s", exc)

    # Inject memory into context so _build_system_prompt can include it
    context["memory_context"] = memory_context

    # 4. Check API key
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

    # 5. Call LLM
    history: List[Dict[str, Any]] = [
        {"role": m.role, "content": m.content} for m in request.history
    ]
    try:
        samantha = get_samantha()
        response_text = await samantha.query(
            message=request.query,
            tenant_id=request.tenant_id,
            context=context,
            history=history,
        )
    except Exception as exc:
        logger.error("Samantha LLM error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Error al consultar el modelo de IA: {exc}",
        )

    # 6. Decrement credits (fire-and-forget)
    try:
        await decrement_credits(request.tenant_id)
    except Exception:
        pass

    return {
        "response": response_text,
        "intent": "llm_response",
        "confidence": 1.0,
        "credits_remaining": credits["remaining"] - 1,
        "suggested_actions": [],
    }


async def _load_memories(
    memory_svc,
    tenant_id: str,
    user_id: str,
    query: str,
) -> tuple[list, list]:
    """Load boot + relevant memories concurrently."""
    import asyncio
    boot, relevant = await asyncio.gather(
        memory_svc.get_boot_memories(tenant_id, user_id, min_importance=7),
        memory_svc.search_memories(tenant_id, user_id, query, threshold=0.70, limit=5),
        return_exceptions=True,
    )
    boot = boot if isinstance(boot, list) else []
    relevant = relevant if isinstance(relevant, list) else []
    return boot, relevant


@router.get("/credits/{tenant_id}")
async def get_credits(tenant_id: str):
    return await check_credits(tenant_id)


@router.post("/memory/save")
async def save_memory(
    tenant_id: str,
    user_id: str,
    content: str,
    importance: int = 5,
    tags: Optional[List[str]] = None,
    agent_source: Optional[str] = "samantha_chat",
    session_id: Optional[str] = None,
    summary: Optional[str] = None,
):
    """Persist a memory manually (e.g. from agent actions)."""
    memory_svc = get_memory_service()
    result = await memory_svc.save_memory(
        tenant_id=tenant_id,
        user_id=user_id,
        content=content,
        importance=importance,
        tags=tags,
        agent_source=agent_source,
        session_id=session_id,
        summary=summary,
    )
    return {"ok": bool(result), "memory": result}


@router.get("/memory/boot")
async def boot_memories(tenant_id: str, user_id: str, min_importance: int = 7):
    """Return boot-sequence memories for a user session."""
    memory_svc = get_memory_service()
    memories = await memory_svc.get_boot_memories(tenant_id, user_id, min_importance)
    return {"memories": memories, "count": len(memories)}
