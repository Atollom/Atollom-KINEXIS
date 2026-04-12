import logging
from typing import Any
from src.agents.base_ads_manager import BaseAdsManager
from src.adapters.ml_adapter import MLAdapter

class MLAdsManagerAgent(BaseAdsManager):
    PLATFORM = 'mercadolibre'
    MIN_ROAS_KEY = 'ml_min_roas'

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(tenant_id, supabase_client)
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
