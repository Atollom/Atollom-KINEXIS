"""
SamanthaMemoryService — Persistent memory for Samantha.

Day 1 architecture (stable):
  - get_boot_memories()  → psycopg2 + DATABASE_URL (same as db_queries.py, bypasses Supabase RLS)
  - search_memories()    → disabled (returns [] — Day 2 feature once Google API is confirmed)
  - save_memory()        → Supabase service role (for writes from agents)

This means boot memories work as long as DATABASE_URL is set in Railway,
regardless of SUPABASE_SERVICE_ROLE_KEY or Google API key status.
"""

import asyncio
import logging
import os
from functools import partial
from typing import Any, Dict, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SamanthaMemoryService:
    def __init__(self) -> None:
        self._db_url = os.getenv("DATABASE_URL", "")

        supabase_url = os.getenv("SUPABASE_URL", "")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self._can_write = bool(supabase_url and supabase_key)
        if self._can_write:
            self.supabase: Optional[Client] = create_client(supabase_url, supabase_key)
        else:
            self.supabase = None

        # _initialized = can at least READ memories via DATABASE_URL
        self._initialized = bool(self._db_url)

        if not self._initialized:
            logger.warning("MemoryService: DATABASE_URL not set — memory features disabled")
        if not self._can_write:
            logger.warning("MemoryService: SUPABASE_SERVICE_ROLE_KEY not set — save_memory disabled")

    # ── Boot sequence (psycopg2 — no Supabase key needed) ────────────────────

    def _fetch_boot_memories_sync(
        self,
        tenant_id: str,
        user_id: str,
        min_importance: int,
    ) -> List[Dict[str, Any]]:
        conn = psycopg2.connect(self._db_url, cursor_factory=RealDictCursor)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, content, summary, importance, tags
                FROM samantha_memories
                WHERE tenant_id = %s
                  AND user_id   = %s
                  AND importance >= %s
                  AND parent_id   IS NULL
                  AND superseded_at IS NULL
                ORDER BY importance DESC, event_timestamp DESC
                LIMIT 20
                """,
                (tenant_id, user_id, min_importance),
            )
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    async def get_boot_memories(
        self,
        tenant_id: str,
        user_id: str,
        min_importance: int = 7,
    ) -> List[Dict[str, Any]]:
        """Load high-importance memories via direct DB (bypasses Supabase key/RLS)."""
        if not self._initialized:
            return []
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                partial(self._fetch_boot_memories_sync, tenant_id, user_id, min_importance),
            )
        except Exception as exc:
            logger.warning("MemoryService.get_boot_memories failed: %s", exc)
            return []

    # ── Semantic search (Day 2 — disabled until Google API confirmed) ─────────

    async def search_memories(
        self,
        tenant_id: str,
        user_id: str,
        query: str,
        threshold: float = 0.7,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Semantic search — disabled in Day 1; returns [] gracefully."""
        return []

    # ── Save (Supabase service role — for agent writes) ───────────────────────

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
        """Save a memory (no embedding for now — embedding column left NULL)."""
        if not self._can_write or self.supabase is None:
            logger.warning("MemoryService.save_memory: SUPABASE_SERVICE_ROLE_KEY not set")
            return {}
        try:
            row = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "content": content,
                "importance": max(1, min(10, importance)),
                "tags": tags or [],
                "agent_source": agent_source or "samantha_chat",
                "session_id": session_id,
                "summary": summary,
                # embedding intentionally omitted — NULL until Day 2
            }
            response = self.supabase.table("samantha_memories").insert(row).execute()
            return response.data[0] if response.data else {}
        except Exception as exc:
            logger.error("MemoryService.save_memory failed: %s", exc)
            return {}

    # ── Search by tags (psycopg2) ─────────────────────────────────────────────

    def _fetch_by_tags_sync(
        self, tenant_id: str, user_id: str, tags: List[str]
    ) -> List[Dict[str, Any]]:
        conn = psycopg2.connect(self._db_url, cursor_factory=RealDictCursor)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, content, summary, importance, tags, event_timestamp
                FROM samantha_memories
                WHERE tenant_id = %s
                  AND user_id   = %s
                  AND parent_id IS NULL
                  AND superseded_at IS NULL
                  AND tags @> %s
                ORDER BY importance DESC
                LIMIT 20
                """,
                (tenant_id, user_id, tags),
            )
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    async def search_by_tags(
        self,
        tenant_id: str,
        user_id: str,
        tags: List[str],
    ) -> List[Dict[str, Any]]:
        if not self._initialized:
            return []
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, partial(self._fetch_by_tags_sync, tenant_id, user_id, tags)
            )
        except Exception as exc:
            logger.warning("MemoryService.search_by_tags failed: %s", exc)
            return []

    # ── Seed (psycopg2 — no Supabase key needed) ─────────────────────────────

    def _seed_sync(
        self, tenant_id: str, user_id: str, memories: List[Dict]
    ) -> Dict:
        """Direct INSERT via psycopg2. Idempotent: skips if session_id='initial_seed' exists."""
        conn = psycopg2.connect(self._db_url, cursor_factory=RealDictCursor)
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM samantha_memories "
                "WHERE tenant_id = %s AND user_id = %s AND session_id = 'initial_seed'",
                (tenant_id, user_id),
            )
            if cur.fetchone()["cnt"] > 0:
                return {"skipped": True, "reason": "Initial seed already applied", "inserted": 0}

            inserted_ids = []
            for mem in memories:
                cur.execute(
                    """INSERT INTO samantha_memories
                           (tenant_id, user_id, content, summary, importance, tags,
                            agent_source, session_id)
                       VALUES (%s, %s, %s, %s, %s, %s, 'seed', 'initial_seed')
                       RETURNING id""",
                    (
                        tenant_id,
                        user_id,
                        mem["content"],
                        mem.get("summary"),
                        mem["importance"],
                        mem.get("tags", []),
                    ),
                )
                row = cur.fetchone()
                if row:
                    inserted_ids.append(str(row["id"]))
            conn.commit()
            return {"skipped": False, "inserted": len(inserted_ids), "ids": inserted_ids}
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    async def seed_initial_memories(
        self, tenant_id: str, user_id: str, memories: List[Dict]
    ) -> Dict:
        """Seed initial memories via direct DB write. Uses psycopg2 — no Supabase key needed."""
        if not self._initialized:
            return {"error": "DATABASE_URL not set", "inserted": 0}
        try:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None, partial(self._seed_sync, tenant_id, user_id, memories)
            )
        except Exception as exc:
            logger.error("MemoryService.seed_initial_memories failed: %s", exc)
            return {"error": str(exc), "inserted": 0}

    # ── Format for system prompt ──────────────────────────────────────────────

    @staticmethod
    def format_memory_context(
        boot_memories: List[Dict],
        relevant_memories: List[Dict],
    ) -> str:
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
