"""
Agente #18: Finance Snapshot
Responsabilidad: Reporte financiero ejecutivo (CxC, CxP, cashflow, ventas)
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_PERIODS  = {"today", "week", "month", "quarter"}
VALID_SECTIONS = {"receivables", "payables", "cashflow", "sales"}

PERIOD_DAYS: Dict[str, int] = {
    "today": 1, "week": 7, "month": 30, "quarter": 90,
}

BASE_DAILY = {
    "sales_total": 2915.0, "sales_count": 1.4,
    "receivables_total": 770.0, "receivables_overdue": 173.0, "receivables_count": 0.27,
    "payables_total": 1500.0, "payables_due_soon": 400.0, "payables_count": 0.17,
}


class Agent18FinanceSnapshot:
    """
    Finance Snapshot — Reporte ejecutivo financiero por período.
    Fuente: tabla orders + cfdi_documents en Supabase. Fallback a mock.

    Input:  { "period": str, "tenant_id": str, "include": list }
    Output: { "period", "snapshot": {sales, receivables, payables, cashflow}, "alerts" }
    """

    REQUIRED_FIELDS = ["period", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #18 - Finance Snapshot"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s period=%s tenant=%s source=%s",
                        self.name, validated["period"], validated["tenant_id"],
                        result.get("source", "?"))
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                raise ValueError(f"Missing required field: {f}")
        if not str(data["tenant_id"]).strip():
            raise ValueError("tenant_id cannot be empty")
        if data["period"] not in VALID_PERIODS:
            raise ValueError(f"Invalid period. Valid: {VALID_PERIODS}")
        include = data.get("include", list(VALID_SECTIONS))
        invalid = set(include) - VALID_SECTIONS
        if invalid:
            raise ValueError(f"Invalid sections: {invalid}")
        data["include"] = include
        return data

    # ── Supabase queries ──────────────────────────────────────────────────────

    async def _fetch_sales(self, tenant_id: str, days: int) -> Optional[Dict[str, Any]]:
        from src.utils.database import db
        row = await db.fetch_one(
            """
            SELECT
                COALESCE(SUM(total_amount), 0) AS total,
                COUNT(*) AS count
            FROM orders
            WHERE tenant_id = $1
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
              AND status NOT IN ('cancelled', 'refunded')
            """,
            tenant_id, str(days),
        )
        if row and (row["total"] or row["count"]):
            total = float(row["total"])
            count = int(row["count"])
            return {"total": total, "count": count,
                    "average": round(total / count, 2) if count > 0 else 0.0}
        return None

    async def _fetch_receivables(self, tenant_id: str, days: int) -> Optional[Dict[str, Any]]:
        from src.utils.database import db
        row = await db.fetch_one(
            """
            SELECT
                COALESCE(SUM(total), 0)                                          AS total,
                COALESCE(SUM(CASE WHEN due_date < NOW() THEN total ELSE 0 END), 0) AS overdue,
                COUNT(*)                                                          AS count
            FROM cfdi_documents
            WHERE tenant_id = $1
              AND type = 'ingreso'
              AND status IN ('vigente', 'pending')
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
            """,
            tenant_id, str(days),
        )
        if row and row["total"]:
            return {"total": float(row["total"]), "overdue": float(row["overdue"]),
                    "count": int(row["count"])}
        return None

    async def _fetch_payables(self, tenant_id: str, days: int) -> Optional[Dict[str, Any]]:
        from src.utils.database import db
        row = await db.fetch_one(
            """
            SELECT
                COALESCE(SUM(total), 0) AS total,
                COALESCE(SUM(CASE WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                               THEN total ELSE 0 END), 0) AS due_soon,
                COUNT(*) AS count
            FROM purchase_orders
            WHERE tenant_id = $1
              AND status IN ('approved', 'sent_to_supplier')
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
            """,
            tenant_id, str(days),
        )
        if row and row["total"]:
            return {"total": float(row["total"]), "due_soon": float(row["due_soon"]),
                    "count": int(row["count"])}
        return None

    # ── Mock fallbacks ────────────────────────────────────────────────────────

    def _mock_sales(self, scale: float) -> Dict[str, Any]:
        total = round(BASE_DAILY["sales_total"] * scale, 2)
        count = max(1, round(BASE_DAILY["sales_count"] * scale))
        return {"total": total, "count": count, "average": round(total / count, 2)}

    def _mock_receivables(self, scale: float) -> Dict[str, Any]:
        return {"total": round(BASE_DAILY["receivables_total"] * scale, 2),
                "overdue": round(BASE_DAILY["receivables_overdue"] * scale, 2),
                "count": max(1, round(BASE_DAILY["receivables_count"] * scale))}

    def _mock_payables(self, scale: float) -> Dict[str, Any]:
        return {"total": round(BASE_DAILY["payables_total"] * scale, 2),
                "due_soon": round(BASE_DAILY["payables_due_soon"] * scale, 2),
                "count": max(1, round(BASE_DAILY["payables_count"] * scale))}

    # ── Alerts ────────────────────────────────────────────────────────────────

    def _build_alerts(self, snapshot: Dict, include: List[str]) -> List[str]:
        alerts = []
        if "receivables" in include and "receivables" in snapshot:
            overdue = snapshot["receivables"]["overdue"]
            count = snapshot["receivables"]["count"]
            if overdue > 0:
                alerts.append(f"{count} cliente(s) con CxC vencidas (total: ${overdue:,.0f})")
        if "payables" in include and "payables" in snapshot:
            due_soon = snapshot["payables"]["due_soon"]
            if due_soon > 0:
                alerts.append(f"Pagos a proveedores próximos a vencer: ${due_soon:,.0f}")
        return alerts

    # ── Process ───────────────────────────────────────────────────────────────

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        period    = data["period"]
        include   = data["include"]
        tenant_id = data["tenant_id"]
        days      = PERIOD_DAYS[period]
        scale     = float(days)
        snapshot: Dict[str, Any] = {}
        source = "supabase"

        if "sales" in include:
            try:
                result = await self._fetch_sales(tenant_id, days)
                snapshot["sales"] = result or self._mock_sales(scale)
                if not result:
                    source = "mock"
            except Exception as e:
                logger.warning("%s sales query failed: %s", self.name, e)
                snapshot["sales"] = self._mock_sales(scale)
                source = "mock"

        if "receivables" in include:
            try:
                result = await self._fetch_receivables(tenant_id, days)
                snapshot["receivables"] = result or self._mock_receivables(scale)
                if not result:
                    source = "mock"
            except Exception as e:
                logger.warning("%s receivables query failed: %s", self.name, e)
                snapshot["receivables"] = self._mock_receivables(scale)
                source = "mock"

        if "payables" in include:
            try:
                result = await self._fetch_payables(tenant_id, days)
                snapshot["payables"] = result or self._mock_payables(scale)
                if not result:
                    source = "mock"
            except Exception as e:
                logger.warning("%s payables query failed: %s", self.name, e)
                snapshot["payables"] = self._mock_payables(scale)
                source = "mock"

        if "cashflow" in include:
            sales_total    = snapshot.get("sales",    {}).get("total", self._mock_sales(scale)["total"])
            payables_total = snapshot.get("payables", {}).get("total", self._mock_payables(scale)["total"])
            net = round(sales_total - payables_total, 2)
            snapshot["cashflow"] = {"net": net, "projected_30d": round(net * 0.9, 2)}

        return {
            "period":            period,
            "tenant_id":         tenant_id,
            "snapshot":          snapshot,
            "alerts":            self._build_alerts(snapshot, include),
            "sections_included": include,
            "source":            source,
        }


finance_snapshot = Agent18FinanceSnapshot()
