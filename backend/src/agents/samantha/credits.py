"""
Samantha credit system — tracks monthly usage per tenant via tenant_credits table.
"""

import asyncio
import os
from functools import partial
from typing import Dict

import psycopg2
from psycopg2.extras import RealDictCursor

_PLAN_LIMITS: Dict[str, int] = {
    "starter": 500,
    "growth":  750,
    "pro":     1000,
}
_DEFAULT_LIMIT = 500


def _credits_sync(tenant_id: str) -> Dict:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return {"ok": True, "remaining": 999, "limit": 999}

    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    try:
        cur = conn.cursor()

        # Auto-reset if past reset_date
        cur.execute(
            """UPDATE tenant_credits
               SET credits_used = 0,
                   reset_date   = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
                   updated_at   = NOW()
               WHERE tenant_id = %s AND reset_date <= CURRENT_DATE
               RETURNING tenant_id""",
            (tenant_id,),
        )
        conn.commit()

        cur.execute(
            "SELECT credits_limit, credits_used FROM tenant_credits WHERE tenant_id = %s",
            (tenant_id,),
        )
        row = cur.fetchone()

        if not row:
            # Create row on first access using plan
            cur.execute("SELECT plan FROM tenants WHERE id = %s", (tenant_id,))
            t = cur.fetchone()
            limit = _PLAN_LIMITS.get(t["plan"] if t else "starter", _DEFAULT_LIMIT)
            cur.execute(
                """INSERT INTO tenant_credits (tenant_id, credits_limit, credits_used)
                   VALUES (%s, %s, 0) ON CONFLICT DO NOTHING""",
                (tenant_id, limit),
            )
            conn.commit()
            return {"ok": True, "remaining": limit, "limit": limit}

        remaining = row["credits_limit"] - row["credits_used"]
        return {
            "ok": remaining > 0,
            "remaining": max(remaining, 0),
            "limit": row["credits_limit"],
        }
    finally:
        conn.close()


def _decrement_sync(tenant_id: str) -> None:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return
    conn = psycopg2.connect(db_url)
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE tenant_credits SET credits_used = credits_used + 1, updated_at = NOW() WHERE tenant_id = %s",
            (tenant_id,),
        )
        conn.commit()
    finally:
        conn.close()


async def check_credits(tenant_id: str) -> Dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_credits_sync, tenant_id))


async def decrement_credits(tenant_id: str) -> None:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_decrement_sync, tenant_id))
