"""Agent #12 — Meta Ads Manager (Facebook + Instagram campaigns)"""
import logging
import os
import aiohttp
from src.utils.database import db

logger = logging.getLogger(__name__)

_GRAPH = "https://graph.facebook.com/v18.0"


async def _get_token(tenant_id: str) -> tuple:
    creds = await db.fetch_one(
        "SELECT access_token, ad_account_id FROM meta_ads_credentials WHERE tenant_id=$1", tenant_id
    )
    if creds:
        return creds["access_token"], creds["ad_account_id"]
    return os.getenv("META_ACCESS_TOKEN", ""), os.getenv("META_AD_ACCOUNT_ID", "")


class AdsManagerAgent:
    name = "Ads Manager #12"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "get_stats")
        try:
            if action == "create":
                return await self._create_campaign(tenant_id, data)
            elif action == "pause":
                return await self._update_status(tenant_id, data, "PAUSED")
            elif action == "resume":
                return await self._update_status(tenant_id, data, "ACTIVE")
            elif action == "get_stats":
                return await self._get_stats(tenant_id, data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("AdsManager failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _create_campaign(self, tenant_id: str, data: dict) -> dict:
        token, ad_account = await _get_token(tenant_id)
        name = data.get("campaign_name", "KINEXIS Campaign")
        objective = data.get("objective", "CONVERSIONS").upper()
        budget = int(float(data.get("budget_daily", 200)) * 100)  # centavos
        platforms = data.get("platforms", ["facebook", "instagram"])

        if not token or not ad_account:
            row = await db.fetch_one(
                "INSERT INTO meta_campaigns (tenant_id, name, objective, budget_daily, platforms, status, created_at) VALUES ($1,$2,$3,$4,$5::jsonb,'draft',NOW()) RETURNING id",
                tenant_id, name, objective, float(data.get("budget_daily", 200)),
                __import__("json").dumps(platforms),
            )
            return {"success": True, "data": {"campaign_id": str(row["id"]) if row else None, "status": "draft", "mode": "no_credentials"}}

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_GRAPH}/act_{ad_account}/campaigns",
                params={"access_token": token},
                json={
                    "name": name,
                    "objective": objective,
                    "status": "PAUSED",
                    "special_ad_categories": [],
                },
            ) as resp:
                body = await resp.json()
                campaign_id = body.get("id")
                ok = resp.status in (200, 201) and bool(campaign_id)

        if ok:
            await db.execute(
                "INSERT INTO meta_campaigns (tenant_id, meta_campaign_id, name, objective, budget_daily, platforms, status, created_at) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'active',NOW())",
                tenant_id, campaign_id, name, objective, float(data.get("budget_daily", 200)),
                __import__("json").dumps(platforms),
            )
        return {"success": ok, "data": {"campaign_id": campaign_id, "status": "created_paused"}}

    async def _update_status(self, tenant_id: str, data: dict, status: str) -> dict:
        campaign_id = data.get("campaign_id")
        if not campaign_id:
            return {"success": False, "error": "campaign_id required", "data": {}}
        token, _ = await _get_token(tenant_id)
        if not token:
            return {"success": False, "error": "Meta credentials not configured", "data": {}}
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_GRAPH}/{campaign_id}",
                params={"access_token": token},
                json={"status": status},
            ) as resp:
                ok = resp.status == 200
        await db.execute(
            "UPDATE meta_campaigns SET status=$1 WHERE meta_campaign_id=$2 AND tenant_id=$3",
            status.lower(), campaign_id, tenant_id,
        )
        return {"success": ok, "data": {"campaign_id": campaign_id, "status": status.lower()}}

    async def _get_stats(self, tenant_id: str, data: dict) -> dict:
        rows = await db.fetch_all(
            "SELECT meta_campaign_id, name, objective, budget_daily, status, created_at FROM meta_campaigns WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 10",
            tenant_id,
        )
        return {"success": True, "data": {"campaigns": rows, "count": len(rows)}}


ads_manager = AdsManagerAgent()
