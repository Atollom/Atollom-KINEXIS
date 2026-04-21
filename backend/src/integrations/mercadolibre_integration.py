"""
Mercado Libre Integration
Sandbox: Test Users
Production: OAuth 2.0
Docs: https://developers.mercadolibre.com.mx/
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)


class MercadoLibreIntegration(BaseIntegration):
    """
    Cliente Mercado Libre API v2.

    Endpoints:
      GET  /sites/MLM                         — health check
      GET  /users/me                          — usuario autenticado
      GET  /users/{id}/items/search           — productos del vendedor
      GET  /items/{item_id}                   — detalle producto
      GET  /orders/search                     — ordenes
      GET  /orders/{order_id}                 — detalle orden
      GET  /questions/search                  — preguntas
      POST /answers                           — responder pregunta
    """

    def _get_sandbox_url(self) -> str:
        return "https://api.mercadolibre.com"

    def _get_production_url(self) -> str:
        return "https://api.mercadolibre.com"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.client_id = os.getenv("ML_CLIENT_ID")
        self.client_secret = os.getenv("ML_CLIENT_SECRET")
        self.redirect_uri = os.getenv("ML_REDIRECT_URI", "http://localhost:3000/callback")
        self.test_user_id = os.getenv("ML_TEST_USER_ID")
        self.test_access_token = os.getenv("ML_TEST_ACCESS_TOKEN")

        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._user_id: Optional[str] = None

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """Test conexion via GET /sites/MLM (no requiere auth)."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self._get_base_url()}/sites/MLM") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "success": True,
                            "provider": "Mercado Libre",
                            "message": f"Connected to {data.get('name')}",
                            "mode": "SANDBOX" if self.is_sandbox else "PRODUCTION",
                        }
                    return {
                        "success": False,
                        "provider": "Mercado Libre",
                        "message": f"HTTP {resp.status}",
                    }
        except Exception as e:
            logger.error(f"ML connection test failed: {e}")
            return {"success": False, "provider": "Mercado Libre", "message": str(e)}

    # ── OAuth ─────────────────────────────────────────────────────────────────

    def get_auth_url(self, state: str = "random_state") -> str:
        """Genera URL OAuth para redirigir al usuario."""
        return (
            "https://auth.mercadolibre.com.mx/authorization"
            f"?response_type=code"
            f"&client_id={self.client_id}"
            f"&redirect_uri={self.redirect_uri}"
            f"&state={state}"
        )

    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """Intercambia authorization code por access token."""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.mercadolibre.com/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
            ) as resp:
                data = await resp.json()
                if "access_token" not in data:
                    raise ValueError(f"OAuth failed: {data}")
                self._store_tokens(data)
                logger.info(f"ML authenticated: user_id={self._user_id}")
                return {
                    "access_token": self._access_token,
                    "refresh_token": self._refresh_token,
                    "user_id": self._user_id,
                    "expires_in": data.get("expires_in"),
                }

    async def set_tokens(
        self,
        access_token: str,
        refresh_token: str,
        user_id: Optional[str] = None,
    ) -> None:
        """Configura tokens desde BD (sin flujo OAuth)."""
        self._access_token = access_token
        self._refresh_token = refresh_token
        self._user_id = user_id
        self._token_expires_at = datetime.now() + timedelta(hours=6)

    # ── Internal token management ─────────────────────────────────────────────

    def _store_tokens(self, data: Dict[str, Any]) -> None:
        self._access_token = data["access_token"]
        self._refresh_token = data.get("refresh_token")
        self._user_id = str(data.get("user_id", ""))
        self._token_expires_at = datetime.now() + timedelta(
            seconds=data.get("expires_in", 21600)
        )

    async def _ensure_token_valid(self) -> None:
        if self.is_sandbox and self.test_access_token:
            self._access_token = self.test_access_token
            return
        if not self._access_token:
            raise ValueError("Not authenticated. Call exchange_code() or set_tokens() first.")
        if self._token_expires_at and datetime.now() >= self._token_expires_at:
            await self._refresh_access_token()

    async def _refresh_access_token(self) -> None:
        if not self._refresh_token:
            raise ValueError("No refresh token available")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.mercadolibre.com/oauth/token",
                json={
                    "grant_type": "refresh_token",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self._refresh_token,
                },
            ) as resp:
                data = await resp.json()
                self._store_tokens(data)
                logger.info("ML access token refreshed")

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._access_token}"}

    # ── Public API methods ────────────────────────────────────────────────────

    async def get_user_info(self) -> Dict[str, Any]:
        """GET /users/me"""
        await self._ensure_token_valid()
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/users/me",
                headers=self._auth_headers(),
            ) as resp:
                return await resp.json()

    async def get_items(
        self,
        user_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[str]:
        """GET /users/{id}/items/search — retorna lista de item_ids."""
        await self._ensure_token_valid()
        uid = user_id or self._user_id
        if not uid:
            raise ValueError("user_id required")
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/users/{uid}/items/search",
                headers=self._auth_headers(),
                params={"limit": limit, "offset": offset},
            ) as resp:
                data = await resp.json()
                return data.get("results", [])

    async def get_item_details(self, item_id: str) -> Dict[str, Any]:
        """GET /items/{item_id}"""
        await self._ensure_token_valid()
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/items/{item_id}",
                headers=self._auth_headers(),
            ) as resp:
                return await resp.json()

    async def get_orders(
        self,
        seller_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """GET /orders/search — status: paid | confirmed | cancelled"""
        await self._ensure_token_valid()
        sid = seller_id or self._user_id
        if not sid:
            raise ValueError("seller_id required")
        params: Dict[str, Any] = {"seller": sid, "limit": limit, "offset": offset}
        if status:
            params["order.status"] = status
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/orders/search",
                headers=self._auth_headers(),
                params=params,
            ) as resp:
                data = await resp.json()
                return data.get("results", [])

    async def get_order_details(self, order_id: str) -> Dict[str, Any]:
        """GET /orders/{order_id}"""
        await self._ensure_token_valid()
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/orders/{order_id}",
                headers=self._auth_headers(),
            ) as resp:
                return await resp.json()

    async def get_questions(
        self,
        item_id: Optional[str] = None,
        seller_id: Optional[str] = None,
        status: str = "UNANSWERED",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """GET /questions/search — status: UNANSWERED | ANSWERED"""
        await self._ensure_token_valid()
        params: Dict[str, Any] = {"status": status, "limit": limit}
        if item_id:
            params["item"] = item_id
        if seller_id or self._user_id:
            params["seller_id"] = seller_id or self._user_id
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self._get_base_url()}/questions/search",
                headers=self._auth_headers(),
                params=params,
            ) as resp:
                data = await resp.json()
                return data.get("questions", [])

    async def answer_question(self, question_id: int, text: str) -> Dict[str, Any]:
        """POST /answers"""
        await self._ensure_token_valid()
        if len(text) > 2000:
            raise ValueError("Answer too long (max 2000 chars)")
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self._get_base_url()}/answers",
                headers=self._auth_headers(),
                json={"question_id": question_id, "text": text},
            ) as resp:
                return await resp.json()


ml_integration = MercadoLibreIntegration()
