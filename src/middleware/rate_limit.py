"""
Rate limiting middleware via slowapi.

Límites por endpoint:
  - Global (todas las rutas):  100/minute por IP
  - POST /api/samantha/chat:   10/minute  (costo alto: LLM call)
  - GET  /api/dashboard/stats: 30/minute
  - GET  /api/samantha/credits: 30/minute
  - POST /webhooks/meta:        60/minute  (tráfico legítimo Meta)
"""
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    reset_at = int(time.time()) + 60
    return JSONResponse(
        status_code=429,
        content={
            "error": "Demasiadas solicitudes. Intenta de nuevo más tarde.",
            "retry_after": 60,
        },
        headers={
            "Retry-After": "60",
            "X-RateLimit-Reset": str(reset_at),
        },
    )
