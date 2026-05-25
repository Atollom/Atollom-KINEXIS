"""
KINEXIS — Routers de módulo
"""

from . import onboarding_router
from . import auth_router
from . import cfdi_router
from . import samantha_router
from . import dashboard_router
from . import agents_router
from . import stripe_router
from . import shipping_router
from . import sandbox_router
from . import health_router
from . import amazon_oauth_router
from . import ml_oauth_router
from . import whatsapp_router
from . import meta_oauth_router

__all__ = [
    "onboarding_router",
    "auth_router",
    "cfdi_router",
    "samantha_router",
    "dashboard_router",
    "agents_router",
    "stripe_router",
    "shipping_router",
    "sandbox_router",
    "health_router",
    "amazon_oauth_router",
    "ml_oauth_router",
    "whatsapp_router",
    "meta_oauth_router",
]
