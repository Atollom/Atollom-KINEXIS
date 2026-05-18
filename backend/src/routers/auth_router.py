"""
Auth Router — endpoints de gestión de contraseñas post-onboarding.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from src.auth.jwt_validator import get_current_user
from src.utils.database import db
from src.utils.supabase_admin import update_auth_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── Models ────────────────────────────────────────────────────────────────────

class SetPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class PasswordStatusResponse(BaseModel):
    must_change_pw: bool
    email: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/set-password")
async def set_password(
    body: SetPasswordRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Permite a un usuario autenticado cambiar su contraseña.
    Usado en el primer login cuando must_change_pw=TRUE.
    """
    supabase_user_id = current_user["supabase_user_id"]
    email = current_user.get("email", "")

    success = await update_auth_password(supabase_user_id, body.new_password)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar la contraseña. Intenta de nuevo.",
        )

    # Mark password as changed in the users table
    try:
        await db.execute(
            "UPDATE users SET must_change_pw=FALSE, updated_at=NOW() "
            "WHERE supabase_user_id=$1::uuid",
            supabase_user_id,
        )
    except Exception as exc:
        logger.warning("[AUTH] Could not update must_change_pw for %s: %s", email, exc)

    logger.info("[AUTH] Password updated for %s", email)
    return {"success": True, "message": "Contraseña actualizada correctamente"}


@router.get("/password-status")
async def password_status(
    current_user: dict = Depends(get_current_user),
) -> PasswordStatusResponse:
    """
    Returns whether the current user must change their password.
    Frontend uses this to redirect to the change-password screen on first login.
    """
    supabase_user_id = current_user["supabase_user_id"]
    row = await db.fetch_one(
        "SELECT must_change_pw, email FROM users WHERE supabase_user_id=$1::uuid",
        supabase_user_id,
    )
    if not row:
        # User exists in Supabase Auth but not in our users table — safe default
        return PasswordStatusResponse(must_change_pw=False, email=current_user.get("email", ""))

    return PasswordStatusResponse(
        must_change_pw=bool(row["must_change_pw"]),
        email=row["email"],
    )
