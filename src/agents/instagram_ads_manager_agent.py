import logging
from typing import Any
from src.agents.base_ads_manager import BaseAdsManager

class InstagramAdsManagerAgent(BaseAdsManager):
    PLATFORM = 'instagram'
    MIN_ROAS_KEY = 'instagram_min_roas'
