# tests/test_main.py
# H1 security tests for main.py:
#   - 401 without valid Bearer token
#   - 503 when AGENT_SECRET not configured
#   - 404 for unknown agent (no agent list leaked)
#   - 400 when tenant_id missing
#   - 200 happy path with mocked agent
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from src.main import app, AGENT_REGISTRY

VALID_SECRET = "test-secret-kinexis"
TENANT_ID = "40446806-0107-6201-9311-000000000001"


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {VALID_SECRET}"}


# ── Auth ──────────────────────────────────────────────────────────────────── #

def test_missing_bearer_returns_401(client):
    """No Authorization header → 401 (HTTPBearer)."""
    resp = client.post("/agents/whatsapp_handler/execute", json={})
    assert resp.status_code == 401


def test_invalid_bearer_returns_401(client, monkeypatch):
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    resp = client.post(
        "/agents/whatsapp_handler/execute",
        headers={"Authorization": "Bearer wrong-token"},
        json={"tenant_id": TENANT_ID, "payload": {}},
    )
    assert resp.status_code == 401
    assert "Invalid token" in resp.json()["detail"]


def test_missing_agent_secret_returns_503(client, monkeypatch):
    """When AGENT_SECRET env var is absent, service must fail closed."""
    monkeypatch.delenv("AGENT_SECRET", raising=False)
    resp = client.post(
        "/agents/whatsapp_handler/execute",
        headers={"Authorization": "Bearer anything"},
        json={"tenant_id": TENANT_ID, "payload": {}},
    )
    assert resp.status_code == 503
    # Must not expose config details
    assert "AGENT_SECRET" not in resp.text


# ── Routing ───────────────────────────────────────────────────────────────── #

def test_unknown_agent_returns_404_no_list(client, monkeypatch):
    """404 must NOT enumerate available agents (information disclosure)."""
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    resp = client.post(
        "/agents/nonexistent_agent/execute",
        headers={"Authorization": f"Bearer {VALID_SECRET}"},
        json={"tenant_id": TENANT_ID, "payload": {}},
    )
    assert resp.status_code == 404
    body = resp.json()
    assert "available_agents" not in body
    assert "available_agents" not in resp.text


def test_missing_tenant_id_returns_400(client, monkeypatch):
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    resp = client.post(
        "/agents/whatsapp_handler/execute",
        headers={"Authorization": f"Bearer {VALID_SECRET}"},
        json={"payload": {"message": "hola"}},
    )
    assert resp.status_code == 400
    assert "tenant_id" in resp.json()["detail"]


def test_tenant_id_must_be_string(client, monkeypatch):
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    resp = client.post(
        "/agents/whatsapp_handler/execute",
        headers={"Authorization": f"Bearer {VALID_SECRET}"},
        json={"tenant_id": 12345, "payload": {}},
    )
    assert resp.status_code == 400


# ── Happy path ────────────────────────────────────────────────────────────── #

def test_valid_request_dispatches_agent(client, monkeypatch):
    """Valid token + known agent + tenant_id → agent.run() called."""
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    monkeypatch.delenv("SUPABASE_URL", raising=False)  # run in mock mode

    mock_result = {"status": "success", "output": {"response_sent": True}}

    with patch.dict(
        AGENT_REGISTRY,
        {"whatsapp_handler": _make_mock_agent_class(mock_result)},
    ):
        resp = client.post(
            "/agents/whatsapp_handler/execute",
            headers={"Authorization": f"Bearer {VALID_SECRET}"},
            json={"tenant_id": TENANT_ID, "payload": {"message_text": "hola"}},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["tenant_id"] == TENANT_ID


def test_internal_error_not_exposed_to_caller(client, monkeypatch):
    """Agent exceptions must not leak internal stack traces to the response."""
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    monkeypatch.delenv("SUPABASE_URL", raising=False)

    with patch.dict(
        AGENT_REGISTRY,
        {"whatsapp_handler": _make_crashing_agent_class()},
    ):
        resp = client.post(
            "/agents/whatsapp_handler/execute",
            headers={"Authorization": f"Bearer {VALID_SECRET}"},
            json={"tenant_id": TENANT_ID, "payload": {}},
        )

    assert resp.status_code == 500
    body = resp.json()
    # Internal exception message must NOT be in response
    assert "Simulated DB crash" not in resp.text
    assert body["detail"] == "Agent execution error"


# ── Health ────────────────────────────────────────────────────────────────── #

def test_health_is_public(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert resp.json()["agents"] == len(AGENT_REGISTRY)


def test_list_agents_requires_auth(client, monkeypatch):
    monkeypatch.setenv("AGENT_SECRET", VALID_SECRET)
    resp = client.get("/agents")
    assert resp.status_code == 401


def test_registry_has_40_agents():
    """Sanity check: all concrete agent classes are registered."""
    assert len(AGENT_REGISTRY) == 40


# ── Helpers ───────────────────────────────────────────────────────────────── #

def _make_mock_agent_class(result: dict):
    class _MockAgent:
        def __init__(self, tenant_id, supabase_client=None):  # noqa: ARG002
            self.tenant_id = tenant_id

        async def run(self, _data):
            return result

    return _MockAgent


def _make_crashing_agent_class():
    class _CrashAgent:
        def __init__(self, tenant_id, supabase_client=None):  # noqa: ARG002
            self.tenant_id = tenant_id

        async def run(self, _data):
            raise RuntimeError("Simulated DB crash — secret token: xyz123")

    return _CrashAgent
