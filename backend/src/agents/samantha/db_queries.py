"""
Samantha DB Queries — load live tenant context and resolve users.
Uses asyncpg (DATABASE_URL) so it works without RLS complexity.
"""
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


async def get_user_by_supabase_id(supabase_user_id: str) -> Optional[Dict[str, Any]]:
    """Return the users row that matches a Supabase auth.uid()."""
    from src.utils.database import db
    try:
        row = await db.fetch_one(
            "SELECT id, email, role, tenant_id FROM users WHERE supabase_user_id=$1 LIMIT 1",
            supabase_user_id,
        )
        return dict(row) if row else None
    except Exception as exc:
        logger.error("get_user_by_supabase_id failed: %s", exc)
        return None


async def get_tenant_context(tenant_id: str) -> Dict[str, Any]:
    """
    Load a snapshot of live tenant data to inject into Samantha's system prompt.
    Returns sensible defaults if any query fails (never raises).
    """
    from src.utils.database import db

    ctx: Dict[str, Any] = {
        "tenant_name": "tu empresa",
        "plan": "starter",
        "products_count": 0,
        "orders_count": 0,
        "revenue_30d": 0.0,
        "customers_count": 0,
        "invoices_count": 0,
        "low_stock": [],
        "recent_orders": [],
    }

    try:
        tenant = await db.fetch_one(
            "SELECT name, plan FROM tenants WHERE id=$1 LIMIT 1", tenant_id
        )
        if tenant:
            ctx["tenant_name"] = tenant.get("name", "tu empresa")
            ctx["plan"] = tenant.get("plan", "starter")
    except Exception as exc:
        logger.warning("tenant lookup failed: %s", exc)

    try:
        row = await db.fetch_one(
            """SELECT
                COUNT(*)::int AS cnt,
                COALESCE(SUM(CASE WHEN status='completed' THEN total ELSE 0 END), 0)::float AS revenue
               FROM orders WHERE tenant_id=$1 AND created_at >= NOW() - INTERVAL '30 days'""",
            tenant_id,
        )
        if row:
            ctx["orders_count"] = row.get("cnt", 0)
            ctx["revenue_30d"] = float(row.get("revenue", 0))
    except Exception as exc:
        logger.warning("orders query failed: %s", exc)

    try:
        row = await db.fetch_one(
            "SELECT COUNT(*)::int AS cnt FROM inventory WHERE tenant_id=$1", tenant_id
        )
        if row:
            ctx["products_count"] = row.get("cnt", 0)
    except Exception as exc:
        logger.warning("inventory count failed: %s", exc)

    try:
        row = await db.fetch_one(
            "SELECT COUNT(DISTINCT contact_email)::int AS cnt FROM leads WHERE tenant_id=$1", tenant_id
        )
        if row:
            ctx["customers_count"] = row.get("cnt", 0)
    except Exception as exc:
        logger.warning("customers count failed: %s", exc)

    try:
        row = await db.fetch_one(
            "SELECT COUNT(*)::int AS cnt FROM cfdi_records WHERE tenant_id=$1 AND created_at >= NOW() - INTERVAL '30 days'",
            tenant_id,
        )
        if row:
            ctx["invoices_count"] = row.get("cnt", 0)
    except Exception as exc:
        logger.warning("cfdi count failed: %s", exc)

    try:
        rows = await db.fetch_all(
            "SELECT sku, stock FROM inventory WHERE tenant_id=$1 AND stock < 5 ORDER BY stock LIMIT 5",
            tenant_id,
        )
        ctx["low_stock"] = [dict(r) for r in rows]
    except Exception as exc:
        logger.warning("low_stock query failed: %s", exc)

    try:
        rows = await db.fetch_all(
            "SELECT id, total, status FROM orders WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 5",
            tenant_id,
        )
        ctx["recent_orders"] = [dict(r) for r in rows]
    except Exception as exc:
        logger.warning("recent_orders query failed: %s", exc)

    return ctx
