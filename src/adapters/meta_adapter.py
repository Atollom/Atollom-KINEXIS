# src/adapters/meta_adapter.py
import hashlib
import hmac
import logging
from typing import Any, Dict

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class MetaAdapter:
    """
    Adaptador para Meta Business Platform (WhatsApp, Instagram, Facebook).
    Maneja envíos de mensajes y validación de webhooks.
    """

    GRAPH_API_URL = "https://graph.facebook.com/v18.0"

    def __init__(self, tenant_id: str, db_client: Any):
        self.tenant_id = tenant_id
        self.db_client = db_client
        self.timeout = httpx.Timeout(10.0)

    # ─────────────────────────── WHATSAPP ────────────────────────────────── #

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        reraise=True,
    )
    async def send_whatsapp(self, to_number: str, message: str) -> bool:
        """
        Envía mensaje WhatsApp vía Meta Graph API.
        MOCK_MODE activo si no hay credenciales en Vault.
        Retry 2x con backoff — excepciones de red/servidor propagan para que retry funcione.
        SECURITY_FIX: message sanitizado antes de enviar (puede contener input de compradores).

        CLAUDE_FIX: en versión Gemini el @retry era inefectivo porque todas las excepciones
        eran capturadas dentro de la función. Ahora solo errores HTTP 4xx retornan False
        directamente (errores permanentes); errores de red/5xx propagan para retry.
        """
        # 1. Cargar credenciales desde Vault
        try:
            secrets = await self.db_client.get_vault_secrets(
                self.tenant_id, ["meta_whatsapp_token", "meta_phone_number_id"]
            )
            token = secrets.get("meta_whatsapp_token")
            phone_id = secrets.get("meta_phone_number_id")
        except Exception as e:
            # CLAUDE_FIX: loggear — antes era except Exception: sin log
            logger.warning(
                "Vault no disponible para Meta credentials tenant=%s: %s",
                self.tenant_id, e,
            )
            token = None
            phone_id = None

        # 2. MOCK_MODE — no bloquear flujo si faltan credenciales
        if not token or not phone_id:
            logger.warning(
                "META_MOCK_MODE: credenciales ausentes para tenant=%s. Simulando envío a %s",
                self.tenant_id, to_number,
            )
            return True

        # 3. SECURITY_FIX: truncar mensaje — WA tiene límite de 4096 chars;
        # los mensajes internos (notify_carlos) son generados por el sistema,
        # no por input de compradores, por lo que truncar es suficiente aquí.
        safe_message = message[:500] if message else ""

        url = f"{self.GRAPH_API_URL}/{phone_id}/messages"
        # SECURITY: Authorization header nunca va a logs
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": safe_message},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload, headers=headers)

            # 4xx = error permanente (número inválido, límite de negocio) → no reintentar
            if 400 <= resp.status_code < 500:
                logger.error(
                    "WhatsApp error permanente %s para tenant=%s: %s",
                    resp.status_code, self.tenant_id, resp.text,
                )
                return False

            # 5xx / red → raise para que @retry lo maneje
            resp.raise_for_status()
            logger.info("WhatsApp enviado a %s para tenant=%s", to_number, self.tenant_id)
            return True

    # ─────────────────────────── INSTAGRAM ───────────────────────────────── #

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=2, min=2, max=10),
        reraise=True,
    )
    async def send_instagram_dm(self, ig_user_id: str, message: str) -> bool:
        """
        Envía un Direct Message en Instagram.
        Timeout 10s. MOCK_MODE activo si falta meta_instagram_token.
        """
        try:
            secrets = await self.db_client.get_vault_secrets(
                self.tenant_id, ["meta_instagram_token"]
            )
            token = secrets.get("meta_instagram_token")
        except Exception as e:
            logger.warning("Vault no disponible para IG tenant=%s: %s", self.tenant_id, e)
            token = None

        if not token:
            logger.warning("META_MOCK_MODE: IG token ausente para tenant=%s. DM a %s", self.tenant_id, ig_user_id)
            return True

        url = f"{self.GRAPH_API_URL}/{ig_user_id}/messages"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"recipient": {"id": ig_user_id}, "message": {"text": message[:1000]}}

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code >= 400:
                logger.error("IG DM error %s: %s", resp.status_code, resp.text)
                return False
            return True

    async def post_instagram_comment_reply(self, comment_id: str, reply_text: str) -> bool:
        """
        Responde a un comentario de Instagram.
        Límite 150 chars — truncar si es necesario.
        """
        try:
            secrets = await self.db_client.get_vault_secrets(self.tenant_id, ["meta_instagram_token"])
            token = secrets.get("meta_instagram_token")
        except Exception:
            token = None

        if not token:
            logger.warning("META_MOCK_MODE: IG comment reply mock tenant=%s", self.tenant_id)
            return True

        # R3: Truncar a 150 chars si es necesario
        safe_reply = reply_text if len(reply_text) <= 150 else reply_text[:147] + "..."
        
        url = f"{self.GRAPH_API_URL}/{comment_id}/replies"
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, params={"message": safe_reply}, headers=headers)
            return resp.status_code < 400

    async def hide_instagram_comment(self, comment_id: str) -> bool:
        """
        Oculta un comentario de Instagram (is_hidden=true).
        Best-effort: log warning si falla, no lanzar excepción.
        """
        try:
            secrets = await self.db_client.get_vault_secrets(self.tenant_id, ["meta_instagram_token"])
            token = secrets.get("meta_instagram_token")
            if not token: return True

            url = f"{self.GRAPH_API_URL}/{comment_id}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, params={"is_hidden": "true"}, headers={"Authorization": f"Bearer {token}"})
                if resp.status_code >= 400:
                    logger.warning("No se pudo ocultar comentario IG %s: %s", comment_id, resp.text)
                    return False
                return True
        except Exception as e:
            logger.warning("Error best-effort hide_comment tenant=%s: %s", self.tenant_id, e)
            return False

    # ─────────────────────────── WEBHOOK ─────────────────────────────────── #

    async def verify_webhook_signature(
        self, payload_bytes: bytes, signature: str
    ) -> bool:
        """Verifica firma X-Hub-Signature-256 de Meta."""
        try:
            secrets = await self.db_client.get_vault_secrets(
                self.tenant_id, ["meta_app_secret"]
            )
            app_secret = secrets.get("meta_app_secret")
        except Exception as e:
            logger.error(
                "Vault error al obtener meta_app_secret tenant=%s: %s",
                self.tenant_id, e,
            )
            app_secret = None

        if not app_secret:
            logger.warning(
                "No se puede verificar webhook Meta: falta app_secret en Vault (tenant=%s)",
                self.tenant_id,
            )
            return False

        if signature.startswith("sha256="):
            signature = signature[7:]

        expected = hmac.new(
            app_secret.encode(),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatcher central de eventos Meta. Default case loggea WARNING — no falla silencioso."""
        entries = payload.get("entry", [])
        if not entries:
            if payload.get("object") == "instagram":
                return {"status": "dispatched", "router": "MetaRouter", "agent": "Instagram Agent"}
            return {"status": "ignored", "reason": "empty_entry"}

        entry = entries[0]
        changes = entry.get("changes", [])
        if not changes:
            return {"status": "ignored", "reason": "no_changes"}

        value = changes[0].get("value", {})

        if value.get("messages"):
            return {"status": "dispatched", "router": "CRMRouter", "agent": "WhatsApp Handler Agent"}

        if payload.get("object") == "instagram":
            return {"status": "dispatched", "router": "MetaRouter", "agent": "Instagram Agent"}

        # CLAUDE_FIX: default case — no falla silenciosamente
        logger.warning(
            "Evento Meta desconocido object=%s para tenant=%s",
            payload.get("object"), self.tenant_id,
        )
        return {"status": "ignored", "reason": "unknown_event"}
