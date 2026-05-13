"""
Stripe Router — billing endpoints: checkout, portal, webhooks, subscription queries.
"""

import json
import logging
import os
from typing import Optional

import psycopg2
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor

from src.auth.jwt_validator import get_current_user
from src.config.stripe_config import STRIPE_PRICES
from src.services.stripe_service import stripe_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])


# ── Request models ────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan_type: str  # starter | growth | pro | tokens_100 | timbres_50


# ── Checkout & Portal ─────────────────────────────────────────────────────────

@router.post("/checkout")
async def create_checkout(
    body: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a Stripe Checkout Session and return redirect URL."""
    plan = body.plan_type
    if plan not in STRIPE_PRICES:
        raise HTTPException(400, f"Invalid plan: {plan}")

    price_id = STRIPE_PRICES[plan]
    tenant_id = current_user["tenant_id"]
    email = current_user.get("email") or ""

    frontend_url = os.getenv("FRONTEND_URL", "https://kinexis.atollom.com")
    success_url = f"{frontend_url}/settings/billing?success=1&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url  = f"{frontend_url}/settings/billing"

    try:
        result = stripe_service.create_checkout_session(
            price_id=price_id,
            customer_email=email,
            tenant_id=tenant_id,
            success_url=success_url,
            cancel_url=cancel_url,
            plan_type=plan,
        )
        return result
    except Exception as exc:
        logger.error("Checkout error: %s", exc)
        raise HTTPException(500, "Failed to create checkout session")


@router.post("/portal")
async def create_portal(current_user: dict = Depends(get_current_user)):
    """Create a Stripe Billing Portal session and return redirect URL."""
    tenant_id = current_user["tenant_id"]
    sub = _get_subscription(tenant_id)
    customer_id: Optional[str] = sub.get("stripe_customer_id")

    if not customer_id:
        raise HTTPException(404, "No active Stripe subscription found for this tenant")

    frontend_url = os.getenv("FRONTEND_URL", "https://kinexis.atollom.com")
    return_url = f"{frontend_url}/settings/billing"

    try:
        url = stripe_service.create_portal_session(customer_id=customer_id, return_url=return_url)
        return {"url": url}
    except Exception as exc:
        logger.error("Portal error: %s", exc)
        raise HTTPException(500, "Failed to create portal session")

_PLAN_MAP = {
    "growth": "growth",
    "pro": "pro",
    "enterprise": "pro",
    "starter": "starter",
}


def _update_tenant_plan(tenant_id: str, plan: str, stripe_customer_id: str) -> None:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return
    conn = psycopg2.connect(db_url)
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE tenants SET plan = %s, stripe_customer_id = %s WHERE id = %s",
            (plan, stripe_customer_id, tenant_id),
        )
        conn.commit()
    finally:
        conn.close()


def _get_subscription(tenant_id: str) -> dict:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return {"plan": "starter", "stripe_customer_id": None}
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT plan, stripe_customer_id FROM tenants WHERE id = %s",
            (tenant_id,),
        )
        row = cur.fetchone()
        return dict(row) if row else {"plan": "starter", "stripe_customer_id": None}
    finally:
        conn.close()


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    if webhook_secret:
        try:
            import stripe as stripe_lib
            stripe_lib.Webhook.construct_event(payload, sig_header, webhook_secret)
        except Exception as exc:
            logger.warning("Stripe webhook signature verification failed: %s", exc)
            raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        event: dict = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type: str = event.get("type", "")
    data_object: dict = event.get("data", {}).get("object", {})

    if event_type in ("checkout.session.completed", "customer.subscription.updated"):
        tenant_id = (
            data_object.get("metadata", {}).get("tenant_id")
            or data_object.get("subscription_details", {}).get("metadata", {}).get("tenant_id")
        )
        plan_type = data_object.get("metadata", {}).get("plan_type", "starter")
        customer_id = data_object.get("customer")

        if tenant_id and customer_id:
            mapped_plan = _PLAN_MAP.get(plan_type, "starter")
            try:
                _update_tenant_plan(tenant_id, mapped_plan, customer_id)
                logger.info("Updated tenant %s to plan %s", tenant_id, mapped_plan)
            except Exception as exc:
                logger.error("Failed to update tenant plan: %s", exc)

    elif event_type == "customer.subscription.deleted":
        customer_id = data_object.get("customer")
        if customer_id:
            db_url = os.getenv("DATABASE_URL")
            if db_url:
                try:
                    conn = psycopg2.connect(db_url)
                    cur = conn.cursor()
                    cur.execute(
                        "UPDATE tenants SET plan = 'starter' WHERE stripe_customer_id = %s",
                        (customer_id,),
                    )
                    conn.commit()
                    conn.close()
                    logger.info("Downgraded tenant (customer=%s) to starter", customer_id)
                except Exception as exc:
                    logger.error("Failed to downgrade tenant: %s", exc)

    return Response(content=json.dumps({"status": "ok"}), media_type="application/json")


@router.get("/subscription/{tenant_id}")
async def get_subscription(tenant_id: str):
    return _get_subscription(tenant_id)
