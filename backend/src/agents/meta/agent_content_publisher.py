"""
Agente Content Publisher: Publicador de Contenido Multi-plataforma
Responsabilidad: Publicar y programar posts/stories/reels en Facebook e Instagram
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"publish", "schedule", "delete"}
VALID_CONTENT_TYPES = {"post", "story", "reel"}
VALID_PLATFORMS = {"facebook", "instagram"}
VALID_MEDIA_TYPES = {"image", "video", "carousel"}

# Post counter — Fase 2: from Meta API
_POST_COUNTER = 41


def _next_post_id(platform: str) -> str:
    global _POST_COUNTER
    _POST_COUNTER += 1
    prefix = "FB-POST" if platform == "facebook" else "IG-POST"
    return f"{prefix}-{_POST_COUNTER:03d}"


class AgentContentPublisher:
    """
    Content Publisher — Publicación y programación de contenido en Meta.

    Acciones:
      publish  → Publica inmediatamente en plataformas seleccionadas
      schedule → Programa publicación para fecha/hora futura
      delete   → Elimina post programado o publicado

    Tipos: post | story | reel

    Input:
        {
            "action":        str  — publish | schedule | delete
            "content_type":  str  — post | story | reel
            "platforms":     list — ["facebook", "instagram"]
            "content":       dict — {text, media, link}
            "scheduled_at":  str  — ISO timestamp (requerido para schedule)
            "post_id":       str  — (requerido para delete)
        }

    Output:
        {
            "action":          str
            "posts":           list[{platform, post_id, url, published_at}]
            "total_published": int
        }
    """

    REQUIRED_FIELDS = ["action", "content_type", "platforms"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Content Publisher"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publica, programa o elimina contenido."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} action={validated['action']} "
                f"type={validated['content_type']} platforms={validated['platforms']}"
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["action"] not in VALID_ACTIONS:
            raise ValueError(f"Invalid action. Valid: {VALID_ACTIONS}")

        if data["content_type"] not in VALID_CONTENT_TYPES:
            raise ValueError(f"Invalid content_type. Valid: {VALID_CONTENT_TYPES}")

        platforms = data["platforms"]
        if not isinstance(platforms, list) or len(platforms) == 0:
            raise ValueError("platforms must be a non-empty list")
        invalid = set(platforms) - VALID_PLATFORMS
        if invalid:
            raise ValueError(f"Invalid platforms: {invalid}. Valid: {VALID_PLATFORMS}")
        data["platforms"] = list(set(platforms))

        if data["action"] in {"publish", "schedule"}:
            content = data.get("content")
            if not content or not isinstance(content, dict):
                raise ValueError("content dict is required for publish/schedule")
            if not content.get("text") and not content.get("media"):
                raise ValueError("content must have text or media")

            media = content.get("media", [])
            if media:
                if not isinstance(media, list):
                    raise ValueError("content.media must be a list")
                for i, m in enumerate(media):
                    if not isinstance(m, dict):
                        raise ValueError(f"content.media[{i}] must be a dict")
                    if m.get("type") not in VALID_MEDIA_TYPES:
                        raise ValueError(f"content.media[{i}].type invalid. Valid: {VALID_MEDIA_TYPES}")
                    if not m.get("url"):
                        raise ValueError(f"content.media[{i}].url is required")

        if data["action"] == "schedule":
            if not data.get("scheduled_at"):
                raise ValueError("scheduled_at is required for schedule action")

        if data["action"] == "delete":
            if not data.get("post_id"):
                raise ValueError("post_id is required for delete action")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import httpx
        For Facebook: POST /page_id/feed (posts) or /page_id/photos
        For Instagram: POST /ig_user_id/media then /ig_user_id/media_publish
        """
        action = data["action"]
        platforms = data["platforms"]
        content_type = data["content_type"]
        now = datetime.now(timezone.utc)

        if action == "delete":
            return {
                "action": action,
                "post_id": data["post_id"],
                "status": "deleted",
                "deleted_at": now.isoformat(),
                "note": "Meta Graph API delete integration pending — Fase 2",
            }

        if action == "schedule":
            scheduled_at = data["scheduled_at"]
            posts = [
                {
                    "platform": p,
                    "post_id": None,
                    "url": None,
                    "status": "scheduled",
                    "scheduled_at": scheduled_at,
                }
                for p in platforms
            ]
            return {
                "action": action,
                "content_type": content_type,
                "posts": posts,
                "total_scheduled": len(posts),
                "scheduled_at": scheduled_at,
                "note": "Meta Graph API scheduling integration pending — Fase 2",
            }

        # publish
        posts = []
        for platform in platforms:
            post_id = _next_post_id(platform)
            domain = "facebook.com" if platform == "facebook" else "instagram.com"
            posts.append({
                "platform": platform,
                "post_id": post_id,
                "url": f"https://{domain}/p/{post_id}",
                "status": "published",
                "published_at": now.isoformat(),
            })

        return {
            "action": action,
            "content_type": content_type,
            "posts": posts,
            "total_published": len(posts),
            "note": "Meta Graph API publish integration pending — Fase 2",
        }


content_publisher = AgentContentPublisher()
