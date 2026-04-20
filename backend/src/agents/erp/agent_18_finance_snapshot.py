"""
Agente #18: Finance Snapshot
Responsabilidad: Reporte financiero ejecutivo (CxC, CxP, cashflow)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

VALID_PERIODS = {"today", "week", "month", "quarter"}
VALID_SECTIONS = {"receivables", "payables", "cashflow", "sales"}

# Mock multipliers per period — Fase 2: real Supabase queries
PERIOD_SCALE: Dict[str, float] = {
    "today":   1.0,
    "week":    7.0,
    "month":   30.0,
    "quarter": 90.0,
}

# Base daily mock figures (MXN)
BASE_DAILY = {
    "sales_total":        2915.0,
    "sales_count":        1.4,
    "receivables_total":  770.0,
    "receivables_overdue": 173.0,
    "receivables_count":  0.27,
    "payables_total":     1500.0,
    "payables_due_soon":  400.0,
    "payables_count":     0.17,
}


class Agent18FinanceSnapshot:
    """
    Finance Snapshot — Reporte ejecutivo financiero por período.

    Períodos: today | week | month | quarter
    Secciones: receivables | payables | cashflow | sales

    Input:
        {
            "period":    str  — today | week | month | quarter
            "tenant_id": str  — ID del tenant
            "include":   list — secciones a incluir (opcional, default: todas)
        }

    Output:
        {
            "period":   str
            "snapshot": {sales, receivables, payables, cashflow}
            "alerts":   list[str]
        }
    """

    REQUIRED_FIELDS = ["period", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #18 - Finance Snapshot"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Genera snapshot financiero."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} period={validated['period']} tenant={validated['tenant_id']}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        tenant = str(data["tenant_id"]).strip()
        if not tenant:
            raise ValueError("tenant_id cannot be empty")

        if data["period"] not in VALID_PERIODS:
            raise ValueError(f"Invalid period. Valid: {VALID_PERIODS}")

        include = data.get("include", list(VALID_SECTIONS))
        invalid = set(include) - VALID_SECTIONS
        if invalid:
            raise ValueError(f"Invalid sections: {invalid}. Valid: {VALID_SECTIONS}")
        data["include"] = include

        return data

    def _scale(self, base_key: str, scale: float) -> float:
        return round(BASE_DAILY[base_key] * scale, 2)

    def _scale_int(self, base_key: str, scale: float) -> int:
        return max(1, round(BASE_DAILY[base_key] * scale))

    def _build_alerts(self, snapshot: Dict, include: List[str]) -> List[str]:
        alerts = []
        if "receivables" in include and "receivables" in snapshot:
            overdue = snapshot["receivables"]["overdue"]
            count = snapshot["receivables"]["count"]
            if overdue > 0:
                alerts.append(
                    f"{count} cliente(s) con CxC vencidas (total: ${overdue:,.0f})"
                )
        if "payables" in include and "payables" in snapshot:
            due_soon = snapshot["payables"]["due_soon"]
            if due_soon > 0:
                alerts.append(
                    f"Pagos a proveedores próximos a vencer: ${due_soon:,.0f}"
                )
        return alerts

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Fetch real data from Supabase: orders, invoices, accounts_receivable, accounts_payable
        - Calculate rolling cashflow from bank transactions
        - Push critical alerts to Samantha notification queue
        """
        period = data["period"]
        include = data["include"]
        scale = PERIOD_SCALE[period]
        snapshot: Dict[str, Any] = {}

        if "sales" in include:
            total = self._scale("sales_total", scale)
            count = self._scale_int("sales_count", scale)
            snapshot["sales"] = {
                "total": total,
                "count": count,
                "average": round(total / count, 2) if count > 0 else 0.0,
            }

        if "receivables" in include:
            total = self._scale("receivables_total", scale)
            overdue = self._scale("receivables_overdue", scale)
            snapshot["receivables"] = {
                "total": total,
                "overdue": overdue,
                "count": self._scale_int("receivables_count", scale),
            }

        if "payables" in include:
            total = self._scale("payables_total", scale)
            due_soon = self._scale("payables_due_soon", scale)
            snapshot["payables"] = {
                "total": total,
                "due_soon": due_soon,
                "count": self._scale_int("payables_count", scale),
            }

        if "cashflow" in include:
            sales_total = snapshot.get("sales", {}).get("total", self._scale("sales_total", scale))
            payables_total = snapshot.get("payables", {}).get("total", self._scale("payables_total", scale))
            net = round(sales_total - payables_total, 2)
            snapshot["cashflow"] = {
                "net": net,
                "projected_30d": round(net * 0.9, 2),
            }

        alerts = self._build_alerts(snapshot, include)

        return {
            "period": period,
            "tenant_id": data["tenant_id"],
            "snapshot": snapshot,
            "alerts": alerts,
            "sections_included": include,
            "note": "Supabase financial data integration pending — Fase 2",
        }


finance_snapshot = Agent18FinanceSnapshot()
