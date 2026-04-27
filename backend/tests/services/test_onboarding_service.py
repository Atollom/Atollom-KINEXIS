"""Tests para OnboardingService (sin BD — unit tests con mock de db)."""

import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.onboarding_service import OnboardingService


# ── Fixtures ──────────────────────────────────────────────────────────────────

VALID_COMPANY = {
    "name": "Kap Tools SA de CV",
    "phone": "+52 222 123 4567",
    "address": "Av. Principal 100, Puebla, México",
    "email": "contacto@kaptools.com",
}

VALID_BILLING = {
    "rfc_emisor": "KAP850101ABC",
    "razon_social": "Kap Tools SA de CV",
    "regimen_fiscal": "601",
    "lugar_expedicion": "72000",
    "invoice_limit": 500,
    "facturama_username": "usuario_facturama",
    "facturama_password": "password_seguro",
    "facturama_sandbox": True,
}

VALID_ECOMMERCE = {
    "ml_connected": False,
    "amazon_seller_id": "A1B2C3D4EXAMPLE",
    "amazon_marketplace_id": "A1AM78C64UM0Y8",
    "amazon_access_key": "AKIAIOSFODNN7EXAMPLE",
    "amazon_secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "shopify_store_url": "",
    "shopify_access_token": "",
}

VALID_MESSAGING = {
    "wa_phone_number_id": "123456789012345",
    "wa_business_account_id": "987654321098765",
    "wa_access_token": "EAAxxxxxxxxxx",
    "ig_account_id": "",
    "ig_access_token": "",
    "fb_page_id": "",
    "fb_page_access_token": "",
}

VALID_USERS = [
    {"full_name": "Carlos Cortés", "email": "carlos@kaptools.com", "role": "owner"},
    {"full_name": "Ana García",    "email": "ana@kaptools.com",    "role": "admin"},
]


@pytest.fixture
def service():
    return OnboardingService()


# ── Slug generation ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_unique_slug_basic(service):
    with patch("src.services.onboarding_service.db") as mock_db:
        mock_db.fetch_val = AsyncMock(return_value=0)
        slug = await service._unique_slug("Kap Tools SA de CV")
    assert slug == "kap-tools-sa-de-cv"


@pytest.mark.asyncio
async def test_unique_slug_taken_adds_suffix(service):
    with patch("src.services.onboarding_service.db") as mock_db:
        # First call returns 1 (taken), second returns 0 (free)
        mock_db.fetch_val = AsyncMock(side_effect=[1, 0])
        slug = await service._unique_slug("Empresa")
    assert slug.startswith("empresa-")
    assert len(slug) > len("empresa")


@pytest.mark.asyncio
async def test_unique_slug_special_chars(service):
    with patch("src.services.onboarding_service.db") as mock_db:
        mock_db.fetch_val = AsyncMock(return_value=0)
        slug = await service._unique_slug("Héroe & Cía S.A.")
    assert "-" in slug
    assert slug == slug.lower()
    assert " " not in slug


# ── Plan determination ────────────────────────────────────────────────────────

def test_plan_starter(service):
    assert service._plan_for_limit(50) == "starter"
    assert service._plan_for_limit(200) == "starter"


def test_plan_growth(service):
    assert service._plan_for_limit(201) == "growth"
    assert service._plan_for_limit(500) == "growth"


def test_plan_pro(service):
    assert service._plan_for_limit(501) == "pro"
    assert service._plan_for_limit(1000) == "pro"


def test_plan_enterprise(service):
    assert service._plan_for_limit(1001) == "enterprise"
    assert service._plan_for_limit(9999) == "enterprise"


# ── Validation ────────────────────────────────────────────────────────────────

def test_validate_company_missing_name(service):
    with pytest.raises(ValueError, match="name"):
        service._validate_company({})


def test_validate_company_empty_name(service):
    with pytest.raises(ValueError, match="name"):
        service._validate_company({"name": "  "})


def test_validate_company_ok(service):
    service._validate_company({"name": "Kap Tools"})  # should not raise


def test_validate_billing_missing_rfc(service):
    with pytest.raises(ValueError, match="RFC"):
        service._validate_billing({"razon_social": "Test", "regimen_fiscal": "601"})


def test_validate_billing_invalid_rfc(service):
    with pytest.raises(ValueError, match="RFC"):
        service._validate_billing({
            "rfc_emisor": "INVALID",
            "razon_social": "Test",
            "regimen_fiscal": "601",
        })


def test_validate_billing_valid_rfc_moral(service):
    service._validate_billing({
        "rfc_emisor": "KAP850101ABC",
        "razon_social": "Kap Tools",
        "regimen_fiscal": "601",
    })


def test_validate_billing_valid_rfc_fisica(service):
    service._validate_billing({
        "rfc_emisor": "CORC801010ABC",
        "razon_social": "Carlos Cortés",
        "regimen_fiscal": "612",
    })


def test_validate_billing_missing_razon_social(service):
    with pytest.raises(ValueError, match="[Rr]az"):
        service._validate_billing({
            "rfc_emisor": "KAP850101ABC",
            "razon_social": "",
            "regimen_fiscal": "601",
        })


def test_validate_billing_missing_regimen(service):
    with pytest.raises(ValueError, match="fiscal"):
        service._validate_billing({
            "rfc_emisor": "KAP850101ABC",
            "razon_social": "Kap Tools",
            "regimen_fiscal": "",
        })


# ── create_tenant (mocked DB) ─────────────────────────────────────────────────

def _make_mock_conn(tenant_id=None):
    """Returns an async mock connection that simulates asyncpg."""
    tid = tenant_id or uuid.uuid4()
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(return_value={"id": tid})
    conn.execute = AsyncMock(return_value="INSERT 0 1")
    conn.transaction = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=conn),
        __aexit__=AsyncMock(return_value=False),
    ))
    return conn, tid


@pytest.mark.asyncio
async def test_create_tenant_success(service):
    tenant_id = uuid.uuid4()
    conn, _ = _make_mock_conn(tenant_id)

    mock_db = MagicMock()
    mock_db.fetch_val = AsyncMock(return_value=0)
    mock_db.transaction = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=conn),
        __aexit__=AsyncMock(return_value=False),
    ))

    with patch("src.services.onboarding_service.db", mock_db):
        result = await service.create_tenant(
            VALID_COMPANY, VALID_ECOMMERCE, VALID_MESSAGING, VALID_BILLING, VALID_USERS
        )

    assert result["success"] is True
    assert "tenant_id" in result
    assert result["slug"] == "kap-tools-sa-de-cv"
    assert result["plan"] == "growth"
    assert result["users_created"] == 2


@pytest.mark.asyncio
async def test_create_tenant_counts_integrations(service):
    """Amazon (seller_id) + WhatsApp (phone_id) + Facturama = 3 integrations."""
    tenant_id = uuid.uuid4()
    conn, _ = _make_mock_conn(tenant_id)

    mock_db = MagicMock()
    mock_db.fetch_val = AsyncMock(return_value=0)
    mock_db.transaction = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=conn),
        __aexit__=AsyncMock(return_value=False),
    ))

    with patch("src.services.onboarding_service.db", mock_db):
        result = await service.create_tenant(
            VALID_COMPANY, VALID_ECOMMERCE, VALID_MESSAGING, VALID_BILLING, VALID_USERS
        )

    assert result["integrations_created"] == 3  # amazon + whatsapp + facturama


@pytest.mark.asyncio
async def test_create_tenant_no_users_returns_error(service):
    result = await service.create_tenant(
        VALID_COMPANY, VALID_ECOMMERCE, VALID_MESSAGING, VALID_BILLING, []
    )
    assert result["success"] is False
    assert "user" in result["error"].lower()


@pytest.mark.asyncio
async def test_create_tenant_invalid_rfc_returns_error(service):
    bad_billing = {**VALID_BILLING, "rfc_emisor": "INVALID_RFC"}
    result = await service.create_tenant(
        VALID_COMPANY, VALID_ECOMMERCE, VALID_MESSAGING, bad_billing, VALID_USERS
    )
    assert result["success"] is False
    assert "RFC" in result["error"] or "rfc" in result["error"].lower()


@pytest.mark.asyncio
async def test_create_tenant_missing_name_returns_error(service):
    bad_company = {**VALID_COMPANY, "name": ""}
    result = await service.create_tenant(
        bad_company, VALID_ECOMMERCE, VALID_MESSAGING, VALID_BILLING, VALID_USERS
    )
    assert result["success"] is False


@pytest.mark.asyncio
async def test_create_tenant_ml_connected_counts(service):
    """ML connected adds one more integration."""
    tenant_id = uuid.uuid4()
    conn, _ = _make_mock_conn(tenant_id)

    ecommerce_with_ml = {
        **VALID_ECOMMERCE,
        "ml_connected": True,
        "ml_access_token": "APP_USR-token",
        "ml_refresh_token": "TG-refresh",
        "ml_user_id": "123456",
        "ml_nickname": "KAPTOOLS",
    }
    mock_db = MagicMock()
    mock_db.fetch_val = AsyncMock(return_value=0)
    mock_db.transaction = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(return_value=conn),
        __aexit__=AsyncMock(return_value=False),
    ))

    with patch("src.services.onboarding_service.db", mock_db):
        result = await service.create_tenant(
            VALID_COMPANY, ecommerce_with_ml, VALID_MESSAGING, VALID_BILLING, VALID_USERS
        )

    assert result["integrations_created"] == 4  # ml + amazon + whatsapp + facturama
