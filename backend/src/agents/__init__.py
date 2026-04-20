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
    # ERP
    "cfdi_billing",
    # CRM
    "lead_scorer",
]
