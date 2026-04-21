"""
Stripe Integration
Sandbox: Test Mode (sk_test_...)
Production: Live Mode (sk_live_...)
Docs: https://docs.stripe.com/api
"""

import logging
import os
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class StripeIntegration(BaseIntegration):
    """
    Cliente Stripe API.

    Endpoints principales:
      GET  /v1/balance
      POST /v1/payment_intents
      POST /v1/customers
      GET  /v1/customers/{id}
      GET  /v1/charges
      POST /v1/refunds
    """

    def _get_sandbox_url(self) -> str:
        return "https://api.stripe.com"

    def _get_production_url(self) -> str:
        return "https://api.stripe.com"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.secret_key = cfg.get("secret_key") or os.getenv("STRIPE_SECRET_KEY")
        self.publishable_key = cfg.get("publishable_key") or os.getenv("STRIPE_PUBLISHABLE_KEY")
        self.webhook_secret = cfg.get("webhook_secret") or os.getenv("STRIPE_WEBHOOK_SECRET")
        if self.secret_key and self.secret_key.startswith("sk_test_"):
            self.is_sandbox = True

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        if self.secret_key:
            headers["Authorization"] = f"Bearer {self.secret_key}"
        return headers

    def _base(self) -> str:
        return self._get_base_url()

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """GET /v1/balance para verificar la key."""
        if not self.secret_key:
            return {"success": False, "provider": "Stripe", "message": "Secret key not configured"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self._base()}/v1/balance", headers=self._get_headers()) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        mode = "TEST" if self.secret_key.startswith("sk_test_") else "LIVE"
                        currency = (data.get("available") or [{}])[0].get("currency", "usd")
                        return {
                            "success": True,
                            "provider": "Stripe",
                            "message": f"Connected in {mode} mode",
                            "mode": mode,
                            "currency": currency,
                        }
                    err = (await resp.json()).get("error", {})
                    return {"success": False, "provider": "Stripe", "message": err.get("message", f"HTTP {resp.status}")}
        except Exception as e:
            logger.error(f"Stripe connection test failed: {e}")
            return {"success": False, "provider": "Stripe", "message": str(e)}

    # ── Payment Intents ───────────────────────────────────────────────────────

    async def create_payment_intent(
        self,
        amount: int,
        currency: str = "mxn",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        POST /v1/payment_intents

        Args:
            amount: Centavos (5000 = $50.00 MXN)
            currency: mxn | usd | etc.
        """
        payload: Dict[str, Any] = {
            "amount": amount,
            "currency": currency,
            "automatic_payment_methods[enabled]": "true",
        }
        if customer_id:
            payload["customer"] = customer_id
        if metadata:
            for k, v in metadata.items():
                payload[f"metadata[{k}]"] = v

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/v1/payment_intents", headers=self._get_headers(), data=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {
                        "success": True,
                        "payment_intent_id": data["id"],
                        "client_secret": data["client_secret"],
                        "status": data["status"],
                        "amount": data["amount"],
                        "currency": data["currency"],
                    }
                return {"success": False, "error": data.get("error", {}).get("message", "Unknown error")}

    # ── Customers ─────────────────────────────────────────────────────────────

    async def create_customer(
        self,
        email: str,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """POST /v1/customers"""
        payload: Dict[str, Any] = {"email": email}
        if name:
            payload["name"] = name
        if phone:
            payload["phone"] = phone
        if metadata:
            for k, v in metadata.items():
                payload[f"metadata[{k}]"] = v

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/v1/customers", headers=self._get_headers(), data=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "customer_id": data["id"], "email": data["email"]}
                return {"success": False, "error": data.get("error", {}).get("message")}

    async def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """GET /v1/customers/{id}"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/v1/customers/{customer_id}", headers=self._get_headers()
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "customer": data}
                return {"success": False, "error": data.get("error", {}).get("message")}

    # ── Charges ───────────────────────────────────────────────────────────────

    async def list_charges(
        self,
        limit: int = 10,
        customer_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """GET /v1/charges"""
        params: Dict[str, Any] = {"limit": limit}
        if customer_id:
            params["customer"] = customer_id
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._base()}/v1/charges", headers=self._get_headers(), params=params
            ) as resp:
                return (await resp.json()).get("data", [])

    # ── Refunds ───────────────────────────────────────────────────────────────

    async def create_refund(
        self,
        charge_id: str,
        amount: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        POST /v1/refunds

        Args:
            amount: Centavos (None = reembolso completo)
            reason: duplicate | fraudulent | requested_by_customer
        """
        payload: Dict[str, Any] = {"charge": charge_id}
        if amount:
            payload["amount"] = amount
        if reason:
            payload["reason"] = reason

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._base()}/v1/refunds", headers=self._get_headers(), data=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {
                        "success": True,
                        "refund_id": data["id"],
                        "amount": data["amount"],
                        "status": data["status"],
                    }
                return {"success": False, "error": data.get("error", {}).get("message")}


stripe_integration = StripeIntegration()
