"""
Sandbox Router — exposes sandbox simulation endpoints.
All routes require authentication; reset requires owner role.
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.auth.jwt_validator import get_current_user
from src.sandbox import sandbox
from src.sandbox.simulators import (
    AmazonSimulator,
    MetaSimulator,
    MLSimulator,
    ShopifySimulator,
)

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])


class WebhookPayload(BaseModel):
    event_type: str
    payload: Dict[str, Any] = {}


# ── Status ────────────────────────────────────────────────────────────────────

@router.get("/status")
async def get_sandbox_status(user=Depends(get_current_user)):
    return {
        "mode": sandbox.mode,
        "integrations": sandbox.integrations,
        "sync_log_count": len(sandbox.get_sync_log(limit=1000)),
        "sandbox": True,
    }


@router.get("/status/{integration}")
async def get_integration_status(integration: str, user=Depends(get_current_user)):
    status = sandbox.get_integration_status(integration)
    if status.get("status") == "not_connected":
        raise HTTPException(status_code=404, detail=f"Integration '{integration}' not found")
    return {"integration": integration, **status}


@router.get("/log")
async def get_sync_log(limit: int = 50, user=Depends(get_current_user)):
    return {"entries": sandbox.get_sync_log(limit=limit), "sandbox": True}


# ── Sync ──────────────────────────────────────────────────────────────────────

@router.post("/sync/{integration}")
async def sync_integration(integration: str, user=Depends(get_current_user)):
    result = await sandbox.sync_integration(
        integration=integration,
        tenant_id=user["tenant_id"],
    )
    if not result.get("success"):
        raise HTTPException(status_code=429 if "Rate limit" in result.get("error", "") else 400, detail=result.get("error"))
    return result


# ── Webhook simulation ────────────────────────────────────────────────────────

@router.post("/webhook/{integration}")
async def simulate_webhook(
    integration: str,
    body: WebhookPayload,
    user=Depends(get_current_user),
):
    result = await sandbox.simulate_webhook(
        integration=integration,
        event_type=body.event_type,
        payload=body.payload,
    )
    return result


# ── Simulator data ────────────────────────────────────────────────────────────

@router.get("/data/ml/products")
async def ml_products(limit: int = 20, user=Depends(get_current_user)):
    return MLSimulator.get_products(user_id=user["tenant_id"], limit=limit)


@router.get("/data/ml/orders")
async def ml_orders(limit: int = 20, user=Depends(get_current_user)):
    return MLSimulator.get_orders(seller_id=user["tenant_id"], limit=limit)


@router.get("/data/ml/metrics")
async def ml_metrics(user=Depends(get_current_user)):
    return MLSimulator.get_metrics(seller_id=user["tenant_id"])


@router.get("/data/amazon/listings")
async def amazon_listings(limit: int = 20, user=Depends(get_current_user)):
    return AmazonSimulator.get_listings(seller_id=user["tenant_id"], limit=limit)


@router.get("/data/amazon/orders")
async def amazon_orders(limit: int = 20, user=Depends(get_current_user)):
    return AmazonSimulator.get_orders(seller_id=user["tenant_id"], limit=limit)


@router.get("/data/amazon/fba")
async def amazon_fba(user=Depends(get_current_user)):
    return AmazonSimulator.get_fba_inventory(seller_id=user["tenant_id"])


@router.get("/data/shopify/products")
async def shopify_products(limit: int = 20, user=Depends(get_current_user)):
    return ShopifySimulator.get_products(limit=limit)


@router.get("/data/shopify/orders")
async def shopify_orders(limit: int = 20, user=Depends(get_current_user)):
    return ShopifySimulator.get_orders(limit=limit)


@router.get("/data/shopify/analytics")
async def shopify_analytics(period_days: int = 30, user=Depends(get_current_user)):
    return ShopifySimulator.get_analytics(period_days=period_days)


@router.get("/data/meta/wa-templates")
async def meta_wa_templates(user=Depends(get_current_user)):
    return MetaSimulator.get_wa_templates(waba_id=user["tenant_id"])


@router.get("/data/meta/ig-insights")
async def meta_ig_insights(user=Depends(get_current_user)):
    return MetaSimulator.get_ig_insights(ig_user_id=user["tenant_id"])


@router.get("/data/meta/ad-insights")
async def meta_ad_insights(user=Depends(get_current_user)):
    return MetaSimulator.get_ad_insights(ad_account_id=user["tenant_id"])


# ── Reset (owner only) ────────────────────────────────────────────────────────

@router.post("/reset")
async def reset_sandbox(user=Depends(get_current_user)):
    if user.get("role") not in ("owner", "admin"):
        raise HTTPException(status_code=403, detail="Only owner or admin can reset sandbox")
    sandbox.reset()
    return {"success": True, "message": "Sandbox reset — all counters cleared", "sandbox": True}
