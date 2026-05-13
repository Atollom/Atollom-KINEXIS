"""
Shipping Router — Skydropx endpoints for SHOPIFY orders only.

Scope:
  ✅  /api/shipping/shopify/* → Skydropx
  ❌  Mercado Libre uses /api/ml/*  (Mercado Envíos, own system)
  ❌  Amazon       uses /api/amazon/* (Buy Shipping / FBA, own system)
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from src.auth.jwt_validator import get_current_user
from src.services.skydropx_service import skydropx_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/shipping/shopify", tags=["shipping-shopify"])


# ── Request models ────────────────────────────────────────────────────────────

class Parcel(BaseModel):
    weight: float
    height: float
    width: float
    length: float

    @field_validator("weight", "height", "width", "length")
    @classmethod
    def positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("must be positive")
        return v


class Address(BaseModel):
    name: str
    company: Optional[str] = None
    street1: str
    city: str
    province: str
    zip: str
    country: str = "MX"
    phone: str
    email: str


class RatesRequest(BaseModel):
    zip_from: str
    zip_to: str
    parcel: Parcel
    carriers: Optional[List[str]] = None


class ShipmentCreate(BaseModel):
    rate_id: str
    address_from: Address
    address_to: Address
    parcel: Parcel
    shopify_order_id: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/rates")
async def get_rates(
    body: RatesRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Quote shipping rates for a Shopify parcel (Skydropx)."""
    try:
        rates = await skydropx_service.get_rates(
            zip_from=body.zip_from,
            zip_to=body.zip_to,
            parcel=body.parcel.model_dump(),
            carriers=body.carriers,
        )
        return {"rates": rates}
    except Exception as exc:
        logger.error("get_rates failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/shipments")
async def create_shipment(
    body: ShipmentCreate,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Create a Shopify shipment and return tracking + label URL."""
    try:
        return await skydropx_service.create_shipment(
            rate_id=body.rate_id,
            address_from=body.address_from.model_dump(exclude_none=True),
            address_to=body.address_to.model_dump(exclude_none=True),
            parcel=body.parcel.model_dump(),
            shopify_order_id=body.shopify_order_id,
        )
    except Exception as exc:
        logger.error("create_shipment failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/shipments/{shipment_id}")
async def get_shipment(
    shipment_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get Shopify shipment tracking status."""
    try:
        return await skydropx_service.get_shipment(shipment_id)
    except Exception as exc:
        logger.error("get_shipment(%s) failed: %s", shipment_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))


@router.delete("/shipments/{shipment_id}")
async def cancel_shipment(
    shipment_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """Cancel a Shopify shipment."""
    try:
        ok = await skydropx_service.cancel_shipment(shipment_id)
        return {"cancelled": ok}
    except Exception as exc:
        logger.error("cancel_shipment(%s) failed: %s", shipment_id, exc)
        raise HTTPException(status_code=502, detail=str(exc))
