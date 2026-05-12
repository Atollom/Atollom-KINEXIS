"""
Health Check Router — system-level status endpoints.
/api/health/db requires auth; /api/health is public.
"""
import logging
import os

from fastapi import APIRouter, Depends

from src.auth.jwt_validator import get_current_user
from src.sandbox import sandbox
from src.utils.database import db

router = APIRouter(prefix="/api/health", tags=["health"])
logger = logging.getLogger(__name__)


@router.get("")
async def health():
    return {"status": "healthy", "service": "KINEXIS API", "version": "1.0.0"}


@router.get("/db")
async def database_health(user=Depends(get_current_user)):
    try:
        await db.fetch_val("SELECT 1")
        return {"connected": True, "status": "healthy"}
    except Exception as exc:
        logger.warning("[health/db] %s", exc)
        return {"connected": False, "status": "unhealthy", "error": str(exc)}


@router.get("/sandbox")
async def sandbox_health(user=Depends(get_current_user)):
    try:
        integrations = sandbox.integrations
        all_ok = all(v.get("status") == "connected" for v in integrations.values())
        return {
            "status": "healthy" if all_ok else "degraded",
            "mode": sandbox.mode,
            "integrations": integrations,
        }
    except Exception as exc:
        logger.warning("[health/sandbox] %s", exc)
        return {"status": "unhealthy", "error": str(exc)}


@router.get("/samantha")
async def samantha_health():
    has_key = bool(os.getenv("GOOGLE_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))
    return {
        "status": "healthy" if has_key else "degraded",
        "message": "Samantha AI operational" if has_key else "No AI keys configured",
    }
