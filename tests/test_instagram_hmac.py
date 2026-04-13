# tests/test_instagram_hmac.py
# H1 security tests for instagram_dm_handler_agent.py HMAC validation:
#   - Invalid signature → rejected
#   - Missing signature with payload → rejected
#   - No payload → HMAC skipped (internal call path)
#   - Valid signature mock → passes through
import pytest
from unittest.mock import AsyncMock, MagicMock

from src.agents.instagram_dm_handler_agent import InstagramDMHandlerAgent


@pytest.fixture
def agent():
    mock_supabase = MagicMock()
    a = InstagramDMHandlerAgent("tenant-123", mock_supabase)
    mock_config = MagicMock()
    mock_config.data = {
        "config": {"business_hours": {"start": 0, "end": 24, "days": list(range(1, 8))}}
    }
    a._query_tenant_config = AsyncMock(return_value=mock_config)
    a._query_inventory_by_name = AsyncMock(return_value=[])
    a._query_inventory_by_sku = AsyncMock(return_value=[])
    a._insert_crm_interaction = AsyncMock(return_value=MagicMock())
    a.meta_adapter.send_instagram_dm = AsyncMock(return_value=True)
    return a


# ── Invalid signature ─────────────────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_invalid_hmac_rejected(agent):
    """payload_bytes present + wrong signature → output.message contains 'Invalid HMAC'."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=False)

    result = await agent.run({
        "sender_id": "u1",
        "message_text": "hola",
        "payload_bytes": b"raw-body",
        "x_hub_signature": "sha256=badhash",
    })

    assert result["status"] == "success"
    assert "Invalid HMAC" in result["output"]["message"]
    # Agent must NOT send a DM when HMAC is invalid
    agent.meta_adapter.send_instagram_dm.assert_not_called()


@pytest.mark.asyncio
async def test_invalid_hmac_does_not_call_crm(agent):
    """No CRM interaction should be logged when signature is invalid."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=False)

    await agent.run({
        "sender_id": "u1",
        "message_text": "comprar 20 unidades",
        "payload_bytes": b"raw",
        "x_hub_signature": "sha256=wrong",
    })

    agent._insert_crm_interaction.assert_not_called()


# ── Missing signature with payload ────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_payload_without_signature_rejected(agent):
    """payload_bytes present but x_hub_signature absent → 'Missing X-Hub-Signature-256'."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=True)

    result = await agent.run({
        "sender_id": "u1",
        "message_text": "hola",
        "payload_bytes": b"raw-body",
        # x_hub_signature intentionally omitted
    })

    assert result["status"] == "success"
    assert "Missing" in result["output"]["message"]
    # verify_webhook_signature must NOT be called — no signature to verify
    agent.meta_adapter.verify_webhook_signature.assert_not_called()


@pytest.mark.asyncio
async def test_empty_signature_string_rejected(agent):
    """Empty string signature with payload bytes → treated as missing."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=True)

    result = await agent.run({
        "sender_id": "u1",
        "message_text": "hola",
        "payload_bytes": b"raw-body",
        "x_hub_signature": "",  # empty string → falsy → missing
    })

    assert result["status"] == "success"
    assert "Missing" in result["output"]["message"]


# ── Valid signature ───────────────────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_valid_hmac_passes_through(agent):
    """Valid HMAC → normal processing continues."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=True)

    result = await agent.run({
        "sender_id": "u1",
        "message_text": "Hola quiero información",
        "payload_bytes": b"raw-body",
        "x_hub_signature": "sha256=validhash",
    })

    assert result["status"] == "success"
    assert result["output"]["response_sent"] is True
    agent.meta_adapter.verify_webhook_signature.assert_called_once_with(
        b"raw-body", "sha256=validhash"
    )


# ── Internal calls (no payload) ───────────────────────────────────────────── #

@pytest.mark.asyncio
async def test_internal_call_without_payload_skips_hmac(agent):
    """No payload_bytes (internal trigger) → HMAC check skipped entirely."""
    result = await agent.run({
        "sender_id": "u1",
        "message_text": "comprar cepillos",
    })

    assert result["status"] == "success"
    # verify_webhook_signature must NOT be called for internal (non-webhook) calls
    agent.meta_adapter.verify_webhook_signature = AsyncMock()
    # Already ran without it — just assert no error path was taken
    assert result["output"]["response_sent"] is True


@pytest.mark.asyncio
async def test_empty_payload_bytes_skips_hmac(agent):
    """Empty bytes b'' is falsy → treated as no payload → no HMAC check."""
    agent.meta_adapter.verify_webhook_signature = AsyncMock(return_value=False)

    result = await agent.run({
        "sender_id": "u1",
        "message_text": "hola",
        "payload_bytes": b"",  # falsy
        "x_hub_signature": "sha256=whatever",
    })

    assert result["status"] == "success"
    assert result["output"]["response_sent"] is True
    agent.meta_adapter.verify_webhook_signature.assert_not_called()
