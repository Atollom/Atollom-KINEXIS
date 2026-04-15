# src/main.py
import logging
import os
import traceback
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# ──────────────────────────────────────────────────────────────────────────────
# Agent imports
# ──────────────────────────────────────────────────────────────────────────────
from src.agents.account_manager_agent import AccountManagerAgent
from src.agents.amazon_ads_manager_agent import AmazonAdsManagerAgent
from src.agents.amazon_fba_manager_agent import AmazonFBAManagerAgent
from src.agents.amazon_listing_agent import AmazonListingAgent
from src.agents.amazon_orders_agent import AmazonOrdersAgent
from src.agents.catalog_manager_agent import CatalogManagerAgent
from src.agents.catalog_sync_agent import CatalogSyncAgent
from src.agents.cfdi_billing_agent import CFDIBillingAgent
from src.agents.crisis_response_agent import CrisisResponseAgent
from src.agents.customer_support_agent import CustomerSupportAgent
from src.agents.facebook_ads_agent import FacebookAdsAgent
from src.agents.finance_cashflow_agent import FinanceCashflowAgent
from src.agents.import_logistics_agent import ImportLogisticsAgent
from src.agents.instagram_ads_manager_agent import InstagramAdsManagerAgent
from src.agents.instagram_comments_agent import InstagramCommentsAgent
from src.agents.instagram_content_publisher import InstagramContentPublisher
from src.agents.instagram_dm_handler_agent import InstagramDMHandlerAgent
from src.agents.inventory_agent import InventoryAgent
from src.agents.lead_qualifier_agent import LeadQualifierAgent
from src.agents.leads_pipeline_agent import LeadsPipelineAgent
from src.agents.ml_ads_manager_agent import MLAdsManagerAgent
from src.agents.ml_analytics_agent import MLAnalyticsAgent
from src.agents.ml_fulfillment_agent import MLFulfillmentAgent
from src.agents.ml_listing_optimizer_agent import MLListingOptimizerAgent
from src.agents.ml_question_handler_agent import MLQuestionHandlerAgent
from src.agents.nps_satisfaction_agent import NPSSatisfactionAgent
from src.agents.onboarding_agent import OnboardingAgent
from src.agents.price_sync_agent import PriceSyncAgent
from src.agents.procurement_agent import ProcurementAgent
from src.agents.product_development_assistant import ProductDevelopmentAssistant
from src.agents.returns_refunds_agent import ReturnsRefundsAgent
from src.agents.review_monitor_agent import ReviewMonitorAgent
from src.agents.router_agent import RouterAgent
from src.agents.sales_b2b_agent import SalesB2BAgent
from src.agents.shopify_orders_agent import ShopifyOrdersAgent
from src.agents.supplier_relations_agent import SupplierRelationsAgent
from src.agents.tax_compliance_agent import TaxComplianceAgent
from src.agents.validation_agent import ValidationAgent
from src.agents.warehouse_coordinator_agent import WarehouseCoordinatorAgent
from src.agents.whatsapp_handler_agent import WhatsAppHandlerAgent

# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("kinexis.main")

# ──────────────────────────────────────────────────────────────────────────────
# Agent registry  — slug → class
# Excluye BaseAgent y BaseAdsManager (no son ejecutables directamente)
# ──────────────────────────────────────────────────────────────────────────────
AGENT_REGISTRY: Dict[str, Any] = {
    "account_manager":            AccountManagerAgent,
    "amazon_ads_manager":         AmazonAdsManagerAgent,
    "amazon_fba_manager":         AmazonFBAManagerAgent,
    "amazon_listing":             AmazonListingAgent,
    "amazon_orders":              AmazonOrdersAgent,
    "catalog_manager":            CatalogManagerAgent,
    "catalog_sync":               CatalogSyncAgent,
    "cfdi_billing":               CFDIBillingAgent,
    "crisis_response":            CrisisResponseAgent,
    "customer_support":           CustomerSupportAgent,
    "facebook_ads":               FacebookAdsAgent,
    "finance_cashflow":           FinanceCashflowAgent,
    "import_logistics":           ImportLogisticsAgent,
    "instagram_ads_manager":      InstagramAdsManagerAgent,
    "instagram_comments":         InstagramCommentsAgent,
    "instagram_content_publisher": InstagramContentPublisher,
    "instagram_dm_handler":       InstagramDMHandlerAgent,
    "inventory":                  InventoryAgent,
    "lead_qualifier":             LeadQualifierAgent,
    "leads_pipeline":             LeadsPipelineAgent,
    "ml_ads_manager":             MLAdsManagerAgent,
    "ml_analytics":               MLAnalyticsAgent,
    "ml_fulfillment":             MLFulfillmentAgent,
    "ml_listing_optimizer":       MLListingOptimizerAgent,
    "ml_question_handler":        MLQuestionHandlerAgent,
    "nps_satisfaction":           NPSSatisfactionAgent,
    "onboarding":                 OnboardingAgent,
    "price_sync":                 PriceSyncAgent,
    "procurement":                ProcurementAgent,
    "product_development":        ProductDevelopmentAssistant,
    "returns_refunds":            ReturnsRefundsAgent,
    "review_monitor":             ReviewMonitorAgent,
    "router":                     RouterAgent,
    "sales_b2b":                  SalesB2BAgent,
    "shopify_orders":             ShopifyOrdersAgent,
    "supplier_relations":         SupplierRelationsAgent,
    "tax_compliance":             TaxComplianceAgent,
    "validation":                 ValidationAgent,
    "warehouse_coordinator":      WarehouseCoordinatorAgent,
    "whatsapp_handler":           WhatsAppHandlerAgent,
}

# ──────────────────────────────────────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Atollom KINEXIS Backend",
    description="Multi-agent e-commerce automation platform — 43 agents",
    version="1.0.0",
)

# CORS — allow Vercel frontends + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",
        "https://kinexis.atollom.com",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────────
# Auth — Bearer token via AGENT_SECRET env var
# ──────────────────────────────────────────────────────────────────────────────
security = HTTPBearer()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> None:
    """Validates Bearer token against AGENT_SECRET using constant-time comparison."""
    import hmac
    agent_secret = os.getenv("AGENT_SECRET", "")
    if not agent_secret:
        # Fail closed — never open when misconfigured
        logger.warning("AGENT_SECRET not set — rejecting request")
        raise HTTPException(status_code=503, detail="Service not configured")
    if not hmac.compare_digest(
        credentials.credentials.encode(), agent_secret.encode()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ──────────────────────────────────────────────────────────────────────────────
# Global exception handler
# ──────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s\n%s",
        request.method,
        request.url.path,
        exc,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG", "").lower() == "true" else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Public health check — no auth required."""
    return {
        "status": "ok",
        "agents": len(AGENT_REGISTRY),
        "tests": 710,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/agents", dependencies=[Depends(verify_token)])
async def list_agents():
    """Lista todos los agentes disponibles."""
    return {
        "status": "ok",
        "count": len(AGENT_REGISTRY),
        "agents": sorted(AGENT_REGISTRY.keys()),
    }


@app.post("/agents/{agent_id}/execute", dependencies=[Depends(verify_token)])
async def execute_agent(agent_id: str, request: Request):
    """
    Ejecuta un agente por su slug.
    Body esperado:
    {
        "tenant_id": "uuid-del-tenant",
        "payload": { ... datos específicos del agente ... }
    }
    """
    # 1. Validar que el agente existe
    agent_class = AGENT_REGISTRY.get(agent_id)
    if not agent_class:
        # Do NOT enumerate available agents — information disclosure
        raise HTTPException(status_code=404, detail="Agent not found")

    # 2. Parsear body
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    tenant_id: str | None = body.get("tenant_id")
    payload: Dict[str, Any] = body.get("payload", {})

    if not tenant_id or not isinstance(tenant_id, str):
        raise HTTPException(status_code=400, detail="tenant_id (string) is required")

    # 3. Supabase client — injected from env, never from request
    supabase_client = None
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            supabase_client = create_client(supabase_url, supabase_key)
        except Exception:
            logger.error("Supabase client creation failed for agent=%s", agent_id)
            raise HTTPException(status_code=503, detail="Database unavailable")

    # 4. Instanciar y ejecutar — never log tenant_id in errors
    logger.info("Executing agent=%s", agent_id)
    try:
        agent = agent_class(tenant_id=tenant_id, supabase_client=supabase_client)
        result = await agent.run(payload)
    except Exception:
        # Never surface internal exception strings to the caller
        logger.error("Agent execution error: agent=%s", agent_id, exc_info=True)
        raise HTTPException(status_code=500, detail="Agent execution error")

    # 4. Respuesta estandarizada
    return {
        "status": result.get("status", "unknown"),
        "agent_id": agent_id,
        "tenant_id": tenant_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "result": result,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Meta Webhook — verificación de suscripción (GET) y recepción de eventos (POST)
# Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
# ──────────────────────────────────────────────────────────────────────────────
@app.get("/webhooks/meta")
async def meta_webhook_verify(request: Request):
    """
    Responde al challenge de verificación de Meta.
    Meta envía:
      hub.mode=subscribe  hub.challenge=<token>  hub.verify_token=<secret>
    Debe devolver hub.challenge como texto plano con status 200.
    """
    import hmac
    from fastapi.responses import PlainTextResponse

    params = dict(request.query_params)
    mode           = params.get("hub.mode")
    challenge      = params.get("hub.challenge")
    received_token = params.get("hub.verify_token", "")

    meta_verify_token = os.getenv("META_VERIFY_TOKEN", "")
    if not meta_verify_token:
        logger.error("META_VERIFY_TOKEN not configured — rejecting Meta verification")
        raise HTTPException(status_code=503, detail="Webhook not configured")

    if mode != "subscribe":
        raise HTTPException(status_code=400, detail="Invalid hub.mode")

    if not hmac.compare_digest(received_token.encode(), meta_verify_token.encode()):
        logger.warning("Meta webhook verification failed — token mismatch")
        raise HTTPException(status_code=403, detail="Forbidden")

    if not challenge:
        raise HTTPException(status_code=400, detail="Missing hub.challenge")

    logger.info("Meta webhook verified successfully")
    return PlainTextResponse(content=challenge, status_code=200)


@app.post("/webhooks/meta")
async def meta_webhook_receive(request: Request):
    """
    Recibe eventos de Meta (WhatsApp, Instagram).
    Verifica la firma X-Hub-Signature-256 antes de procesar.
    Devuelve {"status": "ok"} INMEDIATAMENTE para cumplir el protocolo de latencia de Meta.
    El procesamiento del agente ocurre en background (fire-and-forget).
    """
    import asyncio
    import hashlib
    import hmac as hmac_lib
    from fastapi.responses import JSONResponse

    app_secret = os.getenv("META_APP_SECRET", "")
    raw_body = await request.body()
    signature_header = request.headers.get("X-Hub-Signature-256", "")

    # 1. Validación HMAC — fail-closed en producción
    if not app_secret:
        logger.error("❌ META_APP_SECRET no configurada. No se puede validar firma.")
        # Devolvemos 200 para no bloquear a Meta durante el setup inicial
        return JSONResponse(content={"status": "ok"}, status_code=200)

    expected = "sha256=" + hmac_lib.new(
        app_secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()

    if not signature_header or not hmac_lib.compare_digest(expected.encode(), signature_header.encode()):
        logger.warning("❌ HMAC signature mismatch — rejecting Meta webhook.")
        return JSONResponse(content={"status": "error"}, status_code=403)

    # 2. Parsear body JSON
    try:
        import json
        body = json.loads(raw_body)
    except Exception:
        return JSONResponse(content={"status": "error"}, status_code=400)

    # 3. Responder INMEDIATAMENTE a Meta (< 100ms)
    # El procesamiento del agente se hace en background.
    object_type = body.get("object", "")
    tenant_id   = os.getenv("DEFAULT_TENANT_ID", "")

    if object_type == "whatsapp_business_account":
        agent_id = "whatsapp_handler"
    elif object_type == "instagram":
        agent_id = "instagram_dm_handler"
    else:
        logger.info("Unhandled Meta object type: %s", object_type)
        return JSONResponse(content={"status": "ok"}, status_code=200)

    # 4. Fire-and-forget: despachar agente en background
    async def _dispatch_agent():
        agent_class = AGENT_REGISTRY.get(agent_id)
        if not agent_class or not tenant_id:
            return
        supabase_client = None
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if supabase_url and supabase_key:
            try:
                from supabase import create_client
                supabase_client = create_client(supabase_url, supabase_key)
            except Exception:
                logger.error("Supabase client creation failed for Meta webhook dispatch")
                return
        try:
            agent = agent_class(tenant_id=tenant_id, supabase_client=supabase_client)
            await agent.run({"event": body, "raw": True})
        except Exception:
            logger.error("Meta webhook agent dispatch error: agent=%s", agent_id, exc_info=True)

    asyncio.create_task(_dispatch_agent())

    return JSONResponse(content={"status": "ok"}, status_code=200)


# ──────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
