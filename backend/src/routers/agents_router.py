"""
Agents Router — HTTP wrapper for domain routers (Ecommerce, CRM, ERP, Meta).
Exposes POST /api/agents/{domain}/route for each business domain.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from src.routers.ecommerce_router import ecommerce_router as _ecommerce
from src.routers.crm_router import crm_router as _crm
from src.routers.erp_router import erp_router as _erp
from src.routers.meta_router import meta_router as _meta
from src.agents.crm.agent_32_quote_generator import quote_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["agents"])

_DOMAIN_ROUTERS = {
    "ecommerce": _ecommerce,
    "crm":       _crm,
    "erp":       _erp,
    "meta":      _meta,
}


class AgentRequest(BaseModel):
    intent: str
    tenant_id: str
    data: Dict[str, Any] = {}


@router.get("/health")
async def agents_health():
    return {
        "status": "ok",
        "domains": list(_DOMAIN_ROUTERS.keys()),
        "routers_active": len(_DOMAIN_ROUTERS),
    }


class QuotePDFRequest(BaseModel):
    customer: Dict[str, Any]
    items: list
    payment_terms: str = "30_days"
    valid_until: str = ""
    notes: str = ""
    tax_rate: float = 0.16


@router.post("/crm/quotes/pdf", response_class=Response)
async def generate_quote_pdf(req: QuotePDFRequest):
    """Generate a branded PDF cotización and return it as application/pdf."""
    payload: Dict[str, Any] = {
        "customer":      req.customer,
        "items":         req.items,
        "payment_terms": req.payment_terms,
        "tax_rate":      req.tax_rate,
    }
    if req.valid_until:
        payload["valid_until"] = req.valid_until
    if req.notes:
        payload["notes"] = req.notes

    result = await quote_generator.execute(payload)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "PDF generation failed"))

    data = result["data"]
    pdf_bytes: bytes = data.get("pdf_bytes") or b""
    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="PDF bytes empty")

    quote_number = data.get("quote_number", "cotizacion")
    filename = f"cotizacion_{quote_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{domain}/route")
async def route_to_domain(domain: str, req: AgentRequest):
    if domain not in _DOMAIN_ROUTERS:
        raise HTTPException(
            status_code=404,
            detail=f"Domain '{domain}' not found. Valid: {list(_DOMAIN_ROUTERS.keys())}",
        )
    try:
        result = await _DOMAIN_ROUTERS[domain].route({
            "intent":    req.intent,
            "tenant_id": req.tenant_id,
            **req.data,
        })
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Domain router error [%s]: %s", domain, e)
        raise HTTPException(status_code=500, detail=str(e))
