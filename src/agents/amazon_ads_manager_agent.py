import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from src.agents.base_ads_manager import BaseAdsManager
from src.adapters.amazon_adapter import AmazonAdapter

class AmazonAdsManagerAgent(BaseAdsManager):
    PLATFORM = 'amazon'
    MIN_ROAS_KEY = 'amazon_min_roas'
    ACOS_MAX_KEY = 'amazon_max_acos'

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(tenant_id, supabase_client)
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)

    async def _pause_low_roas(self, min_roas: Decimal) -> list:
        """Amazon usa ACoS además de ROAS."""
        rules = await self._query_tenant_rules()
        max_acos = Decimal(str(rules.get(self.ACOS_MAX_KEY, 25.0)))
        
        # Leer campañas activas
        res = await self.supabase.table("ads_campaigns")\
            .select("campaign_id, campaign_name, roas, spend, revenue")\
            .eq("tenant_id", self.tenant_id)\
            .eq("platform", self.PLATFORM)\
            .eq("status", "active")\
            .execute()
            
        if not res or not hasattr(res, 'data') or not res.data:
            return []
            
        to_pause = []
        for c in res.data:
            spend = Decimal(str(c.get("spend", 0)))
            rev = Decimal(str(c.get("revenue", 0)))
            
            # Calcular ACoS
            if rev == 0:
                acos = Decimal("999.99")
            else:
                acos = (spend / rev) * Decimal("100.00")
            acos = acos.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
            # Calcular ROAS
            c_roas = Decimal(str(c.get("roas", 0)))
            
            # Pausar si ROAS bajo O ACoS alto
            if c_roas < min_roas or acos > max_acos:
                to_pause.append({**c, "acos_applied": float(acos)})
                await self._pause_campaign_remote(c["campaign_id"])
                
        return to_pause
