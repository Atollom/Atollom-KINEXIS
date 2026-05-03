"""
Security headers middleware — added to every HTTP response.
HSTS and CSP are restricted to production to avoid blocking local dev.
"""
import os

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

_IS_PROD = os.getenv("ENVIRONMENT") == "production"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # Clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Legacy XSS filter (IE/old Chrome)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions (no camera / mic / payment)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )

        if _IS_PROD:
            # HSTS — only safe over TLS
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

            # Content Security Policy — tightened for production
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' "
                "https://api.anthropic.com "
                "https://generativelanguage.googleapis.com "
                "https://*.supabase.co; "
                "frame-ancestors 'none';"
            )

        return response
