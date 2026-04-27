"""
CFDI Router — Endpoints para facturación CFDI multi-tenant.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, field_validator

from src.integrations.cfdi_provider import cfdi_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cfdi", tags=["cfdi"])


# ── Request models ────────────────────────────────────────────────────────────

class InvoiceItem(BaseModel):
    description: str
    unit_price: float
    quantity: int = 1
    product_key: str = "01010101"
    unit_key: str = "H87"
    unit: str = "Pieza"

    @field_validator("unit_price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("unit_price must be positive")
        return round(v, 2)

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("quantity must be positive")
        return v


class CreateInvoiceRequest(BaseModel):
    customer_rfc: str
    customer_name: str
    items: List[InvoiceItem]
    payment_form: str = "03"
    payment_method: str = "PUE"
    use: str = "G03"

    @field_validator("customer_rfc")
    @classmethod
    def rfc_uppercase(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("items")
    @classmethod
    def at_least_one_item(cls, v: List[InvoiceItem]) -> List[InvoiceItem]:
        if not v:
            raise ValueError("At least one item is required")
        return v


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/usage/{tenant_id}")
async def get_usage(tenant_id: str) -> Dict[str, Any]:
    """Cuota mensual de timbres CFDI del tenant."""
    try:
        return await cfdi_provider.get_tenant_invoice_usage(tenant_id)
    except Exception as exc:
        logger.error(f"get_usage({tenant_id}): {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/invoices/{tenant_id}")
async def get_invoices(
    tenant_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status: Optional[str] = Query(default=None, pattern="^(valid|cancelled)$"),
) -> List[Dict[str, Any]]:
    """Lista facturas del tenant con paginación opcional."""
    try:
        return await cfdi_provider.get_invoices_by_tenant(
            tenant_id=tenant_id,
            limit=limit,
            offset=offset,
            status=status,
        )
    except Exception as exc:
        logger.error(f"get_invoices({tenant_id}): {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/invoices/{tenant_id}")
async def create_invoice(tenant_id: str, body: CreateInvoiceRequest) -> Dict[str, Any]:
    """Genera una factura CFDI 4.0 para el tenant."""
    logger.info(f"Invoice request: tenant={tenant_id} rfc={body.customer_rfc}")

    items = [item.model_dump() for item in body.items]

    result = await cfdi_provider.create_invoice(
        customer_rfc=body.customer_rfc,
        customer_name=body.customer_name,
        items=items,
        payment_form=body.payment_form,
        payment_method=body.payment_method,
        use=body.use,
        tenant_id=tenant_id,
    )

    if not result.get("success"):
        status_code = 429 if "quota" in result.get("error", "").lower() else 422
        raise HTTPException(status_code=status_code, detail=result.get("error", "CFDI generation failed"))

    return result


@router.delete("/invoices/{tenant_id}/{invoice_id}")
async def cancel_invoice(
    tenant_id: str,
    invoice_id: str,
    motive: str = Query(default="02", pattern="^(01|02|03|04)$"),
    provider: str = Query(default="facturama", pattern="^(facturama|facturapi)$"),
) -> Dict[str, Any]:
    """Cancela una factura ante el SAT."""
    result = await cfdi_provider.cancel_invoice(
        invoice_id=invoice_id,
        provider=provider,
        motive=motive,
        tenant_id=tenant_id,
    )
    if not result.get("success"):
        raise HTTPException(status_code=422, detail=result.get("error", "Cancellation failed"))
    return result
