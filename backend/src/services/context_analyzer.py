"""
ContextAnalyzer — Detects urgencies and opportunities across tenant data.

Strategy:
  1. Single psycopg2 connection (sync) via run_in_executor
  2. Four analysis sections: inventory, finance, CRM, operations
  3. Each section is fault-tolerant — a failing query never breaks the full response
  4. Results sorted by severity: critical → high → medium
"""

import asyncio
import logging
import os
from datetime import datetime, timezone
from functools import partial
from typing import Any, Dict, List

import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

# ── Thresholds (adjust per tenant in the future) ──────────────────────────────
_LOW_STOCK_THRESHOLD = 10
_CRITICAL_STOCK_THRESHOLD = 3
_STALE_LEAD_DAYS = 3
_OVERDUE_ORDER_DAYS = 30
_PENDING_INVOICE_THRESHOLD = 3   # >3 orders unfactured = "high"

_SEVERITY_RANK = {"critical": 3, "high": 2, "medium": 1}


# ── Sync core (runs in executor thread) ───────────────────────────────────────

def _analyze_sync(tenant_id: str) -> Dict[str, Any]:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("[CONTEXT_ANALYZER] DATABASE_URL not set — skipping analysis")
        return _empty_result()

    urgencies: List[Dict[str, Any]] = []

    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    try:
        cur = conn.cursor()
        urgencies.extend(_inv_check(cur, tenant_id))
        urgencies.extend(_invoice_check(cur, tenant_id))
        urgencies.extend(_overdue_check(cur, tenant_id))
        urgencies.extend(_crm_check(cur, tenant_id))
    finally:
        conn.close()

    urgencies.sort(key=lambda u: _SEVERITY_RANK.get(u["severity"], 0), reverse=True)

    return {
        "urgencies": urgencies[:10],
        "total_issues": len(urgencies),
        "analyzed_at": datetime.now(timezone.utc),
    }


# ── Analysis sections ─────────────────────────────────────────────────────────

def _inv_check(cur: Any, tenant_id: str) -> List[Dict]:
    """Detect products with stock at or below threshold."""
    try:
        cur.execute(
            """SELECT name, sku, stock
               FROM products
               WHERE tenant_id = %s
                 AND is_active = TRUE
                 AND stock <= %s
               ORDER BY stock ASC
               LIMIT 15""",
            (tenant_id, _LOW_STOCK_THRESHOLD),
        )
        rows = cur.fetchall()
    except Exception as exc:
        logger.warning("[CONTEXT_ANALYZER] inventory query failed: %s", exc)
        return []

    result = []
    for row in rows:
        severity = "critical" if row["stock"] <= _CRITICAL_STOCK_THRESHOLD else "high"
        result.append({
            "type": "inventory",
            "severity": severity,
            "title": f"Stock bajo: {row['name']}",
            "description": f"Solo {row['stock']} unidades (SKU: {row['sku'] or 'N/A'})",
            "suggested_action": f"Crear orden de compra para {row['name']}",
            "agent_id": "agent_30_purchase_orders",
            "data": {"sku": row["sku"], "stock": row["stock"]},
        })
    return result


def _invoice_check(cur: Any, tenant_id: str) -> List[Dict]:
    """Detect completed orders that haven't been invoiced (CFDI pending)."""
    try:
        cur.execute(
            """SELECT COUNT(*) AS cnt
               FROM orders
               WHERE tenant_id = %s
                 AND status = 'completed'
                 AND invoice_id IS NULL""",
            (tenant_id,),
        )
        row = cur.fetchone()
        cnt = int(row["cnt"]) if row else 0
    except Exception as exc:
        logger.warning("[CONTEXT_ANALYZER] invoice query failed: %s", exc)
        return []

    if cnt == 0:
        return []

    severity = "high" if cnt >= _PENDING_INVOICE_THRESHOLD else "medium"
    return [{
        "type": "operations",
        "severity": severity,
        "title": f"{cnt} orden{'es' if cnt > 1 else ''} sin facturar",
        "description": "Órdenes completadas pendientes de CFDI",
        "suggested_action": "Generar facturas CFDI para órdenes completadas",
        "agent_id": "agent_13_cfdi_billing",
        "data": {"count": cnt},
    }]


def _overdue_check(cur: Any, tenant_id: str) -> List[Dict]:
    """Detect orders with pending payment older than threshold."""
    try:
        cur.execute(
            f"""SELECT COUNT(*) AS cnt, COALESCE(SUM(total), 0) AS total
               FROM orders
               WHERE tenant_id = %s
                 AND status IN ('pending', 'payment_pending')
                 AND created_at < NOW() - INTERVAL '{_OVERDUE_ORDER_DAYS} days'""",
            (tenant_id,),
        )
        row = cur.fetchone()
        if not row or int(row["cnt"]) == 0:
            return []
        cnt = int(row["cnt"])
        total = float(row["total"])
    except Exception as exc:
        logger.warning("[CONTEXT_ANALYZER] overdue query failed: %s", exc)
        return []

    return [{
        "type": "finance",
        "severity": "high",
        "title": f"Cobros pendientes: ${total:,.0f} MXN",
        "description": f"{cnt} orden{'es' if cnt > 1 else ''} con pago pendiente (+{_OVERDUE_ORDER_DAYS} días)",
        "suggested_action": "Enviar recordatorios de pago",
        "agent_id": "agent_33_follow_up",
        "data": {"count": cnt, "total": total},
    }]


def _crm_check(cur: Any, tenant_id: str) -> List[Dict]:
    """Detect leads that haven't been updated in more than threshold days."""
    try:
        cur.execute(
            f"""SELECT COUNT(*) AS cnt
               FROM leads
               WHERE tenant_id = %s
                 AND status IN ('new', 'contacted')
                 AND updated_at < NOW() - INTERVAL '{_STALE_LEAD_DAYS} days'""",
            (tenant_id,),
        )
        row = cur.fetchone()
        cnt = int(row["cnt"]) if row else 0
    except Exception as exc:
        # leads table may not exist yet — log at debug level only
        logger.debug("[CONTEXT_ANALYZER] crm query failed (table may not exist): %s", exc)
        return []

    if cnt == 0:
        return []

    return [{
        "type": "crm",
        "severity": "medium",
        "title": f"{cnt} lead{'s' if cnt > 1 else ''} sin seguimiento",
        "description": f"Sin actualizar en más de {_STALE_LEAD_DAYS} días",
        "suggested_action": "Programar seguimiento de leads",
        "agent_id": "agent_33_follow_up",
        "data": {"count": cnt},
    }]


def _empty_result() -> Dict[str, Any]:
    return {
        "urgencies": [],
        "total_issues": 0,
        "analyzed_at": datetime.now(timezone.utc),
    }


# ── Public async interface ────────────────────────────────────────────────────

class ContextAnalyzer:
    """
    Async wrapper around the sync DB analysis.
    Designed to run concurrently with other async operations.
    """

    async def analyze(self, tenant_id: str) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        try:
            return await loop.run_in_executor(
                None, partial(_analyze_sync, tenant_id)
            )
        except Exception as exc:
            logger.error("[CONTEXT_ANALYZER] analysis failed: %s", exc)
            return _empty_result()


# Module-level singleton
_analyzer: ContextAnalyzer | None = None


def get_context_analyzer() -> ContextAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = ContextAnalyzer()
    return _analyzer
