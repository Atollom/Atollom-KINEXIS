"""
SamanthaMemoryService — Vector memory persistence for Samantha.
Uses Google text-embedding-004 (768 dims) + Supabase pgvector.
Table: samantha_memories (migration 039)
"""

import asyncio
import logging
import os
from functools import partial
from typing import Any, Dict, List, Optional

from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SamanthaMemoryService:
    def __init__(self) -> None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.supabase: Client = create_client(url, key)
        self._embedding_model = "models/text-embedding-004"
        self._initialized = bool(url and key)

    # ── Embedding ─────────────────────────────────────────────────────────────

    def _embed_sync(self, text: str) -> List[float]:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY", ""))
        result = genai.embed_content(
            model=self._embedding_model,
            content=text,
            task_type="retrieval_document",
        )
        return result["embedding"]

    async def _embed(self, text: str) -> List[float]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, partial(self._embed_sync, text))

    # ── Save ─────────────────────────────────────────────────────────────────

    async def save_memory(
        self,
        tenant_id: str,
        user_id: str,
        content: str,
        importance: int = 5,
        tags: Optional[List[str]] = None,
        agent_source: Optional[str] = None,
        session_id: Optional[str] = None,
        summary: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Save a new memory with its embedding vector."""
        if not self._initialized:
            logger.warning("MemoryService: SUPABASE_SERVICE_ROLE_KEY not set — skipping save")
            return {}
        try:
            embedding = await self._embed(content)
            row = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "content": content,
                "importance": max(1, min(10, importance)),
                "tags": tags or [],
                "agent_source": agent_source or "samantha_chat",
                "session_id": session_id,
                "summary": summary,
                "embedding": embedding,
            }
            response = self.supabase.table("samantha_memories").insert(row).execute()
            return response.data[0] if response.data else {}
        except Exception as exc:
            logger.error("MemoryService.save_memory failed: %s", exc)
            return {}

    # ── Search (semantic) ─────────────────────────────────────────────────────

    async def search_memories(
        self,
        tenant_id: str,
        user_id: str,
        query: str,
        threshold: float = 0.7,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Semantic search using pgvector cosine similarity."""
        if not self._initialized:
            return []
        try:
            embedding = await self._embed(query)
            response = self.supabase.rpc(
                "match_samantha_memories",
                {
                    "query_embedding": embedding,
                    "p_tenant_id": tenant_id,
                    "p_user_id": user_id,
                    "match_threshold": threshold,
                    "match_count": limit,
                },
            ).execute()
            return response.data or []
        except Exception as exc:
            logger.warning("MemoryService.search_memories failed: %s", exc)
            return []

    # ── Boot sequence ─────────────────────────────────────────────────────────

    async def get_boot_memories(
        self,
        tenant_id: str,
        user_id: str,
        min_importance: int = 7,
    ) -> List[Dict[str, Any]]:
        """Load high-importance memories for session start (no embedding needed)."""
        if not self._initialized:
            return []
        try:
            response = self.supabase.rpc(
                "get_boot_memories",
                {
                    "p_tenant_id": tenant_id,
                    "p_user_id": user_id,
                    "min_importance": min_importance,
                },
            ).execute()
            return response.data or []
        except Exception as exc:
            logger.warning("MemoryService.get_boot_memories failed: %s", exc)
            return []

    # ── Update (soft-versioning) ──────────────────────────────────────────────

    async def update_memory(
        self,
        memory_id: str,
        new_content: str,
        importance: Optional[int] = None,
        tenant_id: Optional[str] = None,
        user_id: Optional[str] = None,
        agent_source: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Soft-update: mark old memory as superseded, insert new version.
        Preserves history via parent_id chain.
        """
        if not self._initialized:
            return {}
        try:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()

            # Fetch original to copy fields
            original = (
                self.supabase.table("samantha_memories")
                .select("*")
                .eq("id", memory_id)
                .single()
                .execute()
            )
            orig = original.data or {}

            # Mark old as superseded
            self.supabase.table("samantha_memories").update(
                {"superseded_at": now}
            ).eq("id", memory_id).execute()

            # Insert new version
            embedding = await self._embed(new_content)
            new_row = {
                "tenant_id": tenant_id or orig.get("tenant_id"),
                "user_id": user_id or orig.get("user_id"),
                "content": new_content,
                "importance": max(1, min(10, importance)) if importance else orig.get("importance", 5),
                "tags": orig.get("tags", []),
                "agent_source": agent_source or orig.get("agent_source", "samantha_chat"),
                "session_id": orig.get("session_id"),
                "parent_id": memory_id,
                "embedding": embedding,
            }
            response = self.supabase.table("samantha_memories").insert(new_row).execute()
            return response.data[0] if response.data else {}
        except Exception as exc:
            logger.error("MemoryService.update_memory failed: %s", exc)
            return {}

    # ── Search by tags ────────────────────────────────────────────────────────

    async def search_by_tags(
        self,
        tenant_id: str,
        user_id: str,
        tags: List[str],
    ) -> List[Dict[str, Any]]:
        """Exact tag match using GIN index (no embedding needed)."""
        if not self._initialized:
            return []
        try:
            response = (
                self.supabase.table("samantha_memories")
                .select("id, content, summary, importance, tags, event_timestamp")
                .eq("tenant_id", tenant_id)
                .eq("user_id", user_id)
                .is_("parent_id", None)
                .is_("superseded_at", None)
                .contains("tags", tags)
                .order("importance", desc=True)
                .limit(20)
                .execute()
            )
            return response.data or []
        except Exception as exc:
            logger.warning("MemoryService.search_by_tags failed: %s", exc)
            return []

    # ── Format for system prompt ──────────────────────────────────────────────

    @staticmethod
    def format_memory_context(
        boot_memories: List[Dict],
        relevant_memories: List[Dict],
    ) -> str:
        """Build a memory block to inject into the Samantha system prompt."""
        if not boot_memories and not relevant_memories:
            return ""

        lines = ["\nMEMORIA PERSISTENTE (recordar siempre):"]
        for m in boot_memories:
            summary = m.get("summary") or m.get("content", "")[:120]
            lines.append(f"  • [{m.get('importance', 5)}/10] {summary}")

        if relevant_memories:
            lines.append("\nCONTEXTO RELEVANTE (consulta actual):")
            for m in relevant_memories:
                summary = m.get("summary") or m.get("content", "")[:120]
                sim = m.get("similarity", 0)
                lines.append(f"  • [{sim:.0%}] {summary}")

        return "\n".join(lines)


# Module-level singleton
_memory_service: Optional[SamanthaMemoryService] = None


def get_memory_service() -> SamanthaMemoryService:
    global _memory_service
    if _memory_service is None:
        _memory_service = SamanthaMemoryService()
    return _memory_service
