"""Tests para OnboardingRouter (HTTP layer via httpx.AsyncClient + mocked service)."""

import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from main import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

VALID_PAYLOAD = {
    "company": {
        "name": "Kap Tools SA de CV",
        "phone": "+52 222 123 4567",
        "address": "Av. Principal 100, Puebla",
        "email": "contacto@kaptools.com",
    },
    "ecommerce": {
        "ml_connected": False,
        "amazon_seller_id": "A1B2C3D4EXAMPLE",
        "amazon_marketplace_id": "A1AM78C64UM0Y8",
        "amazon_access_key": "AKIAIOSFODNN7EXAMPLE",
        "amazon_secret_key": "wJalrXUtnFEMI/K7MDENG",
    },
    "messaging": {
        "wa_phone_number_id": "123456789012345",
        "wa_business_account_id": "987654321098765",
        "wa_access_token": "EAAxxxxxxxxxx",
    },
    "billing": {
        "rfc_emisor": "KAP850101ABC",
        "razon_social": "Kap Tools SA de CV",
        "regimen_fiscal": "601",
        "lugar_expedicion": "72000",
        "invoice_limit": 500,
        "facturama_username": "usuario",
        "facturama_password": "password",
        "facturama_sandbox": True,
    },
    "users": [
        {"full_name": "Carlos Cortés", "email": "carlos@kaptools.com", "role": "owner"},
    ],
}

MOCK_SUCCESS = {
    "success": True,
    "tenant_id": str(uuid.uuid4()),
    "slug": "kap-tools-sa-de-cv",
    "plan": "growth",
    "integrations_created": 3,
    "users_created": 1,
}


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── GET /health ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── POST /api/onboarding ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_onboarding_success(client):
    with patch(
        "src.routers.onboarding_router.onboarding_service.create_tenant",
        new=AsyncMock(return_value=MOCK_SUCCESS),
    ):
        resp = await client.post("/api/onboarding", json=VALID_PAYLOAD)

    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "tenant_id" in data
    assert data["slug"] == "kap-tools-sa-de-cv"
    assert data["plan"] == "growth"
    assert data["integrations_created"] == 3
    assert data["users_created"] == 1


@pytest.mark.asyncio
async def test_onboarding_missing_company_name(client):
    payload = {**VALID_PAYLOAD, "company": {"name": ""}}
    with patch(
        "src.routers.onboarding_router.onboarding_service.create_tenant",
        new=AsyncMock(return_value={"success": False, "error": "Company name is required"}),
    ):
        resp = await client.post("/api/onboarding", json=payload)

    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_no_users_returns_422(client):
    payload = {**VALID_PAYLOAD, "users": []}
    resp = await client.post("/api/onboarding", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_missing_billing_field(client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "billing"}
    resp = await client.post("/api/onboarding", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_service_error_returns_422(client):
    with patch(
        "src.routers.onboarding_router.onboarding_service.create_tenant",
        new=AsyncMock(return_value={"success": False, "error": "RFC format invalid: INVALID"}),
    ):
        resp = await client.post("/api/onboarding", json=VALID_PAYLOAD)

    assert resp.status_code == 422
    assert "RFC" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_onboarding_invoice_limit_zero_rejected(client):
    payload = {**VALID_PAYLOAD, "billing": {**VALID_PAYLOAD["billing"], "invoice_limit": 0}}
    resp = await client.post("/api/onboarding", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_onboarding_ml_connected_payload(client):
    """ML connected fields are accepted and passed through."""
    payload = {
        **VALID_PAYLOAD,
        "ecommerce": {
            **VALID_PAYLOAD["ecommerce"],
            "ml_connected": True,
            "ml_access_token": "APP_USR-token",
            "ml_refresh_token": "TG-refresh",
            "ml_user_id": "123456",
            "ml_nickname": "KAPTOOLS",
        },
    }
    mock_result = {**MOCK_SUCCESS, "integrations_created": 4}
    with patch(
        "src.routers.onboarding_router.onboarding_service.create_tenant",
        new=AsyncMock(return_value=mock_result),
    ) as mock_create:
        resp = await client.post("/api/onboarding", json=payload)
        called_ecommerce = mock_create.call_args.kwargs["ecommerce"]

    assert resp.status_code == 200
    assert called_ecommerce["ml_connected"] is True
    assert called_ecommerce["ml_access_token"] == "APP_USR-token"


@pytest.mark.asyncio
async def test_onboarding_minimal_payload(client):
    """Only required fields — optional integration fields default to None/False."""
    minimal = {
        "company": {"name": "Mínima SA"},
        "billing": {
            "rfc_emisor": "MIN850101ABC",
            "razon_social": "Mínima SA",
            "regimen_fiscal": "601",
        },
        "users": [{"full_name": "Admin", "email": "admin@minima.com", "role": "owner"}],
    }
    with patch(
        "src.routers.onboarding_router.onboarding_service.create_tenant",
        new=AsyncMock(return_value={**MOCK_SUCCESS, "integrations_created": 0}),
    ):
        resp = await client.post("/api/onboarding", json=minimal)

    assert resp.status_code == 200
    assert resp.json()["integrations_created"] == 0
