import logging
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from typing import Any, Dict, List

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class FinanceCashflowAgent(BaseAgent):
    """
    Agente #37: Finance Cashflow Agent.
    Genera reportes de flujo de caja, proyecta liquidez a 30 días y dispara alertas financieras críticas.
    
    cash_balance = revenue_del_período - costs_del_período 
    (simplificado — en producción vendría de un sistema contable externo).
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="finance_cashflow_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = data.get("user_id")
        trigger = data.get("trigger")

        if not trigger:
            raise ValueError("trigger requerido")

        # Security check: Check role if requested manually via user
        if user_id:
            role = await self._query_user_role(user_id)
            if role not in ["owner", "admin"]:
                raise PermissionError("Acceso denegado: Se requiere rol owner o admin para ver datos financieros.")

        now_date = self._get_now().date()
        p_start_str = data.get("period_start")
        p_end_str = data.get("period_end")

        from datetime import datetime
        period_end = datetime.strptime(p_end_str, "%Y-%m-%d").date() if p_end_str else now_date
        period_start = datetime.strptime(p_start_str, "%Y-%m-%d").date() if p_start_str else (period_end - timedelta(days=7))

        if period_start > period_end:
            raise ValueError("period_start no puede ser mayor que period_end")
        if period_start > now_date or period_end > now_date:
            raise ValueError("Fechas futuras no permitidas")

        # Calculations (all returning Decimal strictly)
        revenue = await self._calculate_revenue(period_start, period_end)
        costs = await self._calculate_costs(period_start, period_end)
        
        gross_margin = revenue - costs
        cash_balance = revenue - costs # Simplified per user spec
        
        rev_7d = await self._calculate_revenue(now_date - timedelta(days=7), now_date)
        daily_revenue = rev_7d / Decimal("7.0")
        projection_30d = await self._project_30_days(daily_revenue)
        
        alerts = await self._check_liquidity_alert(cash_balance)

        # Output logic
        await self._insert_snapshot({
            "tenant_id": self.tenant_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "revenue": float(revenue),
            "costs": float(costs),
            "gross_margin": float(gross_margin),
            "cash_balance": float(cash_balance),
            "projection_30d": float(projection_30d),
            "alerts": alerts,
            "created_at": self._get_now().isoformat()
        })

        if alerts:
            # Notificar
            for a in alerts:
                logger.warning("ALERTA LIQUIDEZ tenant=%s: %s", self.tenant_id, a)
                await self._notify_socias(f"⚠️ {a}")
        elif trigger == "weekly_report":
            msg = f"Reporte Financiero {period_start} a {period_end}: Revenu = ${revenue}, Costs = ${costs}"
            await self._notify_socias(msg)

        return {
            "revenue": float(revenue),
            "costs": float(costs),
            "gross_margin": float(gross_margin),
            "cash_balance": float(cash_balance),
            "projection_30_days": float(projection_30d),
            "alerts": alerts,
            "report_url": "mock_report_url"
        }

    async def _calculate_revenue(self, start, end) -> Decimal:
        res = await self.supabase.table("orders").select("total_mxn").eq("tenant_id", self.tenant_id).neq("status", "cancelled").neq("status", "returned").gte("created_at", start.isoformat()).lte("created_at", end.isoformat() + "T23:59:59").execute()
        total = Decimal("0.00")
        if res and hasattr(res, 'data'):
            for d in res.data:
                # Ensuring Decimal strictly from DB string/float
                total += Decimal(str(d.get("total_mxn", 0)))
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def _calculate_costs(self, start, end) -> Decimal:
        res = await self.supabase.table("inventory_movements").select("qty", "unit_cost").eq("tenant_id", self.tenant_id).eq("movement_type", "sale").gte("created_at", start.isoformat()).lte("created_at", end.isoformat() + "T23:59:59").execute()
        total = Decimal("0.00")
        if res and hasattr(res, 'data'):
            for d in res.data:
                q = Decimal(str(d.get("qty", 0)))
                c = Decimal(str(d.get("unit_cost", 0)))
                total += q * c
        return total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def _project_30_days(self, daily_revenue: Decimal) -> Decimal:
        proj = daily_revenue * Decimal("30.0")
        return proj.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def _check_liquidity_alert(self, balance: Decimal) -> List[str]:
        rules = await self._query_tenant_business_rules()
        threshold = Decimal(str(rules.get("liquidity_threshold", 50000.00)))
        
        alerts = []
        if balance < threshold:
            alerts.append(f"ALERTA CRÍTICA: Cash balance (${balance}) está por debajo del mínimo de ${threshold}.")
        return alerts

    async def _notify_socias(self, msg: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception:
            pass

    async def _insert_snapshot(self, data: dict):
        await self.supabase.table("finance_snapshots").insert(data).execute()

    async def _query_user_role(self, user_id: str) -> str:
        res = await self.supabase.table("tenant_users").select("role").eq("user_id", user_id).eq("tenant_id", self.tenant_id).single().execute()
        return res.data.get("role", "user") if res and hasattr(res, 'data') and res.data else "user"

    async def _query_tenant_business_rules(self) -> dict:
        try:
            res = await self.supabase.table("tenant_business_rules").select("*").eq("tenant_id", self.tenant_id).single().execute()
            if res and hasattr(res, 'data') and res.data:
                return res.data
        except Exception:
            pass
        return {}

    # Stubs
    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
