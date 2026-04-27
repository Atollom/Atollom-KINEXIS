"""
PostgreSQL async helper using asyncpg connection pool.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import asyncpg

logger = logging.getLogger(__name__)


class Database:
    """
    Thin wrapper around asyncpg for safe, typed queries.

    Usage:
        await db.connect()            # once on app startup
        row  = await db.fetch_one(sql, arg1, arg2)
        rows = await db.fetch_all(sql, arg1)
        await db.execute(sql, arg1)
        async with db.transaction() as conn:
            await conn.execute(...)
        await db.disconnect()         # on shutdown
    """

    def __init__(self, dsn: str | None = None):
        self._dsn = dsn or os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/kinexis",
        )
        self.pool: Optional[asyncpg.Pool] = None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self, min_size: int = 2, max_size: int = 10) -> None:
        """Creates the connection pool. Call once at application startup."""
        if self.pool:
            return
        try:
            self.pool = await asyncpg.create_pool(
                self._dsn,
                min_size=min_size,
                max_size=max_size,
                command_timeout=30,
            )
            logger.info("Database pool created")
        except Exception as exc:
            logger.error(f"Failed to create database pool: {exc}")
            raise

    async def disconnect(self) -> None:
        """Closes the connection pool gracefully."""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database pool closed")

    # ── Queries ───────────────────────────────────────────────────────────────

    async def execute(self, query: str, *args: Any) -> str:
        """
        Runs a write query (INSERT / UPDATE / DELETE).

        Returns the status string, e.g. "INSERT 0 1".
        """
        await self._ensure_connected()
        async with self.pool.acquire() as conn:  # type: ignore[union-attr]
            return await conn.execute(query, *args)

    async def fetch_one(self, query: str, *args: Any) -> Optional[Dict[str, Any]]:
        """
        Runs a SELECT and returns the first row as a dict, or None.
        """
        await self._ensure_connected()
        async with self.pool.acquire() as conn:  # type: ignore[union-attr]
            row = await conn.fetchrow(query, *args)
            return dict(row) if row else None

    async def fetch_all(self, query: str, *args: Any) -> List[Dict[str, Any]]:
        """
        Runs a SELECT and returns all rows as a list of dicts.
        """
        await self._ensure_connected()
        async with self.pool.acquire() as conn:  # type: ignore[union-attr]
            rows = await conn.fetch(query, *args)
            return [dict(r) for r in rows]

    async def fetch_val(self, query: str, *args: Any) -> Any:
        """
        Returns a single scalar value (first column of first row).
        Useful for COUNT(*), EXISTS, etc.
        """
        await self._ensure_connected()
        async with self.pool.acquire() as conn:  # type: ignore[union-attr]
            return await conn.fetchval(query, *args)

    # ── Transactions ──────────────────────────────────────────────────────────

    @asynccontextmanager
    async def transaction(self):
        """
        Async context manager that wraps work in a DB transaction.

        Usage:
            async with db.transaction() as conn:
                await conn.execute("INSERT ...", ...)
                await conn.execute("UPDATE ...", ...)
        """
        await self._ensure_connected()
        async with self.pool.acquire() as conn:  # type: ignore[union-attr]
            async with conn.transaction():
                yield conn

    # ── Health ────────────────────────────────────────────────────────────────

    async def ping(self) -> bool:
        """Returns True if the database is reachable."""
        try:
            await self._ensure_connected()
            val = await self.fetch_val("SELECT 1")
            return val == 1
        except Exception:
            return False

    # ── Private ───────────────────────────────────────────────────────────────

    async def _ensure_connected(self) -> None:
        if not self.pool:
            await self.connect()


# Singleton — import and use everywhere
db = Database()
