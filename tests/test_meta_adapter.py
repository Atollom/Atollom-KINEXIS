# tests/test_meta_adapter.py
import pytest
import respx
import httpx
from unittest.mock import AsyncMock, MagicMock
from src.adapters.meta_adapter import MetaAdapter

@pytest.fixture
def mock_db():
    client = MagicMock()
    # Mock para Vault secrets
    client.get_vault_secrets = AsyncMock(return_value={
        "meta_whatsapp_token": "valid_token",
        "meta_phone_number_id": "phone_123",
        "meta_app_secret": "meta_secret"
    })
    return client

@pytest.fixture
def adapter(mock_db):
    return MetaAdapter(tenant_id="tenant-kap", db_client=mock_db)

@pytest.mark.asyncio
async def test_whatsapp_mock_mode_sin_vault_key(mock_db):
    # Forzar que no haya llaves
    mock_db.get_vault_secrets = AsyncMock(side_effect=Exception("No key"))
    adapter = MetaAdapter(tenant_id="tenant-kap", db_client=mock_db)
    
    result = await adapter.send_whatsapp("521234567890", "Hola")
    # En Mock mode debe retornar True (éxito simulado)
    assert result is True

@pytest.mark.asyncio
async def test_whatsapp_enviado_exitosamente_con_vault(adapter):
    with respx.mock:
        respx.post("https://graph.facebook.com/v18.0/phone_123/messages").respond(200, json={"message_id": "wa_mid_1"})
        result = await adapter.send_whatsapp("521234567890", "Hola real")
        assert result is True

@pytest.mark.asyncio
async def test_webhook_firma_invalida_rechazada(adapter):
    payload = b'{"object": "whatsapp"}'
    signature = "sha256=wrong_signature"
    is_valid = await adapter.verify_webhook_signature(payload, signature)
    assert is_valid is False

@pytest.mark.asyncio
async def test_webhook_dispatcher_wa_message(adapter):
    payload = {
        "object": "whatsapp",
        "entry": [{
            "changes": [{
                "value": {"messages": [{"id": "m1"}]}
            }]
        }]
    }
    result = await adapter.handle_webhook(payload)
    assert result["agent"] == "WhatsApp Handler Agent"

@pytest.mark.asyncio
async def test_webhook_dispatcher_ig_dm(adapter):
    payload = {"object": "instagram", "entry": []}
    result = await adapter.handle_webhook(payload)
    assert result["router"] == "MetaRouter"
    assert result["status"] == "dispatched"

@pytest.mark.asyncio
async def test_webhook_empty_payload(adapter):
    payload = {"object": "unknown", "entry": []}
    result = await adapter.handle_webhook(payload)
    assert result["status"] == "ignored"
    assert result["reason"] == "empty_entry"
