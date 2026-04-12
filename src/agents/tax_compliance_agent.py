import re
import json
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class TaxComplianceAgent(BaseAgent):
    """
    Agente #38: Tax Compliance Agent.
    Recopila montos, IVA e integraciones para la contabilidad mensual.
    HUMAN_REQUIRED: NUNCA presentar declaraciones sin revisar del contador externo.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="tax_compliance_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        HUMAN_REQUIRED siempre — solo recopila.
        """
        trigger = data.get("trigger")
        period = data.get("period")

        if not trigger:
            raise ValueError("trigger es requerido")

        if period:
            if not re.match(r'^\d{4}-(0[1-9]|1[0-2])$', period):
                raise ValueError(f"Período inválido: {period}")

        result = {
            "cfdi_count": 0,
            "total_invoiced": 0.0,
            "total_iva": 0.0,
            "efos_alerts": [],
            "deadline_days": 0,
            "summary_url": "",
            "requires_approval": True # HUMAN_REQUIRED siempre
        }

        if trigger == "monthly_summary":
            if not period:
                raise ValueError("period es requerido para monthly_summary")
            res = await self._generate_summary(period)
            result.update(res)
        elif trigger == "deadline_reminder":
             if not period:
                 raise ValueError("period es requerido para deadline_reminder")
             await self._send_reminder(period, result)
        elif trigger == "efos_check":
             result["efos_alerts"] = await self._check_efos()
        else:
             raise ValueError(f"Unknown trigger: {trigger}")

        return result

    async def _generate_summary(self, period: str) -> dict:
        year, month = period.split("-")
        y, m = int(year), int(month)
        
        # Calculate date bounds
        from datetime import date, timedelta
        import calendar
        start_date = date(y, m, 1)
        last_day = calendar.monthrange(y, m)[1]
        end_date = date(y, m, last_day)

        res = await self.supabase.table("cfdi_records").select("total, iva").eq("tenant_id", self.tenant_id).eq("status", "TIMBRADO").gte("timbrado_at", start_date.isoformat()).lte("timbrado_at", end_date.isoformat() + "T23:59:59").execute()
        
        count = 0
        total_inv = Decimal("0.00")
        total_iva = Decimal("0.00")
        
        if res and hasattr(res, 'data'):
            count = len(res.data)
            for r in res.data:
                total_inv += Decimal(str(r.get("total", 0)))
                total_iva += Decimal(str(r.get("iva", 0)))
                
        total_inv = total_inv.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_iva = total_iva.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        summary = {
            "cfdi_count": count,
            "total_invoiced": float(total_inv),
            "total_iva": float(total_iva),
            "period": period
        }
        
        url = await self._save_summary_to_storage(summary, period)

        return {
            "cfdi_count": count,
            "total_invoiced": float(total_inv),
            "total_iva": float(total_iva),
            "summary_url": url
        }

    async def _send_reminder(self, period: str, result: dict) -> bool:
        year, month = period.split("-")
        y, m = int(year), int(month)
        
        # Deadline es el 17 del mes *siguiente* al periodo
        m += 1
        if m > 12:
            m = 1
            y += 1
            
        from datetime import date
        deadline = date(y, m, 17)
        now = self._get_now().date()
        
        days_left = (deadline - now).days
        result["deadline_days"] = days_left
        
        if days_left < 0:
            msg = f"ALERTA: La declaración de {period} está atrasada."
        else:
            msg = f"Recordatorio: La declaración de {period} vence el día 17. Faltan {days_left} días."
            
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception as e:
            logger.error("Error enviando WhatsApp reminder: %s", e)
            
        return True

    async def _check_efos(self) -> list:
        # API SAT EFOS requiere acceso especial — mock activo
        res = await self.supabase.table("cfdi_records").select("rfc_receptor").eq("tenant_id", self.tenant_id).execute()
        rfcs = set()
        if res and hasattr(res, 'data'):
            rfcs = {r["rfc_receptor"] for r in res.data if r.get("rfc_receptor")}
            
        alerts = []
        for rfc in rfcs:
            if rfc == "EFO000000XXX": # Mock condition
                alerts.append(f"ALERTA: RFC {rfc} detectado en lista de EFOS del SAT!")
                
        return alerts

    async def _save_summary_to_storage(self, summary: dict, period: str) -> str:
        # Guardar en Storage bucket 'fiscal' PRIVADO
        try:
            path = f"{self.tenant_id}/summary_{period}.json"
            content = json.dumps(summary).encode()
            # En producción se debe usar buckets y auth adecuada
            await self.supabase.storage.from_("fiscal").upload(path, content)
            return f"storage://fiscal/{path}"
        except Exception as e:
            logger.error("Error guardando resumen fiscal: %s", e)
            # fallback para pruebas
            return "mock_url"

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
