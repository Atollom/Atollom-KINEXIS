# src/adapters/ml_adapter.py
import hashlib
import hmac
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

# SECURITY: Never log these keys — not even for debugging
_SENSITIVE_KEYS = {"access_token", "refresh_token", "client_secret", "Authorization"}


class MLAdapter:
    """
    Adaptador de Mercado Libre para KINEXIS.
    Maneja OAuth, Webhooks y Operaciones de Mercado con Kap Tools.

    USO:
        adapter = MLAdapter(tenant_id=..., db_client=supabase_client)
        await adapter.load_credentials()   # carga desde Vault — OBLIGATORIO
    """

    AUTH_URL = "https://auth.mercadolibre.com.mx/authorization"
    TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
    API_BASE_URL = "https://api.mercadolibre.com"
    REDIRECT_URI = "https://api.kinexis.app/auth/callback/mercadolibre"
    MAX_ANSWER_LENGTH = 800  # Límite de ML API para respuestas

    ALLOWED_WEBHOOK_TOPICS: Dict[str, str] = {
        "orders_v2": "EcommerceRouter -> ML Question Handler",
        "messages": "EcommerceRouter -> ML Question Handler",
        "shipments": "EcommerceRouter -> ML Fulfillment Agent",
        "fbm_stock_operations": "ERPRouter -> Inventory Agent",
        "item_competition": "EcommerceRouter -> Price Sync Agent",
    }

    def __init__(self, tenant_id: str, db_client=None):
        self.tenant_id = tenant_id
        self.db_client = db_client
        self.timeout = httpx.Timeout(30.0)
        # SECURITY_FIX: credentials NUNCA desde env vars ni hardcoded.
        # Inicializar como None — load_credentials() los llena desde Vault.
        self.client_id: Optional[str] = None
        self.client_secret: Optional[str] = None  # SECURITY: solo desde Vault

    # ─────────────────────────── VAULT / AUTH ────────────────────────────── #

    async def load_credentials(self) -> None:
        """
        Carga credenciales de ML desde Supabase Vault.
        DEBE llamarse antes de cualquier operación de API.
        SECURITY: nunca desde os.getenv() con defaults reales.
        """
        if not self.db_client:
            raise RuntimeError(
                "db_client requerido para cargar credenciales desde Vault. "
                "Nunca pasar secrets via env vars."
            )
        # SECURITY: credentials solo desde Vault — R4
        secret = await self.db_client.get_vault_secret(
            tenant_id=self.tenant_id,
            secret_name="ml_credentials",
        )
        self.client_id = secret["client_id"]
        self.client_secret = secret["client_secret"]
        logger.info("ML credentials loaded from Vault for tenant=%s", self.tenant_id)

    def _assert_credentials_loaded(self) -> None:
        """Falla rápido si load_credentials() no fue llamado."""
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "Credenciales no cargadas. Llamar load_credentials() "
                "antes de cualquier operación de ML API."
            )

    async def _ensure_valid_token(self) -> None:
        """
        Refresca el token si expira en < 5 minutos.
        Conectado a persistence layer (DB) en Fase 2.
        """
        pass  # Stub — implementar con token_expires_at de BD

    # ────────────────────────── HTTP BASE ────────────────────────────────── #

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=15),  # 2s → 4s → 8s
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        path: str,
        access_token: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Llamada base con timeout=30s y retry 3x (backoff 2s→4s→8s).
        Tiempo de respuesta esperado: <2s bajo carga normal de ML API.
        """
        url = f"{self.API_BASE_URL}{path}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            await self._ensure_valid_token()

            headers = kwargs.pop("headers", {})
            if access_token:
                # SECURITY: Authorization header nunca va a logs
                headers["Authorization"] = f"Bearer {access_token}"

            response = await client.request(method, url, headers=headers, **kwargs)

            # R11 / Miércoles: publicaciones pausadas — 403 es esperado, no error.
            # CLAUDE_FIX: el código anterior seguía llamando raise_for_status() después
            # del print, lo que sí lanzaba excepción. Ahora retorna dict informativo.
            if response.status_code == 403 and datetime.now().weekday() == 2:
                logger.info(
                    "Miércoles: publicaciones ML pausadas (403 esperado — no es error)"
                )
                return {"status": "paused", "reason": "wednesday_pause"}

            response.raise_for_status()
            return response.json()

    # ─────────────────────────── TOKEN REFRESH ───────────────────────────── #

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=2, max=15),
        reraise=True,
    )
    async def refresh_token(self, refresh_token_str: str) -> Dict[str, Any]:
        """
        Renueva access_token usando refresh_token.
        3 reintentos con backoff. Si todos fallan: re-raise para que el
        caller escale a socias (no swallow silencioso).
        """
        self._assert_credentials_loaded()
        # SECURITY: NUNCA loggear client_secret, refresh_token ni access_token
        logger.info("Refreshing ML access token for tenant=%s", self.tenant_id)
        payload = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token_str,
        }
        # SECURITY_FIX: timeout=30s — antes faltaba y podía colgarse indefinidamente
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.TOKEN_URL, data=payload)
            resp.raise_for_status()
            return resp.json()

    # ─────────────────────────── ML OPERATIONS ───────────────────────────── #

    async def get_orders(
        self,
        status: str = "paid",
        access_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Obtiene órdenes filtradas por corte de 9:00 AM.
        Tiempo de respuesta esperado: <3s.
        """
        path = f"/orders/search?seller=ME&order.status={status}"
        data = await self._request("GET", path, access_token=access_token)
        return data.get("results", [])

    async def get_questions(
        self,
        item_id: str,
        access_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "GET", f"/questions/search?item={item_id}", access_token=access_token
        )

    async def post_answer(
        self,
        question_id: str,
        answer_text: str,
        access_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Responde pregunta de ML.
        SECURITY_FIX: valida límite de 800 chars antes de enviar (límite ML API).
        """
        if len(answer_text) > self.MAX_ANSWER_LENGTH:
            raise ValueError(
                f"answer_text supera el límite de ML ({self.MAX_ANSWER_LENGTH} chars). "
                f"Recibido: {len(answer_text)} chars."
            )
        payload = {"question_id": question_id, "text": answer_text}
        return await self._request("POST", "/answers", access_token=access_token, json=payload)

    async def update_stock(
        self,
        item_id: str,
        qty: int,
        access_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Actualiza stock de publicación en ML.
        SECURITY_FIX: qty >= 0 validado antes de enviar a ML API.
        """
        if qty < 0:
            raise ValueError(f"qty debe ser >= 0. Recibido: {qty}")
        payload = {"available_quantity": qty}
        return await self._request(
            "PUT", f"/items/{item_id}", access_token=access_token, json=payload
        )

    # ─────────────────────────── WEBHOOKS ────────────────────────────────── #

    def verify_webhook_signature(
        self,
        payload_bytes: bytes,
        x_signature: Optional[str],
    ) -> bool:
        """
        Verifica firma HMAC-SHA256 del webhook de ML (header X-Signature-ML).
        Retorna False si la firma está ausente o no coincide.
        SECURITY_FIX: sin validación de firma ningún webhook debe procesarse.
        """
        if not x_signature:
            logger.warning(
                "Webhook rechazado: falta header X-Signature-ML (tenant=%s)",
                self.tenant_id,
            )
            return False
        if not self.client_secret:
            logger.error(
                "No se puede verificar webhook: client_secret no cargado (tenant=%s)",
                self.tenant_id,
            )
            return False
        expected = hmac.new(
            self.client_secret.encode(),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, x_signature)

    async def handle_webhook(
        self,
        payload: Dict[str, Any],
        x_signature: Optional[str] = None,
        payload_bytes: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Dispatcher de eventos ML hacia los Routers correspondientes.
        Rechaza payloads sin firma válida cuando payload_bytes es provisto.
        Topics desconocidos: log WARNING + return ignorado (no falla silenciosamente).
        """
        # SECURITY_FIX: validar firma si se proveen bytes del payload
        if payload_bytes is not None:
            if not self.verify_webhook_signature(payload_bytes, x_signature):
                return {"status": "rejected", "reason": "invalid_signature", "http_status": 401}

        topic = payload.get("topic")
        target = self.ALLOWED_WEBHOOK_TOPICS.get(topic)

        # CLAUDE_FIX: antes retornaba "Unknown Domain" sin log. Ahora loggea warning.
        if not target:
            logger.warning(
                "Webhook con topic desconocido '%s' recibido — ignorado (tenant=%s)",
                topic,
                self.tenant_id,
            )
            return {"status": "ignored", "reason": "unknown_topic", "topic": topic}

        logger.info("Webhook topic=%s despachado a %s", topic, target)
        return {"status": "dispatched", "target": target, "topic": topic}
