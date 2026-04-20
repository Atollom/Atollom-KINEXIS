"""
KINEXIS — Routers de módulo
Orquestadores de agentes por dominio: E-commerce, CRM, ERP, Meta
"""

from .ecommerce_router import ecommerce_router
from .crm_router import crm_router
from .erp_router import erp_router
from .meta_router import meta_router

__all__ = [
    "ecommerce_router",
    "crm_router",
    "erp_router",
    "meta_router",
]
