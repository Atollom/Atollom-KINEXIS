"""
KINEXIS Backend — FastAPI application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure root logger so all logger.info() calls in the app are visible in Railway
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# Import routers
from src.routers import (
    onboarding_router,
    cfdi_router,
    samantha_router,
    dashboard_router,
    agents_router,
    stripe_router,
)

_startup_logger = logging.getLogger("kinexis.startup")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    _startup_logger.info("KINEXIS API starting...")
    _startup_logger.info(
        "[ENV CHECK] SUPABASE_URL=%s | SERVICE_ROLE_KEY=%s | GOOGLE_API_KEY=%s | DATABASE_URL=%s",
        "SET" if os.getenv("SUPABASE_URL") else "MISSING",
        "SET" if os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "MISSING",
        "SET" if os.getenv("GOOGLE_API_KEY") else "MISSING",
        "SET" if os.getenv("DATABASE_URL") else "MISSING",
    )
    yield
    _startup_logger.info("KINEXIS API shutting down...")

app = FastAPI(
    title="KINEXIS API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,https://kinexis.atollom.com,https://dashboard.atollom.com"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Health check
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "KINEXIS",
        "agents": 43,
        "timestamp": datetime.utcnow().isoformat(),
    }

# Mount routers
app.include_router(onboarding_router.router)
app.include_router(cfdi_router.router)
app.include_router(samantha_router.router)
app.include_router(dashboard_router.router)
app.include_router(agents_router.router)