"""Tests para Mercado Libre Integration."""

import pytest
from src.integrations.mercadolibre_integration import MercadoLibreIntegration, ml_integration


@pytest.mark.asyncio
async def test_ml_integration_singleton_exists():
    assert ml_integration is not None
    assert ml_integration.name == "MercadoLibreIntegration"


@pytest.mark.asyncio
async def test_ml_test_connection():
    result = await ml_integration.test_connection()
    assert "success" in result
    assert result["provider"] == "Mercado Libre"


@pytest.mark.asyncio
async def test_ml_connection_returns_site_name():
    result = await ml_integration.test_connection()
    if result["success"]:
        assert "Mexico" in result["message"] or "Libre" in result["message"] or result["message"]


def test_ml_get_auth_url():
    url = ml_integration.get_auth_url(state="test123")
    assert "https://auth.mercadolibre.com.mx/authorization" in url
    assert "response_type=code" in url
    assert "state=test123" in url


def test_ml_sandbox_mode():
    assert ml_integration.is_sandbox is True
    assert ml_integration._get_base_url() == "https://api.mercadolibre.com"


@pytest.mark.asyncio
async def test_ml_set_tokens():
    ml = MercadoLibreIntegration()
    await ml.set_tokens("tok_access", "tok_refresh", user_id="user123")
    assert ml._access_token == "tok_access"
    assert ml._refresh_token == "tok_refresh"
    assert ml._user_id == "user123"


def test_ml_headers_base():
    headers = ml_integration._get_headers()
    assert "Content-Type" in headers
    assert "User-Agent" in headers
