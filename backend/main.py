"""
KINEXIS Backend — FastAPI application entry point.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import routers
from src.routers import (
    onboarding_router,
    cfdi_router,
    samantha_router,
    dashboard_router,
    agents_router,
    stripe_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 KINEXIS API starting...")
    yield
    # Shutdown
    print("👋 KINEXIS API shutting down...")

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
    return {"status": "ok", "service": "KINEXIS"}

# Mount routers
app.include_router(onboarding_router.router)
app.include_router(cfdi_router.router)
app.include_router(samantha_router.router)
app.include_router(dashboard_router.router)
app.include_router(agents_router.router)