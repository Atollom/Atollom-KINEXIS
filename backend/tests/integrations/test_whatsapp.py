"""Tests para WhatsApp Integration."""

import pytest
from src.integrations.whatsapp_integration import WhatsAppIntegration, whatsapp_integration


@pytest.mark.asyncio
async def test_whatsapp_singleton_exists():
    assert whatsapp_integration is not None
    assert whatsapp_integration.name == "WhatsAppIntegration"


@pytest.mark.asyncio
async def test_whatsapp_test_connection_no_credentials():
    wa = WhatsAppIntegration()
    wa.access_token = None
    wa.phone_number_id = None
    result = await wa.test_connection()
    assert result["provider"] == "WhatsApp"
    assert result["success"] is False


def test_whatsapp_normalize_phone_with_plus():
    phone = whatsapp_integration._normalize_phone("+522221234567")
    assert phone == "522221234567"


def test_whatsapp_normalize_phone_10_digits():
    phone = whatsapp_integration._normalize_phone("2221234567")
    assert phone == "522221234567"


def test_whatsapp_normalize_phone_with_spaces_and_dashes():
    phone = whatsapp_integration._normalize_phone("+52 222-123-4567")
    assert phone == "522221234567"


def test_whatsapp_normalize_phone_already_has_country_code():
    phone = whatsapp_integration._normalize_phone("522221234567")
    assert phone == "522221234567"


def test_whatsapp_verify_webhook_valid():
    wa = WhatsAppIntegration()
    wa.verify_token = "secret_token_abc"
    result = wa.verify_webhook("subscribe", "secret_token_abc", "challenge_xyz")
    assert result == "challenge_xyz"


def test_whatsapp_verify_webhook_wrong_token():
    wa = WhatsAppIntegration()
    wa.verify_token = "secret_token_abc"
    result = wa.verify_webhook("subscribe", "wrong_token", "challenge_xyz")
    assert result is None


def test_whatsapp_verify_webhook_wrong_mode():
    wa = WhatsAppIntegration()
    wa.verify_token = "secret_token_abc"
    result = wa.verify_webhook("unsubscribe", "secret_token_abc", "challenge_xyz")
    assert result is None


def test_whatsapp_sandbox_mode():
    assert whatsapp_integration.is_sandbox is True
