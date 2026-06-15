"""Agent — Content Publisher (Meta: Facebook + Instagram posts/stories)"""
import logging
import os
import aiohttp
from src.utils.database import db

logger = logging.getLogger(__name__)

_GRAPH = "https://graph.facebook.com/v18.0"


async def _get_meta_creds(tenant_id: str) -> dict:
    creds = await db.fetch_one(
        "SELECT access_token, page_id, ig_user_id FROM meta_page_credentials WHERE tenant_id=$1", tenant_id
    )
    if creds:
        return dict(creds)
    return {
        "access_token": os.getenv("META_ACCESS_TOKEN", ""),
        "page_id": os.getenv("META_PAGE_ID", ""),
        "ig_user_id": os.getenv("META_IG_USER_ID", ""),
    }


class ContentPublisherAgent:
    name = "Content Publisher"

    async def execute(self, data: dict) -> dict:
        tenant_id = data.get("tenant_id")
        if not tenant_id:
            return {"success": False, "error": "tenant_id required", "data": {}}

        action = data.get("action", "publish")
        content_type = data.get("content_type", "post")
        platforms = data.get("platforms", ["facebook", "instagram"])

        try:
            if action == "publish":
                return await self._publish(tenant_id, data, platforms, content_type)
            elif action == "schedule":
                return await self._schedule(tenant_id, data)
            elif action == "delete":
                return await self._delete(tenant_id, data)
            else:
                return {"success": False, "error": f"Unknown action: {action}", "data": {}}
        except Exception as exc:
            logger.error("ContentPublisher failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}

    async def _publish(self, tenant_id: str, data: dict, platforms: list, content_type: str) -> dict:
        creds = await _get_meta_creds(tenant_id)
        caption = data.get("caption", "")
        media_url = data.get("media_url")
        token = creds.get("access_token", "")

        results = {}

        if "facebook" in platforms and creds.get("page_id") and token:
            payload = {"message": caption}
            if media_url:
                payload["link"] = media_url
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{_GRAPH}/{creds['page_id']}/feed",
                    params={"access_token": token},
                    json=payload,
                ) as resp:
                    body = await resp.json()
                    results["facebook"] = {"post_id": body.get("id"), "ok": resp.status in (200, 201)}
        else:
            results["facebook"] = {"ok": False, "reason": "no_credentials"}

        if "instagram" in platforms and creds.get("ig_user_id") and token and media_url:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{_GRAPH}/{creds['ig_user_id']}/media",
                    params={"access_token": token},
                    json={"image_url": media_url, "caption": caption},
                ) as resp:
                    body = await resp.json()
                    container_id = body.get("id")
                if container_id:
                    async with session.post(
                        f"{_GRAPH}/{creds['ig_user_id']}/media_publish",
                        params={"access_token": token},
                        json={"creation_id": container_id},
                    ) as resp2:
                        body2 = await resp2.json()
                        results["instagram"] = {"post_id": body2.get("id"), "ok": resp2.status in (200, 201)}
                else:
                    results["instagram"] = {"ok": False, "reason": "media_upload_failed"}
        elif "instagram" in platforms:
            results["instagram"] = {"ok": False, "reason": "media_url_required_for_instagram" if not media_url else "no_credentials"}

        row = await db.fetch_one(
            """INSERT INTO meta_posts (tenant_id, content_type, caption, media_url, platforms, status, published_at)
               VALUES ($1,$2,$3,$4,$5::jsonb,'published',NOW()) RETURNING id""",
            tenant_id, content_type, caption, media_url,
            __import__("json").dumps(results),
        )

        return {
            "success": any(r.get("ok") for r in results.values()),
            "data": {
                "post_db_id": str(row["id"]) if row else None,
                "content_type": content_type,
                "platforms": results,
            },
        }

    async def _schedule(self, tenant_id: str, data: dict) -> dict:
        scheduled_at = data.get("scheduled_at")
        if not scheduled_at:
            return {"success": False, "error": "scheduled_at required", "data": {}}
        row = await db.fetch_one(
            """INSERT INTO meta_posts (tenant_id, content_type, caption, media_url, platforms, status, scheduled_at)
               VALUES ($1,$2,$3,$4,$5::jsonb,'scheduled',$6) RETURNING id""",
            tenant_id,
            data.get("content_type", "post"),
            data.get("caption", ""),
            data.get("media_url"),
            __import__("json").dumps(data.get("platforms", ["facebook"])),
            scheduled_at,
        )
        return {"success": True, "data": {"post_id": str(row["id"]) if row else None, "scheduled_at": scheduled_at}}

    async def _delete(self, tenant_id: str, data: dict) -> dict:
        post_id = data.get("post_id")
        if not post_id:
            return {"success": False, "error": "post_id required", "data": {}}
        await db.execute(
            "UPDATE meta_posts SET status='deleted' WHERE id=$1 AND tenant_id=$2",
            post_id, tenant_id,
        )
        return {"success": True, "data": {"post_id": str(post_id), "status": "deleted"}}


content_publisher = ContentPublisherAgent()
