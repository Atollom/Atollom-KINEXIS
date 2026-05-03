"""
Dashboard Router
Métricas y stats para dashboard principal
"""

import os
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, HTTPException

from src.services.context_analyzer import get_context_analyzer

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_DATABASE_URL = os.getenv("DATABASE_URL")


@contextmanager
def get_db():
    """Context manager — garantiza que conn se cierra aunque haya excepción."""
    if not _DATABASE_URL:
        raise HTTPException(status_code=503, detail="DATABASE_URL no configurado")
    conn = psycopg2.connect(_DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()


@router.get("/stats/{tenant_id}")
async def get_stats(tenant_id: str):
    """
    Estadísticas del dashboard principal.

    Returns:
        products    - productos activos
        orders      - órdenes últimos 30 días
        invoices    - facturas válidas totales
        revenue_30d - ingresos últimos 30 días (órdenes paid/delivered)
        customers   - clientes registrados
    """
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COUNT(*) AS count FROM products WHERE tenant_id = %s AND is_active = TRUE",
                    (tenant_id,),
                )
                total_products = cur.fetchone()["count"]

                cur.execute(
                    "SELECT COUNT(*) AS count FROM orders WHERE tenant_id = %s AND created_at > NOW() - INTERVAL '30 days'",
                    (tenant_id,),
                )
                total_orders = cur.fetchone()["count"]

                cur.execute(
                    "SELECT COUNT(*) AS count FROM cfdi_invoices WHERE tenant_id = %s AND status = 'valid'",
                    (tenant_id,),
                )
                total_invoices = cur.fetchone()["count"]

                cur.execute(
                    """
                    SELECT COALESCE(SUM(total), 0) AS revenue
                    FROM orders
                    WHERE tenant_id = %s
                      AND created_at > NOW() - INTERVAL '30 days'
                      AND status IN ('paid', 'delivered')
                    """,
                    (tenant_id,),
                )
                revenue_30d = float(cur.fetchone()["revenue"])

                cur.execute(
                    "SELECT COUNT(*) AS count FROM customers WHERE tenant_id = %s",
                    (tenant_id,),
                )
                total_customers = cur.fetchone()["count"]

        return {
            "products":    total_products,
            "orders":      total_orders,
            "invoices":    total_invoices,
            "revenue_30d": revenue_30d,
            "customers":   total_customers,
            "tenant_id":   tenant_id,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/urgencies/{tenant_id}")
async def get_urgencies(tenant_id: str):
    """Proactive urgencies detected by ContextAnalyzer."""
    try:
        analyzer = get_context_analyzer()
        result = await analyzer.analyze(tenant_id)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/recent-orders/{tenant_id}")
async def get_recent_orders(tenant_id: str, limit: int = 5):
    """Órdenes recientes con nombre del cliente."""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        o.id,
                        o.order_number,
                        o.total,
                        o.status,
                        o.channel,
                        o.created_at,
                        c.name AS customer_name
                    FROM orders o
                    LEFT JOIN customers c ON o.customer_id = c.id
                    WHERE o.tenant_id = %s
                    ORDER BY o.created_at DESC
                    LIMIT %s
                    """,
                    (tenant_id, limit),
                )
                orders = [dict(row) for row in cur.fetchall()]

        return {"orders": orders}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
