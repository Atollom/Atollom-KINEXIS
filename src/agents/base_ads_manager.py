import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List
from src.agents.base_agent import BaseAgent
from src.adapters.meta_adapter import MetaAdapter

logger = logging.getLogger(__name__)

class BaseAdsManager(BaseAgent):
    """
    Base compartida para todos los Ads Managers.
    PLATFORM y MIN_ROAS_KEY son atributos de clase.
    """
    PLATFORM: str = ""
    MIN_ROAS_KEY: str = ""

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id=f"{self.PLATFORM}_ads_manager_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        optimize_bids, pause_low_roas, daily_report
        """
        action = data.get("action", "optimize")
        
        if action == "optimize_bids":
            return await self._optimize_bids()
        elif action == "pause_low_roas":
            return await self._handle_pause_low_roas()
        elif action == "daily_report":
            return await self._daily_report()
        else:
            return await self._optimize_bids()

    async def _handle_pause_low_roas(self) -> dict:
        rules = await self._query_tenant_rules()
        min_roas = Decimal(str(rules.get(self.MIN_ROAS_KEY, 2.0)))
        
        paused_campaigns = await self._pause_low_roas(min_roas)
        if paused_campaigns:
            await self._notify_socias_roas(paused_campaigns)
            
        return {
            "paused_count": len(paused_campaigns),
            "paused_campaigns": paused_campaigns,
            "min_roas_applied": float(min_roas)
        }

    async def _optimize_bids(self) -> dict:
        # Mock logic
        return {"status": "optimized", "platform": self.PLATFORM}

    async def _daily_report(self) -> dict:
        res = await self.supabase.table("ads_campaigns")\
            .select("*")\
            .eq("tenant_id", self.tenant_id)\
            .eq("platform", self.PLATFORM)\
            .execute()
        return {"report_items": len(res.data) if res and hasattr(res, 'data') else 0}

    async def _check_roas(self, campaign_id: str) -> Decimal:
        # En producción consultaría a la API de la plataforma o la BD actualizada
        res = await self.supabase.table("ads_campaigns")\
            .select("spend, revenue")\
            .eq("tenant_id", self.tenant_id)\
            .eq("campaign_id", campaign_id)\
            .single()\
            .execute()
            
        if not res or not hasattr(res, 'data') or not res.data:
            return Decimal("0")
            
        spend = Decimal(str(res.data.get("spend", 0)))
        rev = Decimal(str(res.data.get("revenue", 0)))
        
        if spend == 0:
            return Decimal("0")
            
        return (rev / spend).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    async def _pause_low_roas(self, min_roas: Decimal) -> list:
        # Leer campañas activas
        res = await self.supabase.table("ads_campaigns")\
            .select("campaign_id, campaign_name, roas")\
            .eq("tenant_id", self.tenant_id)\
            .eq("platform", self.PLATFORM)\
            .eq("status", "active")\
            .execute()
            
        if not res or not hasattr(res, 'data') or not res.data:
            return []
            
        to_pause = []
        for c in res.data:
            c_roas = Decimal(str(c.get("roas", 0)))
            if c_roas < min_roas:
                to_pause.append(c)
                await self._pause_campaign_remote(c["campaign_id"])
                
        return to_pause

    async def _pause_campaign_remote(self, campaign_id: str):
        # Update db
        await self.supabase.table("ads_campaigns")\
            .update({"status": "paused"})\
            .eq("tenant_id", self.tenant_id)\
            .eq("campaign_id", campaign_id)\
            .execute()

    async def _query_tenant_rules(self) -> dict:
        try:
            res = await self.supabase.table("tenant_business_rules").select("*").eq("tenant_id", self.tenant_id).single().execute()
            return res.data if res and hasattr(res, 'data') and res.data else {}
        except Exception as e:
            logger.error("Error cargando tenant_rules ads tenant=%s: %s", self.tenant_id, e)
            return {}

    async def _notify_socias_roas(self, campaigns: list):
        names = [c["campaign_name"] for c in campaigns]
        msg = f"Ads Alert ({self.PLATFORM}): Pausadas campañas por bajo ROAS: {', '.join(names)}"
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
            pass
        except Exception as e:
            logger.error("Error notificando socias ROAS %s: %s", self.PLATFORM, e)

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
