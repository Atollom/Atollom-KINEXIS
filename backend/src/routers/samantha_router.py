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
from src.agents.samantha.db_queries import get_tenant_context, get_user_by_supabase_id
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
    # supabase_user_id: the auth.uid() from Supabase JWT (NOT users.id)
    # Backend resolves → users.id before calling memory service
    supabase_user_id: Optional[str] = None
    session_id: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    print("[EMERGENCY] chat() called — Railway IS running new code", flush=True)
    logger.warning("[EMERGENCY] chat() called — supabase_user_id=%s", request.supabase_user_id)

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

    # 3. Resolve supabase_user_id → internal users.id, then load memory context
    memory_context = ""
    logger.warning("[SAMANTHA DEBUG] supabase_user_id received: %s", request.supabase_user_id or "NONE")
    logger.warning("[SAMANTHA DEBUG] tenant_id: %s", request.tenant_id)

    if request.supabase_user_id:
        try:
            user_row = await get_user_by_supabase_id(request.supabase_user_id)
            logger.warning("[SAMANTHA DEBUG] user_row lookup result: %s", user_row)

            if not user_row:
                logger.warning(
                    "[SAMANTHA DEBUG] supabase_user_id %s not found in users table — memory skipped",
                    request.supabase_user_id,
                )
            else:
                internal_user_id = user_row["id"]  # users.id (PK), NOT supabase_user_id
                logger.warning("[SAMANTHA DEBUG] internal_user_id (users.id): %s", internal_user_id)

                memory_svc = get_memory_service()
                logger.warning("[SAMANTHA DEBUG] memory_svc initialized: %s", memory_svc._initialized)

                boot_memories, relevant_memories = await _load_memories(
                    memory_svc,
                    tenant_id=request.tenant_id,
                    user_id=internal_user_id,
                    query=request.query,
                )
                logger.warning("[SAMANTHA DEBUG] boot_memories count: %d", len(boot_memories))
                logger.warning("[SAMANTHA DEBUG] boot_memories: %s", boot_memories)
                logger.warning("[SAMANTHA DEBUG] relevant_memories count: %d", len(relevant_memories))
                logger.warning("[SAMANTHA DEBUG] relevant_memories: %s", relevant_memories)

                memory_context = memory_svc.format_memory_context(boot_memories, relevant_memories)
                logger.warning("[SAMANTHA DEBUG] memory_context length: %d", len(memory_context))
                logger.warning("[SAMANTHA DEBUG] memory_context preview: %s", memory_context[:500])
        except Exception as exc:
            logger.warning("[SAMANTHA DEBUG] Memory load failed (non-fatal): %s", exc, exc_info=True)
    else:
        logger.warning("[SAMANTHA DEBUG] No supabase_user_id — memory features skipped")

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


async def _resolve_user_id(supabase_user_id: str) -> str:
    """Lookup users.id from supabase_user_id. Raises 404 if not found."""
    user_row = await get_user_by_supabase_id(supabase_user_id)
    if not user_row:
        raise HTTPException(
            status_code=404,
            detail=f"User with supabase_user_id={supabase_user_id} not found in users table",
        )
    return user_row["id"]


@router.post("/memory/save")
async def save_memory(
    tenant_id: str,
    supabase_user_id: str,
    content: str,
    importance: int = 5,
    tags: Optional[List[str]] = None,
    agent_source: Optional[str] = "samantha_chat",
    session_id: Optional[str] = None,
    summary: Optional[str] = None,
):
    """Persist a memory manually (e.g. from agent actions)."""
    internal_user_id = await _resolve_user_id(supabase_user_id)
    memory_svc = get_memory_service()
    result = await memory_svc.save_memory(
        tenant_id=tenant_id,
        user_id=internal_user_id,
        content=content,
        importance=importance,
        tags=tags,
        agent_source=agent_source,
        session_id=session_id,
        summary=summary,
    )
    return {"ok": bool(result), "memory": result}


@router.get("/memory/boot")
async def boot_memories(tenant_id: str, supabase_user_id: str, min_importance: int = 7):
    """Return boot-sequence memories for a user session."""
    internal_user_id = await _resolve_user_id(supabase_user_id)
    memory_svc = get_memory_service()
    memories = await memory_svc.get_boot_memories(tenant_id, internal_user_id, min_importance)
    return {"memories": memories, "count": len(memories)}
