import logging
from typing import Any, Dict, List
from decimal import Decimal
from datetime import timedelta

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class LeadsPipelineAgent(BaseAgent):
    """
    Agente #30: Leads Pipeline Agent.
    Análisis diario del pipeline de ventas.
    Detecta leads fríos (>72h) y estancados (>7 días).
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="leads_pipeline_agent_v1", supabase_client=supabase_client
        )

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Leer todos los leads activos del tenant
        2. Calcular métricas del pipeline
        3. Detectar leads fríos (>72h sin actividad)
        4. Detectar leads estancados (>7 días)
        5. Calcular conversion_rate
        """
        leads = await self._get_active_leads()
        
        cold_leads = await self._detect_cold_leads(leads)
        stale_leads = await self._detect_stale_leads(leads)
        conversion_rate = await self._calculate_conversion_rate()
        
        alerts = []
        if cold_leads:
            alerts.append(f"Detectados {len(cold_leads)} leads fríos (>72h).")
            # Notificar Sales Agent (simulado)
        
        if stale_leads:
            alerts.append(f"Detectados {len(stale_leads)} leads estancados (>7 días).")
        
        if conversion_rate < Decimal("25.0"):
            alerts.append(f"Alerta: Tasa de conversión baja ({conversion_rate}%). Objetivo: >25%")

        pipeline_health = {
            "total_active": len(leads),
            "cold_count": len(cold_leads),
            "stale_count": len(stale_leads),
            "conversion_rate": float(conversion_rate)
        }

        # Guardar en pipeline_snapshots
        await self._save_snapshot(len(leads), len(cold_leads), len(stale_leads), conversion_rate, pipeline_health)

        return {
            "leads_analyzed": len(leads),
            "cold_leads_count": len(cold_leads),
            "alerts": alerts,
            "pipeline_health": pipeline_health
        }

    async def _get_active_leads(self) -> List[Dict]:
        res = await self.supabase.table("leads").select("*")\
            .eq("tenant_id", self.tenant_id)\
            .not_.in_("status", ["won", "lost", "cancelled"])\
            .execute()
        return res.data if res and hasattr(res, 'data') else []

    async def _detect_cold_leads(self, leads: List[Dict]) -> List[Dict]:
        cutoff = self._get_now() - timedelta(hours=72)
        cold = [l for l in leads if self._parse_iso(l.get("last_activity_at")) < cutoff]
        return cold

    async def _detect_stale_leads(self, leads: List[Dict]) -> List[Dict]:
        # Estancados: > 7 días en el mismo stage (o sin actividad)
        cutoff = self._get_now() - timedelta(days=7)
        stale = [l for l in leads if self._parse_iso(l.get("last_activity_at")) < cutoff]
        return stale

    async def _calculate_conversion_rate(self) -> Decimal:
        # Período: últimos 30 días
        cutoff = (self._get_now() - timedelta(days=30)).date().isoformat()
        res = await self.supabase.table("leads").select("status")\
            .eq("tenant_id", self.tenant_id)\
            .gte("created_at", cutoff)\
            .execute()
        
        all_leads = res.data if res and hasattr(res, 'data') else []
        if not all_leads: return Decimal("0.00")
        
        won_leads = [l for l in all_leads if l.get("status") == "won"]
        rate = (Decimal(len(won_leads)) / Decimal(len(all_leads))) * Decimal("100.00")
        return rate.quantize(Decimal("0.01"))

    async def _save_snapshot(self, total, cold, stale, rate, health):
        await self.supabase.table("pipeline_snapshots").insert({
            "tenant_id": self.tenant_id,
            "leads_analyzed": total,
            "cold_leads": cold,
            "stale_leads": stale,
            "conversion_rate": float(rate),
            "pipeline_health": health
        }).execute()

    def _parse_iso(self, date_str: str):
        if not date_str: return self._get_now() - timedelta(days=365)
        from datetime import datetime
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError as e:
            logger.error("Error parsing date '%s': %s", date_str, e)
            return self._get_now() - timedelta(days=365)

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
