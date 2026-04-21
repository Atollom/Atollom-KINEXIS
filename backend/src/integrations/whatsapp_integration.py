"""
WhatsApp Cloud API Integration
Sandbox: Test Phone Numbers (5 free per WABA)
Production: Production Phone Number
Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
"""

import logging
import os
import re
from typing import Any, Dict, List, Optional

import aiohttp

from .base_integration import BaseIntegration

logger = logging.getLogger(__name__)

_PHONE_STRIP = re.compile(r"[^\d+]")


class WhatsAppIntegration(BaseIntegration):
    """
    Cliente WhatsApp Cloud API v18.

    Endpoints principales:
      POST /{phone_number_id}/messages  — enviar mensaje/media/template
      GET  /{phone_number_id}           — info del numero
      GET  /webhook                     — verificacion
    """

    def _get_sandbox_url(self) -> str:
        return "https://graph.facebook.com/v18.0"

    def _get_production_url(self) -> str:
        return "https://graph.facebook.com/v18.0"

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        cfg = config or {}
        self.access_token = cfg.get("access_token") or os.getenv("META_ACCESS_TOKEN")
        self.phone_number_id = cfg.get("phone_number_id") or os.getenv("META_PHONE_NUMBER_ID")
        self.business_account_id = cfg.get("business_account_id") or os.getenv("META_WHATSAPP_BUSINESS_ACCOUNT_ID")
        self.verify_token = cfg.get("verify_token") or os.getenv("META_VERIFY_TOKEN")

    def _get_headers(self) -> Dict[str, str]:
        headers = super()._get_headers()
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers

    def _messages_url(self) -> str:
        return f"{self._get_base_url()}/{self.phone_number_id}/messages"

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _normalize_phone(self, phone: str) -> str:
        """Devuelve numero sin '+' en formato E.164 (ej: 522221234567)."""
        clean = _PHONE_STRIP.sub("", phone).lstrip("+")
        if len(clean) == 10:
            clean = f"52{clean}"
        return clean

    def _extract_message_id(self, data: Dict[str, Any]) -> Optional[str]:
        messages = data.get("messages", [])
        return messages[0].get("id") if messages else None

    # ── Connection test ───────────────────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """GET /{phone_number_id} para verificar credenciales."""
        if not all([self.access_token, self.phone_number_id]):
            return {"success": False, "provider": "WhatsApp", "message": "Missing credentials"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self._get_base_url()}/{self.phone_number_id}",
                    headers=self._get_headers(),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "success": True,
                            "provider": "WhatsApp",
                            "message": f"Connected to {data.get('display_phone_number')}",
                            "mode": "SANDBOX" if self.is_sandbox else "PRODUCTION",
                            "phone": data.get("display_phone_number"),
                        }
                    return {"success": False, "provider": "WhatsApp", "message": f"HTTP {resp.status}"}
        except Exception as e:
            logger.error(f"WhatsApp connection test failed: {e}")
            return {"success": False, "provider": "WhatsApp", "message": str(e)}

    # ── Messaging ─────────────────────────────────────────────────────────────

    async def send_message(
        self,
        to: str,
        message: str,
        preview_url: bool = False,
    ) -> Dict[str, Any]:
        """Enviar mensaje de texto plano."""
        to_clean = self._normalize_phone(to)
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_clean,
            "type": "text",
            "text": {"preview_url": preview_url, "body": message},
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._messages_url(), headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {
                        "success": True,
                        "message_id": self._extract_message_id(data),
                        "to": to_clean,
                    }
                return {
                    "success": False,
                    "error": data.get("error", {}).get("message", "Unknown error"),
                }

    async def send_template(
        self,
        to: str,
        template_name: str,
        language: str = "es_MX",
        components: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Enviar mensaje con template aprobado por Meta."""
        to_clean = self._normalize_phone(to)
        template_payload: Dict[str, Any] = {
            "name": template_name,
            "language": {"code": language},
        }
        if components:
            template_payload["components"] = components

        payload = {
            "messaging_product": "whatsapp",
            "to": to_clean,
            "type": "template",
            "template": template_payload,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._messages_url(), headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "message_id": self._extract_message_id(data)}
                return {"success": False, "error": data.get("error", {}).get("message")}

    async def send_media(
        self,
        to: str,
        media_type: str,
        media_url: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Enviar archivo multimedia.

        Args:
            media_type: image | video | document | audio
            media_url: URL publica del archivo
            caption: Solo para image/video
        """
        to_clean = self._normalize_phone(to)
        media_obj: Dict[str, Any] = {"link": media_url}
        if caption and media_type in ("image", "video"):
            media_obj["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "to": to_clean,
            "type": media_type,
            media_type: media_obj,
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self._messages_url(), headers=self._get_headers(), json=payload
            ) as resp:
                data = await resp.json()
                if resp.status == 200:
                    return {"success": True, "message_id": self._extract_message_id(data)}
                return {"success": False, "error": data.get("error", {}).get("message")}

    # ── Webhook ───────────────────────────────────────────────────────────────

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Verifica handshake inicial del webhook de Meta."""
        if mode == "subscribe" and token == self.verify_token:
            return challenge
        return None


whatsapp_integration = WhatsAppIntegration()
