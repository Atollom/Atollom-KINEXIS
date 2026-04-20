"""
Agente #12: Ads Manager
Responsabilidad: Gestionar anuncios Meta (crear/pausar/reanudar/estadísticas)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"create", "pause", "resume", "get_stats"}
VALID_OBJECTIVES = {"conversions", "traffic", "awareness", "lead_generation", "engagement"}
VALID_PLATFORMS = {"facebook", "instagram"}

# Campaign counter — Fase 2: from Meta API
_CAMP_COUNTER = 41


def _next_campaign_id() -> str:
    global _CAMP_COUNTER
    _CAMP_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"CAMP-{year}-{_CAMP_COUNTER:03d}"


def _estimate_reach(budget_daily: float, platforms: list) -> str:
    platform_multiplier = len(platforms)
    base = int(budget_daily * 20 * platform_multiplier)
    hi = int(base * 1.5)
    if hi >= 1_000_000:
        return f"{base // 1_000_000}M-{hi // 1_000_000}M"
    elif hi >= 1_000:
        return f"{base // 1000}k-{hi // 1000}k"
    return f"{base}-{hi}"


class Agent12AdsManager:
    """
    Ads Manager — Gestión de campañas publicitarias en Meta (Facebook + Instagram).

    Acciones:
      create    → Crea nueva campaña con targeting y presupuesto
      pause     → Pausa campaña activa
      resume    → Reactiva campaña pausada
      get_stats → Obtiene métricas de campaña (impresiones, clics, CPC, ROAS)

    Input:
        {
            "action":    str  — create | pause | resume | get_stats
            "campaign":  dict — {name, objective, budget_daily, platforms, targeting}
                               (requerido para create)
            "ad_id":     str  — ID del anuncio (requerido para pause/resume/stats)
        }

    Output:
        {
            "action":          str
            "campaign_id":     str
            "ad_set_id":       str
            "ad_id":           str
            "status":          str — active | paused | deleted
            "budget_daily":    float
            "reach_estimated": str
        }
    """

    REQUIRED_FIELDS = ["action"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #12 - Ads Manager"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta acción de campaña Meta Ads."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} action={validated['action']}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        if data["action"] == "create":
            campaign = data.get("campaign")
            if not campaign or not isinstance(campaign, dict):
                raise ValueError("campaign dict is required for create action")

            name = campaign.get("name", "").strip()
            if not name:
                raise ValueError("campaign.name is required")

            objective = campaign.get("objective", "")
            if objective not in VALID_OBJECTIVES:
                raise ValueError(f"Invalid objective. Valid: {VALID_OBJECTIVES}")

            budget = float(campaign.get("budget_daily", 0))
            if budget <= 0:
                raise ValueError("campaign.budget_daily must be > 0")

            platforms = campaign.get("platforms", [])
            if not isinstance(platforms, list) or len(platforms) == 0:
                raise ValueError("campaign.platforms must be a non-empty list")
            invalid_platforms = set(platforms) - VALID_PLATFORMS
            if invalid_platforms:
                raise ValueError(f"Invalid platforms: {invalid_platforms}. Valid: {VALID_PLATFORMS}")

            targeting = campaign.get("targeting", {})
            if not isinstance(targeting, dict):
                raise ValueError("campaign.targeting must be a dict")
            age_min = targeting.get("age_min", 18)
            age_max = targeting.get("age_max", 65)
            if int(age_min) < 13 or int(age_max) > 65:
                raise ValueError("targeting ages must be 13-65")
            if int(age_min) > int(age_max):
                raise ValueError("targeting age_min must be <= age_max")

        if data["action"] in {"pause", "resume", "get_stats"}:
            if not data.get("ad_id"):
                raise ValueError(f"ad_id is required for {data['action']} action")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        from facebook_business.api import FacebookAdsApi
        FacebookAdsApi.init(app_id, app_secret, access_token)
        campaign = Campaign(parent_id=ad_account_id)
        campaign.update({Campaign.Field.name: ..., Campaign.Field.status: ...})
        """
        action = data["action"]

        if action == "create":
            campaign = data["campaign"]
            budget = float(campaign["budget_daily"])
            platforms = campaign["platforms"]
            camp_id = _next_campaign_id()
            adset_num = abs(hash(camp_id)) % 10000
            ad_num = abs(hash(camp_id + "ad")) % 10000
            return {
                "action": action,
                "campaign_id": camp_id,
                "campaign_name": campaign["name"],
                "objective": campaign["objective"],
                "ad_set_id": f"ADSET-{adset_num:04d}",
                "ad_id": f"AD-{ad_num:04d}",
                "status": "active",
                "budget_daily": budget,
                "platforms": platforms,
                "reach_estimated": _estimate_reach(budget, platforms),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "note": "Meta Business API integration pending — Fase 2",
            }

        elif action == "pause":
            return {
                "action": action,
                "ad_id": data["ad_id"],
                "status": "paused",
                "paused_at": datetime.now(timezone.utc).isoformat(),
                "note": "Meta Business API integration pending — Fase 2",
            }

        elif action == "resume":
            return {
                "action": action,
                "ad_id": data["ad_id"],
                "status": "active",
                "resumed_at": datetime.now(timezone.utc).isoformat(),
                "note": "Meta Business API integration pending — Fase 2",
            }

        else:  # get_stats
            return {
                "action": action,
                "ad_id": data["ad_id"],
                "stats": {
                    "impressions": 0,
                    "clicks": 0,
                    "ctr": 0.0,
                    "cpc": 0.0,
                    "spend": 0.0,
                    "conversions": 0,
                    "roas": 0.0,
                },
                "note": "Meta Insights API integration pending — Fase 2",
            }


ads_manager = Agent12AdsManager()
