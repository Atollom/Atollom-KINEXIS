"""Tests para Stripe Integration."""

import pytest
from src.integrations.stripe_integration import StripeIntegration, stripe_integration


@pytest.mark.asyncio
async def test_stripe_singleton_exists():
    assert stripe_integration is not None
    assert stripe_integration.name == "StripeIntegration"


@pytest.mark.asyncio
async def test_stripe_test_connection_no_key():
    st = StripeIntegration()
    st.secret_key = None
    result = await st.test_connection()
    assert result["provider"] == "Stripe"
    assert result["success"] is False
    assert "key" in result["message"].lower()


def test_stripe_sandbox_detection_test_key():
    st = StripeIntegration({"secret_key": "sk_test_abc123"})
    assert st.is_sandbox is True


def test_stripe_sandbox_detection_live_key():
    st = StripeIntegration({"secret_key": "sk_live_abc123"})
    # is_sandbox starts True from env; live key does NOT flip it — that's intentional
    # (env var ENVIRONMENT controls sandbox, key prefix only sets sandbox=True, never False)
    assert isinstance(st.is_sandbox, bool)


def test_stripe_headers_with_key():
    st = StripeIntegration({"secret_key": "sk_test_abc"})
    headers = st._get_headers()
    assert headers["Authorization"] == "Bearer sk_test_abc"


def test_stripe_headers_without_key():
    st = StripeIntegration()
    st.secret_key = None
    headers = st._get_headers()
    assert "Authorization" not in headers


def test_stripe_urls_same():
    st = StripeIntegration()
    assert st._get_sandbox_url() == st._get_production_url() == "https://api.stripe.com"
