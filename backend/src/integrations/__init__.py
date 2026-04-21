"""
KINEXIS - External Integrations
Todas las APIs externas centralizadas aqui
"""

from .base_integration import BaseIntegration

# E-commerce
from .mercadolibre_integration import ml_integration
from .amazon_integration import amazon_integration
from .shopify_integration import shopify_integration

# Messaging
from .whatsapp_integration import whatsapp_integration

# Payments
from .stripe_integration import stripe_integration

# CFDI
from .facturama_integration import facturama_integration
from .facturapi_integration import facturapi_integration
from .cfdi_provider import cfdi_provider  # Usar este para facturacion

__all__ = [
    "BaseIntegration",
    "ml_integration",
    "amazon_integration",
    "shopify_integration",
    "whatsapp_integration",
    "stripe_integration",
    "facturama_integration",
    "facturapi_integration",
    "cfdi_provider",
]
