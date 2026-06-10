"""
Samantha Credits — check and decrement per-tenant monthly usage.
Table: samantha_credits (tenant_id, used, limit, reset_at)
Falls back to unlimited if the table doesn't exist yet.
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

_PLAN_LIMITS = {
    "trial":   100,
    "starter": 500,
    "growth":  2000,
    "enterprise": 10000,
}
_DEFAULT_LIMIT = 500


async def check_credits(tenant_id: str) -> Dict[str, Any]:
    """Returns {"ok": bool, "remaining": int, "limit": int}."""
    from src.utils.database import db
    try:
        row = await db.fetch_one(
            """SELECT used, monthly_limit,
                      (monthly_limit - used) AS remaining
               FROM samantha_credits
               WHERE tenant_id=$1 LIMIT 1""",
            tenant_id,
        )
        if row:
            remaining = max(int(row.get("remaining", 0)), 0)
            limit = int(row.get("monthly_limit", _DEFAULT_LIMIT))
            return {"ok": remaining > 0, "remaining": remaining, "limit": limit}

        # Row missing — auto-create with default limit
        tenant = await db.fetch_one(
            "SELECT plan FROM tenants WHERE id=$1 LIMIT 1", tenant_id
        )
        plan = (tenant.get("plan", "starter") if tenant else "starter")
        limit = _PLAN_LIMITS.get(plan, _DEFAULT_LIMIT)
        await db.execute(
            "INSERT INTO samantha_credits (tenant_id, used, monthly_limit) VALUES ($1, 0, $2) "
            "ON CONFLICT (tenant_id) DO NOTHING",
            tenant_id, limit,
        )
        return {"ok": True, "remaining": limit, "limit": limit}
    except Exception as exc:
        logger.warning("check_credits failed (allowing request): %s", exc)
        return {"ok": True, "remaining": _DEFAULT_LIMIT, "limit": _DEFAULT_LIMIT}


async def decrement_credits(tenant_id: str) -> None:
    """Increment used counter. Silent on failure."""
    from src.utils.database import db
    try:
        await db.execute(
            "UPDATE samantha_credits SET used = used + 1 WHERE tenant_id=$1",
            tenant_id,
        )
    except Exception as exc:
        logger.warning("decrement_credits failed (non-fatal): %s", exc)
