"""
Stripe Configuration — Price IDs and plan limits.
Set env vars to override defaults for production.
"""
import os

STRIPE_PRICES = {
    "starter": os.getenv("STRIPE_PRICE_STARTER", "price_xxxxx1"),
    "growth":  os.getenv("STRIPE_PRICE_GROWTH",  "price_xxxxx2"),
    "pro":     os.getenv("STRIPE_PRICE_PRO",      "price_xxxxx3"),
    # Add-ons
    "tokens_100": os.getenv("STRIPE_PRICE_TOKENS",  "price_xxxxx4"),
    "timbres_50": os.getenv("STRIPE_PRICE_TIMBRES", "price_xxxxx5"),
}

PLAN_LIMITS: dict = {
    "starter": {
        "modules":      1,
        "ai_tokens":  500,
        "cfdi_timbres": 100,
        "users":        3,
    },
    "growth": {
        "modules":      2,
        "ai_tokens":  750,
        "cfdi_timbres": 200,
        "users":       10,
    },
    "pro": {
        "modules":     999_999,
        "ai_tokens":   999_999,
        "cfdi_timbres": 999_999,
        "users":        999_999,
    },
}
