"""
Stripe Webhook Router — processes subscription events and updates tenant plan.
"""

import hashlib
import hmac
import json
import logging
import os

import psycopg2
from fastapi import APIRouter, HTTPException, Request, Response
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

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
            event = stripe_lib.Webhook.construct_event(payload, sig_header, webhook_secret)
        except Exception as exc:
            logger.warning("Stripe webhook signature verification failed: %s", exc)
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        try:
            event = json.loads(payload)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("type", "")
    data_object = event.get("data", {}).get("object", {})

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
