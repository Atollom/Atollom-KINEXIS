# src/adapters/meta_adapter.py
import hmac
import hashlib
import logging
import httpx
from typing import Dict, Any, Optional
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

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=2, min=2, max=10), reraise=True)
    async def send_whatsapp(self, to_number: str, message: str) -> bool:
        """
        Envía un mensaje de WhatsApp vía Meta Graph API.
        Implementa MOCK_MODE si no hay credenciales en Vault.
        """
        # 1. Intentar cargar credenciales de Vault
        try:
            secrets = await self.db_client.get_vault_secrets(self.tenant_id, ["meta_whatsapp_token", "meta_phone_number_id"])
            token = secrets.get("meta_whatsapp_token")
            phone_id = secrets.get("meta_phone_number_id")
        except Exception:
            token = None
            phone_id = None

        # 2. MOCK_MODE check (CLAUDE_LESSON: no crash if missing)
        if not token or not phone_id:
            logger.warning(
                "META_MOCK_MODE: Credenciales no encontradas para tenant %s. Simulando envío a %s",
                self.tenant_id, to_number
            )
            # Simulación de éxito para no bloquear flujo
            return True

        # 3. Envío real
        url = f"{self.GRAPH_API_URL}/{phone_id}/messages"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                logger.info("WhatsApp enviado a %s para tenant %s", to_number, self.tenant_id)
                return True
            except httpx.HTTPStatusError as e:
                logger.error("Error enviado WhatsApp: %s - %s", e.response.status_code, e.response.text)
                return False
            except Exception as e:
                logger.error("Error inesperado en MetaAdapter: %s", str(e))
                return False

    async def verify_webhook_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """
        Verifica la firma X-Hub-Signature-256 de Meta.
        """
        try:
            secrets = await self.db_client.get_vault_secrets(self.tenant_id, ["meta_app_secret"])
            app_secret = secrets.get("meta_app_secret")
        except Exception:
            app_secret = None

        if not app_secret:
            logger.warning("No se puede verificar webhook Meta: falta app_secret en Vault (tenant %s)", self.tenant_id)
            return False

        if signature.startswith("sha256="):
            signature = signature[7:]

        expected = hmac.new(
            app_secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    async def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatcher central de eventos Meta.
        """
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
        
        # Ejemplo: WA Message
        if value.get("messages"):
            return {"status": "dispatched", "router": "CRMRouter", "agent": "WhatsApp Handler Agent"}
        
        # Ejemplo: IG DM
        if payload.get("object") == "instagram":
             return {"status": "dispatched", "router": "MetaRouter", "agent": "Instagram Agent"}

        logger.warning("Evento Meta desconocido: %s", payload.get("object"))
        return {"status": "ignored", "reason": "unknown_event"}
