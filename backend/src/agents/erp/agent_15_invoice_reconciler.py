"""
Agente #15: Invoice Reconciler
Responsabilidad: Conciliar facturas CFDI contra pagos recibidos
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS  = {"reconcile", "find_unpaid", "get_overdue", "get_summary"}
VALID_PERIODS  = {"week", "month", "quarter"}
PERIOD_DAYS    = {"week": 7, "month": 30, "quarter": 90}


class Agent15InvoiceReconciler:
    """
    Invoice Reconciler — Conciliación facturas vs pagos para detección de cartera vencida.

    Input:
        {
            "action":    str  — reconcile | find_unpaid | get_overdue | get_summary
            "period":    str  — week | month | quarter
            "tenant_id": str
        }
    Output:
        { "action", "period", "summary": {...}, "overdue": [...], "alerts", "source" }
    """

    REQUIRED_FIELDS = ["action", "tenant_id"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #15 - Invoice Reconciler"

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        action = data.get("action", "get_summary")
        if action not in VALID_ACTIONS:
            action = "get_summary"
        period = data.get("period", "month")
        if period not in VALID_PERIODS:
            period = "month"
        return {"action": action, "period": period, "tenant_id": str(data.get("tenant_id", ""))}

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        tenant_id = data["tenant_id"]
        try:
            from src.utils.database import db
            days = PERIOD_DAYS[data["period"]]
            invoices = await db.fetch_all(
                """SELECT folio, total, status, created_at
                   FROM cfdi_invoices
                   WHERE tenant_id=$1::uuid AND created_at > NOW() - ($2 || ' days')::INTERVAL
                   ORDER BY created_at DESC LIMIT 50""",
                tenant_id, str(days),
            )
            if invoices:
                return self._build_result(data["action"], data["period"], [dict(i) for i in invoices])
        except Exception as exc:
            logger.warning("%s DB failed: %s — mock", self.name, exc)

        return self._mock_result(data["action"], data["period"])

    def _build_result(self, action: str, period: str, invoices: List[Dict]) -> Dict:
        total_invoiced = sum(float(i.get("total", 0)) for i in invoices)
        paid     = [i for i in invoices if i.get("status") == "paid"]
        pending  = [i for i in invoices if i.get("status") == "pending"]
        canceled = [i for i in invoices if i.get("status") == "canceled"]

        total_paid    = sum(float(i.get("total", 0)) for i in paid)
        total_pending = sum(float(i.get("total", 0)) for i in pending)

        overdue = []
        cutoff  = datetime.now(timezone.utc) - timedelta(days=30)
        for i in pending:
            created = i.get("created_at")
            if created and (isinstance(created, datetime) and created < cutoff):
                overdue.append({"folio": i["folio"], "total": i["total"], "days_overdue": 30})

        alerts = []
        if overdue:
            alerts.append({"type": "high", "message": f"{len(overdue)} facturas vencidas — ${sum(o['total'] for o in overdue):,.0f} MXN por recuperar"})
        if total_pending > total_paid:
            alerts.append({"type": "warning", "message": "Cartera pendiente supera la cartera cobrada"})

        return {
            "action": action, "period": period,
            "summary": {
                "total_invoiced": round(total_invoiced, 2),
                "total_paid": round(total_paid, 2),
                "total_pending": round(total_pending, 2),
                "total_canceled": round(sum(float(i.get("total", 0)) for i in canceled), 2),
                "invoice_count": len(invoices),
                "collection_rate_pct": round((total_paid / total_invoiced) * 100, 1) if total_invoiced else 0,
            },
            "overdue": overdue[:10],
            "alerts": alerts,
            "source": "database",
        }

    def _mock_result(self, action: str, period: str) -> Dict:
        return {
            "action": action, "period": period,
            "summary": {
                "total_invoiced": 87420.00,
                "total_paid": 61200.00,
                "total_pending": 22800.00,
                "total_canceled": 3420.00,
                "invoice_count": 34,
                "collection_rate_pct": 70.0,
            },
            "overdue": [
                {"folio": "KINX-001", "total": 8400.00, "days_overdue": 45, "customer": "Constructora ABC"},
                {"folio": "KINX-002", "total": 5200.00, "days_overdue": 32, "customer": "Ferretería Norte"},
            ],
            "alerts": [
                {"type": "high", "message": "2 facturas vencidas — $13,600 MXN por recuperar"},
                {"type": "info",  "message": "Tasa de cobranza 70% — objetivo recomendado: 85%"},
            ],
            "source": "mock_data",
        }
