"""
KINEXIS — 43 Agentes Especializados
Importar todos los agentes aquí para acceso centralizado.

Autor: Carlos Cortés (Atollom Labs)
"""

# ── Core ──────────────────────────────────────────────────────────────────────
from .core.agent_00_guardian import guardian
from .core.agent_26_validation import validation

# ── E-commerce ────────────────────────────────────────────────────────────────
from .ecommerce.agent_01_ml_fulfillment import ml_fulfillment
from .ecommerce.agent_02_amazon_fba import amazon_fba
from .ecommerce.agent_03_shopify_fulfillment import shopify_fulfillment
from .ecommerce.agent_06_price_manager import price_manager
from .ecommerce.agent_14_returns_manager import returns_manager
from .ecommerce.agent_27_ml_questions import ml_questions

# ── ERP ───────────────────────────────────────────────────────────────────────
from .erp.agent_13_cfdi_billing import cfdi_billing

# ── CRM ───────────────────────────────────────────────────────────────────────
from .crm.agent_31_lead_scorer import lead_scorer

__all__ = [
    # Core
    "guardian",
    "validation",
    # E-commerce
    "ml_fulfillment",
    "amazon_fba",
    "shopify_fulfillment",
    "price_manager",
    "returns_manager",
    "ml_questions",
    # ERP
    "cfdi_billing",
    # CRM
    "lead_scorer",
]
