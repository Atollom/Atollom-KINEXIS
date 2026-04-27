"""
DB context fetcher for Samantha — uses psycopg2 (sync) via run_in_executor.
"""

import asyncio
import os
from functools import partial
from typing import Any, Dict

import psycopg2
from psycopg2.extras import RealDictCursor


def _fetch_context_sync(tenant_id: str) -> Dict[str, Any]:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return _empty_context("(sin conexión DB)")

    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    try:
        cur = conn.cursor()

        cur.execute("SELECT name, plan FROM tenants WHERE id = %s", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant:
            return _empty_context("(tenant no encontrado)")

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM products WHERE tenant_id = %s AND is_active = TRUE",
            (tenant_id,),
        )
        products_count = cur.fetchone()["cnt"]

        cur.execute(
            """SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS rev
               FROM orders
               WHERE tenant_id = %s AND created_at > NOW() - INTERVAL '30 days'""",
            (tenant_id,),
        )
        row = cur.fetchone()
        orders_count = row["cnt"]
        revenue_30d = float(row["rev"])

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM customers WHERE tenant_id = %s",
            (tenant_id,),
        )
        customers_count = cur.fetchone()["cnt"]

        cur.execute(
            "SELECT COUNT(*) AS cnt FROM cfdi_invoices WHERE tenant_id = %s AND status = 'valid'",
            (tenant_id,),
        )
        invoices_count = cur.fetchone()["cnt"]

        cur.execute(
            """SELECT name, sku, price, stock
               FROM products
               WHERE tenant_id = %s AND is_active = TRUE
               ORDER BY stock ASC
               LIMIT 5""",
            (tenant_id,),
        )
        low_stock = [dict(r) for r in cur.fetchall()]

        cur.execute(
            """SELECT order_number, total, status, created_at::date AS date
               FROM orders
               WHERE tenant_id = %s
               ORDER BY created_at DESC
               LIMIT 5""",
            (tenant_id,),
        )
        recent_orders = [dict(r) for r in cur.fetchall()]

        return {
            "tenant_name": tenant["name"],
            "plan": tenant["plan"],
            "products_count": products_count,
            "orders_count": orders_count,
            "revenue_30d": revenue_30d,
            "customers_count": customers_count,
            "invoices_count": invoices_count,
            "low_stock": low_stock,
            "recent_orders": recent_orders,
        }
    finally:
        conn.close()


def _empty_context(reason: str) -> Dict[str, Any]:
    return {
        "tenant_name": reason,
        "plan": "unknown",
        "products_count": 0,
        "orders_count": 0,
        "revenue_30d": 0.0,
        "customers_count": 0,
        "invoices_count": 0,
        "low_stock": [],
        "recent_orders": [],
    }


async def get_tenant_context(tenant_id: str) -> Dict[str, Any]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(_fetch_context_sync, tenant_id))
