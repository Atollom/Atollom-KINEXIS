"""
KINEXIS — Routers de módulo
"""

from . import onboarding_router
from . import cfdi_router
from . import samantha_router
from . import dashboard_router

__all__ = [
    "onboarding_router",
    "cfdi_router",
    "samantha_router",
    "dashboard_router",
]
