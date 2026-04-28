"""
Tests para SamanthaMemoryService.

Unit tests: mocked supabase + embeddings (sin BD real).
Integration tests: BD real (marcados @pytest.mark.integration — requieren env vars).

Para correr solo unit tests (CI):
    pytest tests/test_memory.py -v -m "not integration"

Para correr end-to-end (local, con .env cargado):
    pytest tests/test_memory.py -v

Prerequisito integration tests:
    Ejecutar primero el SQL de inserción del TEST 1 en Supabase.
"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.services.memory_service import SamanthaMemoryService

# ── Constants ─────────────────────────────────────────────────────────────────

TENANT_ID = "0ac40357-b96c-4a32-929e-ae810875d6b0"
SUPABASE_USER_ID = "0aea6e5b-021e-4bee-9575-d45f99c7e8b3"  # auth.uid() / JWT sub
USER_ID          = "c6be32de-381e-47a6-8108-ddd8d5d1f200"  # users.id (PK) — memory FK target

_HAS_SUPABASE = bool(
    os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)
_HAS_GOOGLE = bool(os.getenv("GOOGLE_API_KEY"))

skip_no_supabase = pytest.mark.skipif(
    not _HAS_SUPABASE,
    reason="SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
)
skip_no_google = pytest.mark.skipif(
    not _HAS_GOOGLE,
    reason="GOOGLE_API_KEY not set",
)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_supabase_mock(data=None):
    """Supabase client mock that returns data on .execute()."""
    execute_mock = MagicMock()
    execute_mock.data = data or []

    chain = MagicMock()
    chain.execute = MagicMock(return_value=execute_mock)
    chain.table = MagicMock(return_value=chain)
    chain.select = MagicMock(return_value=chain)
    chain.insert = MagicMock(return_value=chain)
    chain.update = MagicMock(return_value=chain)
    chain.eq    = MagicMock(return_value=chain)
    chain.is_   = MagicMock(return_value=chain)
    chain.contains = MagicMock(return_value=chain)
    chain.order = MagicMock(return_value=chain)
    chain.limit = MagicMock(return_value=chain)
    chain.single = MagicMock(return_value=chain)
    chain.rpc   = MagicMock(return_value=chain)
    return chain


MOCK_BOOT_MEMORIES = [
    {"id": "aaa", "content": "Usuario prefiere comunicación formal y concisa",
     "summary": None, "importance": 9, "tags": ["preferencia", "comunicación"]},
    {"id": "bbb", "content": "Cliente principal: Constructora ABC - ordenan taladros cada mes",
     "summary": None, "importance": 8, "tags": ["cliente", "patrón"]},
    {"id": "ccc", "content": "Stock crítico de TAL-003 siempre genera urgencia",
     "summary": None, "importance": 7, "tags": ["inventario", "urgencia"]},
]

MOCK_SEARCH_RESULTS = [
    {"id": "aaa", "content": "Usuario prefiere comunicación formal y concisa",
     "summary": None, "importance": 9, "tags": ["preferencia"],
     "similarity": 0.91, "event_timestamp": "2026-04-28T00:00:00Z"},
]

MOCK_EMBEDDING = [0.1] * 768


# ─────────────────────────────────────────────────────────────────────────────
# UNIT TESTS (mocked — no network required)
# ─────────────────────────────────────────────────────────────────────────────

class TestBootMemoriesUnit:
    @pytest.mark.asyncio
    async def test_returns_memories_above_threshold(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True

        rpc_chain = MagicMock()
        rpc_chain.execute = MagicMock(return_value=MagicMock(data=MOCK_BOOT_MEMORIES))
        svc.supabase = MagicMock()
        svc.supabase.rpc = MagicMock(return_value=rpc_chain)

        memories = await svc.get_boot_memories(TENANT_ID, USER_ID, min_importance=7)

        assert len(memories) == 3
        assert all(m["importance"] >= 7 for m in memories)
        svc.supabase.rpc.assert_called_once_with(
            "get_boot_memories",
            {"p_tenant_id": TENANT_ID, "p_user_id": USER_ID, "min_importance": 7},
        )

    @pytest.mark.asyncio
    async def test_returns_empty_when_not_initialized(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = False

        memories = await svc.get_boot_memories(TENANT_ID, USER_ID)
        assert memories == []

    @pytest.mark.asyncio
    async def test_returns_empty_on_exception(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True
        svc.supabase = MagicMock()
        svc.supabase.rpc = MagicMock(side_effect=Exception("db error"))

        memories = await svc.get_boot_memories(TENANT_ID, USER_ID)
        assert memories == []


class TestSearchMemoriesUnit:
    @pytest.mark.asyncio
    async def test_calls_rpc_with_embedding(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True
        svc._embedding_model = "models/embedding-001"

        rpc_chain = MagicMock()
        rpc_chain.execute = MagicMock(return_value=MagicMock(data=MOCK_SEARCH_RESULTS))
        svc.supabase = MagicMock()
        svc.supabase.rpc = MagicMock(return_value=rpc_chain)

        with patch.object(svc, "_embed", new=AsyncMock(return_value=MOCK_EMBEDDING)):
            results = await svc.search_memories(TENANT_ID, USER_ID, "comunicación")

        assert len(results) == 1
        assert results[0]["similarity"] == 0.91
        svc.supabase.rpc.assert_called_once()
        call_args = svc.supabase.rpc.call_args[0]
        assert call_args[0] == "match_samantha_memories"
        assert call_args[1]["query_embedding"] == MOCK_EMBEDDING

    @pytest.mark.asyncio
    async def test_returns_empty_when_not_initialized(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = False

        results = await svc.search_memories(TENANT_ID, USER_ID, "anything")
        assert results == []

    @pytest.mark.asyncio
    async def test_returns_empty_on_exception(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True
        svc.supabase = MagicMock()
        svc.supabase.rpc = MagicMock(side_effect=RuntimeError("connection refused"))

        with patch.object(svc, "_embed", new=AsyncMock(return_value=MOCK_EMBEDDING)):
            results = await svc.search_memories(TENANT_ID, USER_ID, "anything")
        assert results == []


class TestSaveMemoryUnit:
    @pytest.mark.asyncio
    async def test_saves_with_embedding(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True
        svc._embedding_model = "models/embedding-001"

        inserted = {"id": "new-uuid", "content": "test content", "importance": 8}
        insert_chain = MagicMock()
        insert_chain.execute = MagicMock(return_value=MagicMock(data=[inserted]))

        table_mock = MagicMock()
        table_mock.insert = MagicMock(return_value=insert_chain)
        svc.supabase = MagicMock()
        svc.supabase.table = MagicMock(return_value=table_mock)

        with patch.object(svc, "_embed", new=AsyncMock(return_value=MOCK_EMBEDDING)):
            result = await svc.save_memory(
                TENANT_ID, USER_ID, "test content", importance=8, tags=["test"]
            )

        assert result["id"] == "new-uuid"
        call_kwargs = table_mock.insert.call_args[0][0]
        assert call_kwargs["embedding"] == MOCK_EMBEDDING
        assert call_kwargs["importance"] == 8
        assert call_kwargs["tags"] == ["test"]

    @pytest.mark.asyncio
    async def test_clamps_importance(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True

        captured = {}
        insert_chain = MagicMock()
        insert_chain.execute = MagicMock(return_value=MagicMock(data=[{}]))
        table_mock = MagicMock()
        def capture_insert(row):
            captured.update(row)
            return insert_chain
        table_mock.insert = MagicMock(side_effect=capture_insert)
        svc.supabase = MagicMock()
        svc.supabase.table = MagicMock(return_value=table_mock)

        with patch.object(svc, "_embed", new=AsyncMock(return_value=MOCK_EMBEDDING)):
            await svc.save_memory(TENANT_ID, USER_ID, "x", importance=99)
        assert captured["importance"] == 10

        with patch.object(svc, "_embed", new=AsyncMock(return_value=MOCK_EMBEDDING)):
            await svc.save_memory(TENANT_ID, USER_ID, "x", importance=-5)
        assert captured["importance"] == 1


class TestFormatMemoryContext:
    def test_empty_when_no_memories(self):
        result = SamanthaMemoryService.format_memory_context([], [])
        assert result == ""

    def test_includes_boot_memories(self):
        result = SamanthaMemoryService.format_memory_context(MOCK_BOOT_MEMORIES[:1], [])
        assert "MEMORIA PERSISTENTE" in result
        assert "formal y concisa" in result

    def test_includes_relevant_memories(self):
        result = SamanthaMemoryService.format_memory_context([], MOCK_SEARCH_RESULTS)
        assert "CONTEXTO RELEVANTE" in result
        assert "91%" in result

    def test_uses_summary_when_available(self):
        mem = [{"summary": "resumen corto", "content": "contenido largo " * 20,
                "importance": 8, "similarity": 0.85}]
        result = SamanthaMemoryService.format_memory_context([], mem)
        assert "resumen corto" in result
        assert "contenido largo" not in result


class TestSearchByTagsUnit:
    @pytest.mark.asyncio
    async def test_queries_with_tags(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = True

        chain = _make_supabase_mock(data=MOCK_BOOT_MEMORIES[:1])
        svc.supabase = MagicMock()
        svc.supabase.table = MagicMock(return_value=chain)

        results = await svc.search_by_tags(TENANT_ID, USER_ID, ["preferencia"])
        assert len(results) == 1

    @pytest.mark.asyncio
    async def test_returns_empty_when_not_initialized(self):
        svc = SamanthaMemoryService.__new__(SamanthaMemoryService)
        svc._initialized = False

        results = await svc.search_by_tags(TENANT_ID, USER_ID, ["any"])
        assert results == []


# ─────────────────────────────────────────────────────────────────────────────
# INTEGRATION TESTS (real Supabase + Google API — skip when env vars absent)
# Prerequisito: ejecutar el SQL del TEST 1 en Supabase antes de correr estos.
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@skip_no_supabase
async def test_boot_memories():
    """Integration: real DB — expects TEST 1 SQL to have been run."""
    service = SamanthaMemoryService()

    memories = await service.get_boot_memories(
        tenant_id=TENANT_ID,
        user_id=USER_ID,
    )

    assert len(memories) > 0, "No boot memories found — did you run the TEST 1 SQL inserts?"
    assert all(m["importance"] >= 7 for m in memories)
    print(f"\n✅ Boot memories: {len(memories)}")
    for m in memories:
        print(f"   [{m['importance']}/10] {m.get('summary') or m['content'][:80]}")


@pytest.mark.asyncio
@skip_no_supabase
@skip_no_google
async def test_search_memories():
    """Integration: real DB + real embeddings — expects TEST 1 SQL to have been run."""
    service = SamanthaMemoryService()

    results = await service.search_memories(
        tenant_id=TENANT_ID,
        user_id=USER_ID,
        query="¿Cómo le gusta comunicarse al usuario?",
        threshold=0.6,  # slightly lower to tolerate embedding variability
    )

    assert len(results) > 0, "No search results — check embedding dimension or threshold"
    print(f"\n✅ Search results: {len(results)}")
    print(f"   Top result [{results[0].get('similarity', 0):.0%}]: {results[0]['content'][:80]}")


@pytest.mark.asyncio
@skip_no_supabase
@skip_no_google
async def test_save_and_retrieve_memory():
    """Integration: round-trip save → boot retrieve."""
    service = SamanthaMemoryService()

    saved = await service.save_memory(
        tenant_id=TENANT_ID,
        user_id=USER_ID,
        content="Test memory from pytest — puede borrarse",
        importance=7,
        tags=["test", "pytest"],
        agent_source="pytest",
    )

    assert saved.get("id"), f"Save failed: {saved}"
    print(f"\n✅ Saved memory id: {saved['id']}")

    # Verify it appears in boot sequence
    boot = await service.get_boot_memories(TENANT_ID, USER_ID, min_importance=7)
    ids = [m["id"] for m in boot]
    assert saved["id"] in ids, "Saved memory not found in boot sequence"
    print("✅ Memory found in boot sequence")
