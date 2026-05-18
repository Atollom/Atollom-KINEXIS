"""
Supabase Admin client — backend operations that bypass RLS.
Uses SUPABASE_SERVICE_ROLE_KEY (never exposed to frontend).
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def _get_client():
    """Returns a Supabase client with service_role key. None if not configured."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        logger.warning("[SUPABASE_ADMIN] SUPABASE_URL or SERVICE_ROLE_KEY not set")
        return None
    from supabase import create_client
    return create_client(url, key)


async def create_auth_user(
    email: str, password: str, full_name: str
) -> Optional[str]:
    """
    Creates a user in Supabase Auth with email already confirmed.
    Returns the Supabase UUID (used as supabase_user_id in our users table).
    Returns None if Supabase is not configured or creation fails.
    """
    client = _get_client()
    if not client:
        return None
    try:
        response = client.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
            }
        )
        supabase_id = response.user.id if response.user else None
        if supabase_id:
            logger.info("[SUPABASE_ADMIN] Auth user created: %s → %s", email, supabase_id)
        return supabase_id
    except Exception as exc:
        logger.error("[SUPABASE_ADMIN] create_auth_user failed for %s: %s", email, exc)
        return None


async def update_auth_password(supabase_user_id: str, new_password: str) -> bool:
    """Updates a Supabase Auth user's password. Returns True on success."""
    client = _get_client()
    if not client:
        return False
    try:
        client.auth.admin.update_user_by_id(
            supabase_user_id,
            {"password": new_password},
        )
        logger.info("[SUPABASE_ADMIN] Password updated for user %s", supabase_user_id)
        return True
    except Exception as exc:
        logger.error(
            "[SUPABASE_ADMIN] update_auth_password failed for %s: %s",
            supabase_user_id,
            exc,
        )
        return False


async def delete_auth_user(supabase_user_id: str) -> bool:
    """Deletes a user from Supabase Auth (e.g. during rollback). Returns True on success."""
    client = _get_client()
    if not client:
        return False
    try:
        client.auth.admin.delete_user(supabase_user_id)
        logger.info("[SUPABASE_ADMIN] Auth user deleted: %s", supabase_user_id)
        return True
    except Exception as exc:
        logger.error(
            "[SUPABASE_ADMIN] delete_auth_user failed for %s: %s",
            supabase_user_id,
            exc,
        )
        return False
