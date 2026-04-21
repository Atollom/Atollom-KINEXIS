"""Tests para Shopify Integration."""

import pytest
from src.integrations.shopify_integration import ShopifyIntegration, shopify_integration


@pytest.mark.asyncio
async def test_shopify_singleton_exists():
    assert shopify_integration is not None
    assert shopify_integration.name == "ShopifyIntegration"


@pytest.mark.asyncio
async def test_shopify_test_connection_no_token():
    sh = ShopifyIntegration()
    sh.access_token = None
    result = await sh.test_connection()
    assert result["provider"] == "Shopify"
    assert result["success"] is False
    assert "token" in result["message"].lower()


def test_shopify_headers_with_token():
    sh = ShopifyIntegration()
    sh.access_token = "shpat_test123"
    headers = sh._get_headers()
    assert headers["X-Shopify-Access-Token"] == "shpat_test123"
    assert "Content-Type" in headers


def test_shopify_headers_without_token():
    sh = ShopifyIntegration()
    sh.access_token = None
    headers = sh._get_headers()
    assert "X-Shopify-Access-Token" not in headers


def test_shopify_api_url():
    sh = ShopifyIntegration()
    sh.api_version = "2024-04"
    url = sh._api_url("products.json")
    assert "2024-04" in url
    assert "products.json" in url


def test_shopify_sandbox_is_true():
    assert shopify_integration.is_sandbox is True
