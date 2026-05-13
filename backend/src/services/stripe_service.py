"""
Stripe Service — checkout sessions, customer portal, subscription management.
Uses the Stripe Python SDK (stripe>=5).
"""
import logging
import os
from typing import Any, Dict, Optional

import stripe

from src.config.stripe_config import STRIPE_PRICES

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


class StripeService:
    """Thin wrapper around Stripe SDK for KINEXIS billing flows."""

    # ── Checkout ──────────────────────────────────────────────────────────────

    def create_checkout_session(
        self,
        price_id: str,
        customer_email: str,
        tenant_id: str,
        success_url: str,
        cancel_url: str,
        plan_type: str = "",
    ) -> Dict[str, Any]:
        """
        Create a Stripe Checkout Session for a subscription.

        Returns:
            {"session_id": str, "url": str}
        """
        try:
            session = stripe.checkout.Session.create(
                mode="subscription",
                payment_method_types=["card"],
                line_items=[{"price": price_id, "quantity": 1}],
                customer_email=customer_email,
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                billing_address_collection="required",
                metadata={"tenant_id": tenant_id, "plan_type": plan_type},
            )
            logger.info("Checkout session created: %s for tenant %s", session.id, tenant_id)
            return {"session_id": session.id, "url": session.url}
        except stripe.StripeError as exc:
            logger.error("create_checkout_session failed: %s", exc)
            raise

    # ── Customer Portal ───────────────────────────────────────────────────────

    def create_portal_session(self, customer_id: str, return_url: str) -> str:
        """Return a Stripe Billing Portal URL for the given customer."""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session.url
        except stripe.StripeError as exc:
            logger.error("create_portal_session failed: %s", exc)
            raise

    # ── Subscription ──────────────────────────────────────────────────────────

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        sub = stripe.Subscription.retrieve(subscription_id)
        return {
            "id": sub.id,
            "status": sub.status,
            "current_period_start": sub.current_period_start,
            "current_period_end": sub.current_period_end,
            "cancel_at_period_end": sub.cancel_at_period_end,
            "price_id": sub.items.data[0].price.id if sub.items.data else None,
        }

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        if at_period_end:
            sub = stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
        else:
            sub = stripe.Subscription.cancel(subscription_id)
        return {"id": sub.id, "status": sub.status, "cancel_at_period_end": sub.cancel_at_period_end}


stripe_service = StripeService()
