"""Agent — WhatsApp Business Cloud API"""
import logging
from src.integrations.whatsapp_integration import WhatsAppIntegration
from src.utils.database import db

logger = logging.getLogger(__name__)


async def _get_wa(tenant_id: str):
    creds = await db.fetch_one(
        "SELECT access_token, phone_number_id FROM whatsapp_credentials WHERE tenant_id=$1",
        tenant_id,
    )
    if creds:
        return WhatsAppIntegration({
            "access_token": creds["access_token"],
            "phone_number_id": creds["phone_number_id"],
        })
    return WhatsAppIntegration()


class WhatsAppAgent:
    name = "WhatsApp Agent"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "send")
        try:
            if action == "send":
                return await self._send(tenant_id, data)
            elif action == "reply":
                return await self._reply(tenant_id, data)
            elif action == "get_conversations":
                return await self._get_conversations(tenant_id, data)
            elif action == "receive":
                return await self._receive(tenant_id, data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("WhatsAppAgent failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _send(self, tenant_id: str, data: dict) -> dict:
        phone = data.get("phone", "")
        message = data.get("message", "")
        if not phone or not message:
            return {"success": False, "error": "phone and message required", "data": {}}

        wa = await _get_wa(tenant_id)
        result = await wa.send_text_message(phone, message)

        await db.execute(
            """INSERT INTO whatsapp_messages (tenant_id, phone, direction, message, status, created_at)
               VALUES ($1,$2,'outbound',$3,'sent',NOW())""",
            tenant_id, phone, message,
        )
        return {"success": result.get("success", False), "data": {"phone": phone, "status": "sent"}}

    async def _reply(self, tenant_id: str, data: dict) -> dict:
        phone = data.get("phone", "")
        message = data.get("message", "")
        message_id = data.get("message_id")
        if not phone or not message:
            return {"success": False, "error": "phone and message required", "data": {}}

        wa = await _get_wa(tenant_id)
        result = await wa.send_text_message(phone, message, reply_to_message_id=message_id)

        await db.execute(
            "INSERT INTO whatsapp_messages (tenant_id, phone, direction, message, status, created_at) VALUES ($1,$2,'outbound',$3,'sent',NOW())",
            tenant_id, phone, message,
        )
        return {"success": result.get("success", False), "data": {"phone": phone, "replied": True}}

    async def _get_conversations(self, tenant_id: str, data: dict) -> dict:
        limit = int(data.get("limit", 20))
        rows = await db.fetch_all(
            """SELECT phone, MAX(created_at) AS last_message_at, COUNT(*) AS message_count
               FROM whatsapp_messages WHERE tenant_id=$1
               GROUP BY phone ORDER BY last_message_at DESC LIMIT $2""",
            tenant_id, limit,
        )
        return {"success": True, "data": {"conversations": rows, "count": len(rows)}}

    async def _receive(self, tenant_id: str, data: dict) -> dict:
        phone = data.get("phone", "")
        message = data.get("message", "")
        wa_message_id = data.get("wa_message_id")

        await db.execute(
            """INSERT INTO whatsapp_messages (tenant_id, phone, direction, message, wa_message_id, status, created_at)
               VALUES ($1,$2,'inbound',$3,$4,'received',NOW())
               ON CONFLICT (wa_message_id) DO NOTHING""",
            tenant_id, phone, message, wa_message_id,
        )
        return {"success": True, "data": {"phone": phone, "stored": True}}


wa_agent = WhatsAppAgent()
