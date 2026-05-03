"""
Supabase JWT validation — FastAPI dependency for protected endpoints.

Usage:
    @router.get("/protected")
    async def endpoint(current_user: dict = Depends(get_current_user)):
        tenant_id = current_user["tenant_id"]

Returns:
    {
        "supabase_user_id": str,   # JWT sub claim
        "internal_user_id": str,   # users.id (PK)
        "tenant_id": str,          # users.tenant_id
        "email": str | None,
        "role": str | None,
    }

Raises:
    401 — missing/invalid/expired token
    500 — SUPABASE_JWT_SECRET not configured
"""
import os
from typing import Optional

import jwt
from fastapi import Header, HTTPException

from src.agents.samantha.db_queries import get_user_by_supabase_id


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.removeprefix("Bearer ")

    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if not jwt_secret:
        raise HTTPException(
            status_code=500,
            detail="Authentication not configured on server",
        )

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")

    supabase_user_id: Optional[str] = payload.get("sub")
    if not supabase_user_id:
        raise HTTPException(status_code=401, detail="Token missing sub claim")

    user_row = await get_user_by_supabase_id(supabase_user_id)
    if not user_row:
        raise HTTPException(
            status_code=401,
            detail="Authenticated user not found in system",
        )

    return {
        "supabase_user_id": supabase_user_id,
        "internal_user_id": user_row["id"],
        "tenant_id": user_row["tenant_id"],
        "email": user_row.get("email"),
        "role": user_row.get("role"),
    }
