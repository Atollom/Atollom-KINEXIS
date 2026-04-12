import logging
from typing import Any
from src.agents.base_ads_manager import BaseAdsManager

class FacebookAdsAgent(BaseAdsManager):
    PLATFORM = 'facebook'
    MIN_ROAS_KEY = 'facebook_min_roas'
