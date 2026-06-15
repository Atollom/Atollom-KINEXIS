"""Agent — Facebook Messenger Graph API"""
import logging
import os
import aiohttp
from src.utils.database import db

logger = logging.getLogger(__name__)

_GRAPH = "https://graph.facebook.com/v18.0"


async def _get_token(tenant_id: str) -> str:
    creds = await db.fetch_one(
        "SELECT access_token FROM facebook_credentials WHERE tenant_id=$1", tenant_id
    )
    return creds["access_token"] if creds else os.getenv("META_ACCESS_TOKEN", "")


class FacebookAgent:
    name = "Facebook Agent"

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
            logger.error("FacebookAgent failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _send(self, tenant_id: str, data: dict) -> dict:
        fb_id = data.get("fb_id", "")
        message = data.get("message", "")
        quick_replies = data.get("quick_replies", [])
        if not fb_id or not message:
            return {"success": False, "error": "fb_id and message required", "data": {}}

        token = await _get_token(tenant_id)
        payload = {"recipient": {"id": fb_id}, "message": {"text": message}}
        if quick_replies:
            payload["message"]["quick_replies"] = [
                {"content_type": "text", "title": qr, "payload": qr.upper().replace(" ", "_")}
                for qr in quick_replies[:13]
            ]

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{_GRAPH}/me/messages",
                params={"access_token": token},
                json=payload,
            ) as resp:
                ok = resp.status in (200, 201)

        await db.execute(
            "INSERT INTO facebook_messages (tenant_id, fb_id, direction, message, status, created_at) VALUES ($1,$2,'outbound',$3,'sent',NOW())",
            tenant_id, fb_id, message,
        )
        return {"success": ok, "data": {"fb_id": fb_id, "status": "sent"}}

    async def _reply(self, tenant_id: str, data: dict) -> dict:
        return await self._send(tenant_id, data)

    async def _get_conversations(self, tenant_id: str, data: dict) -> dict:
        limit = int(data.get("limit", 20))
        rows = await db.fetch_all(
            "SELECT fb_id, direction, message, status, created_at FROM facebook_messages WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT $2",
            tenant_id, limit,
        )
        return {"success": True, "data": {"conversations": rows, "count": len(rows)}}

    async def _receive(self, tenant_id: str, data: dict) -> dict:
        fb_id = data.get("fb_id", "")
        message = data.get("message", "")
        await db.execute(
            "INSERT INTO facebook_messages (tenant_id, fb_id, direction, message, status, created_at) VALUES ($1,$2,'inbound',$3,'received',NOW())",
            tenant_id, fb_id, message,
        )
        return {"success": True, "data": {"stored": True}}


fb_agent = FacebookAgent()
