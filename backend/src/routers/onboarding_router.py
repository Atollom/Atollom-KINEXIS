"""
Onboarding Router — HTTP endpoint para el wizard de configuración inicial.
Recibe datos del proxy Next.js y delega a OnboardingService.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, field_validator

from src.services.onboarding_service import onboarding_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


# ── Request models ────────────────────────────────────────────────────────────

class CompanyIn(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None


class EcommerceIn(BaseModel):
    ml_connected: bool = False
    ml_access_token: Optional[str] = None
    ml_refresh_token: Optional[str] = None
    ml_user_id: Optional[str] = None
    ml_nickname: Optional[str] = None
    amazon_seller_id: Optional[str] = None
    amazon_marketplace_id: Optional[str] = None
    amazon_access_key: Optional[str] = None
    amazon_secret_key: Optional[str] = None
    shopify_store_url: Optional[str] = None
    shopify_access_token: Optional[str] = None


class MessagingIn(BaseModel):
    wa_phone_number_id: Optional[str] = None
    wa_business_account_id: Optional[str] = None
    wa_access_token: Optional[str] = None
    ig_account_id: Optional[str] = None
    ig_access_token: Optional[str] = None
    fb_page_id: Optional[str] = None
    fb_page_access_token: Optional[str] = None


class BillingIn(BaseModel):
    rfc_emisor: Optional[str] = None
    rfc: Optional[str] = None  # alias accepted from frontend
    razon_social: Optional[str] = None
    regimen_fiscal: Optional[str] = None
    lugar_expedicion: Optional[str] = None
    invoice_limit: int = 200
    facturama_username: Optional[str] = None
    facturama_password: Optional[str] = None
    facturama_sandbox: bool = True
    facturapi_secret_key: Optional[str] = None

    @field_validator("invoice_limit")
    @classmethod
    def limit_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("invoice_limit must be positive")
        return v


class UserIn(BaseModel):
    full_name: str
    email: str
    role: str = "agente"


class OnboardingRequest(BaseModel):
    company: CompanyIn
    ecommerce: EcommerceIn = EcommerceIn()
    messaging: MessagingIn = MessagingIn()
    billing: BillingIn
    users: List[UserIn]

    @field_validator("users")
    @classmethod
    def at_least_one_user(cls, v: List[UserIn]) -> List[UserIn]:
        if not v:
            raise ValueError("At least one user is required")
        return v


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("")
async def create_onboarding(body: OnboardingRequest) -> Dict[str, Any]:
    """Procesa el onboarding wizard completo en una transacción atómica."""
    logger.info(f"Onboarding request: company={body.company.name!r}, users={len(body.users)}")

    result = await onboarding_service.create_tenant(
        company=body.company.model_dump(),
        ecommerce=body.ecommerce.model_dump(),
        messaging=body.messaging.model_dump(),
        billing=body.billing.model_dump(),
        users=[u.model_dump() for u in body.users],
    )

    if not result.get("success"):
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=result.get("error", "Onboarding failed"))

    return result
