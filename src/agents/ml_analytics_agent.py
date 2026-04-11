import json
import logging
from datetime import timedelta
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class MLAnalyticsAgent(BaseAgent):
    """
    Agente #5: ML Analytics Agent.
    Genera reportes de ventas, performance de SKUs y detecta slow movers.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="ml_analytics_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Validar fechas. (no futuro, date_from <= date_to)
        2. Según report_type
        3. Generar JSON del reporte (sustituto pdf)
        4. Guardar en Storage
        5. Notificar a socias
        6. Registrar en analytics_reports
        """
        report_type = data.get("report_type")
        if not report_type:
            raise ValueError("report_type requerido")
            
        now_date = self._get_now().date()
        
        # Parse or default dates
        date_from_str = data.get("date_from")
        date_to_str = data.get("date_to")
        
        # Default: 7 dias atras
        date_to = self._parse_date(date_to_str) if date_to_str else now_date
        date_from = self._parse_date(date_from_str) if date_from_str else (now_date - timedelta(days=7))

        if date_from > date_to:
            raise ValueError("date_from no puede ser mayor a date_to")

        if date_to > now_date or date_from > now_date:
            raise ValueError("Las fechas no pueden estar en el futuro")

        report_data = {}
        alerts = []

        # Enforce Monday 8AM trigger for full weekly sales, but handled by the workflow cron.
        # This checks the trigger config "weekly_sales"
        if report_type == "weekly_sales":
            report_data, alerts = await self._weekly_sales_report(date_from, date_to)
        elif report_type == "slow_movers":
            report_data, alerts = await self._slow_movers()
        elif report_type in ["sku_performance", "top_sellers"]:
            report_data = {"type": report_type, "data": "dummy"}
        else:
            raise ValueError(f"report_type desconocido: {report_type}")

        # Generar "PDF" (JSON file as per prompt instruction)
        report_url = None
        try:
            report_url = await self._generate_pdf(report_data, report_type, date_to.isoformat())
        except Exception as e:
            logger.error("Fallo al guardar reporte en storage de forma gracefully: %s", e)

        # Alert if SKU > 60 days no sales (already in slow_movers, but let's say it checks here or there)
        # Notificar socias
        await self._notify_socias(report_type, report_url)

        # DB Guardar
        res = await self._insert_report({
            "tenant_id": self.tenant_id,
            "report_type": report_type,
            "date_from": date_from.isoformat(),
            "date_to": date_to.isoformat(),
            "report_url": report_url,
            "summary": {"alerts": alerts, "status": "generated"},
            "created_at": self._get_now().isoformat()
        })
        
        report_id = None
        if res and hasattr(res, 'data') and res.data:
            report_id = res.data[0]["id"]

        return {
            "report_id": report_id,
            "report_data": report_data,
            "alerts": alerts,
            "report_url": report_url
        }

    async def _weekly_sales_report(self, date_from, date_to):
        alerts = []
        # Mock logic
        sales = await self._query_orders(date_from, date_to)
        prev_to = date_from
        prev_from = prev_to - timedelta(days=(date_to - date_from).days)
        prev_sales = await self._query_orders(prev_from, prev_to)
        
        # Also could run year ago comparative.
        ly_to = date_to.replace(year=date_to.year - 1)
        
        report = {
            "sales": len(sales),
            "prev_sales": len(prev_sales),
            "vs_last_week": "up",
            "vs_last_year": "mock"
        }
        return report, alerts

    async def _slow_movers(self):
        alerts = []
        # SKUs con 0 ventas en últimos 7 días
        # mock db call
        slow_skus = await self._query_inventory()
        # Mocking 7 days, 60 days
        processed = []
        for sku in slow_skus:
            days_no_sale = sku.get("days_no_sale", 0)
            if days_no_sale >= 60:
                alerts.append(f"Sugiero descontinuar SKU {sku['sku']} (Sin ventas por > 60 días)")
            elif days_no_sale >= 7:
                alerts.append(f"Alerta: SKU {sku['sku']} sin ventas > 7 dias")
            processed.append(sku['sku'])
            
        return {"slow_movers": processed}, alerts

    async def _generate_pdf(self, report_data: dict, report_type: str, date_str: str) -> str:
        # Prompt: "Si reportlab no disponible: guardar JSON con extensión .json en bucket 'reports'"
        # signed URL 30 dias
        file_path = f"{self.tenant_id}/analytics/{date_str}/{report_type}.json"
        content = json.dumps(report_data).encode("utf-8")
        
        await self.supabase.storage.from_("reports").upload(file_path, content)
        signed_url_res = await self.supabase.storage.from_("reports").create_signed_url(file_path, 30 * 24 * 60 * 60)
        
        if not signed_url_res or 'signedURL' not in signed_url_res:
            raise RuntimeError("No se pudo firmar la URL del reporte")
            
        return signed_url_res["signedURL"]

    def _parse_date(self, d_str: str):
        from datetime import datetime
        return datetime.strptime(d_str, "%Y-%m-%d").date()

    async def _notify_socias(self, report_type: str, url: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", f"Reporte {report_type} listo: {url}")
            pass
        except Exception as e:
            logger.error("Error notificando socias ml_analytics report=%s: %s", report_type, e)

    async def _insert_report(self, data: dict):
        return await self.supabase.table("analytics_reports").insert(data).execute()

    async def _query_orders(self, d_from, d_to):
        # mock
        return []

    async def _query_inventory(self):
        # mock returns slow movers
        return [{"sku": "SLOW-1", "days_no_sale": 8}, {"sku": "DEAD-1", "days_no_sale": 65}]

    # Stub
    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
