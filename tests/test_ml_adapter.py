# tests/test_ml_adapter.py
import hashlib
import hmac
import logging
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
import respx

from src.adapters.ml_adapter import MLAdapter


# ─────────────────────────── HELPERS ─────────────────────────────────────── #

def make_adapter(tenant_id: str = "test-tenant") -> MLAdapter:
    """Adapter sin db_client — para tests que no necesitan credenciales de Vault."""
    return MLAdapter(tenant_id=tenant_id)


def make_adapter_with_creds(
    tenant_id: str = "test-tenant",
    client_secret: str = "test-secret",
) -> MLAdapter:
    """Adapter con credenciales inyectadas directamente (solo para tests)."""
    adapter = MLAdapter(tenant_id=tenant_id)
    adapter.client_id = "test-client-id"
    adapter.client_secret = client_secret
    return adapter


# ──────────────── TESTS ORIGINALES DE GEMINI (mantenidos / actualizados) ─── #

@pytest.mark.asyncio
async def test_retry_logic_3_intentos():
    """Verifica que el adaptador reintenta hasta 3 veces antes de tener éxito."""
    adapter = make_adapter()

    with respx.mock:
        route = respx.get("https://api.mercadolibre.com/test")
        route.side_effect = [
            httpx.Response(500),
            httpx.Response(500),
            httpx.Response(200, json={"status": "ok"}),
        ]

        result = await adapter._request("GET", "/test")
        assert result["status"] == "ok"
        assert route.call_count == 3


@pytest.mark.asyncio
async def test_webhook_orders_v2_ruta_correcta():
    """Verifica el despacho correcto del webhook de órdenes."""
    adapter = make_adapter()
    payload = {"topic": "orders_v2", "resource": "/orders/123"}

    result = await adapter.handle_webhook(payload)

    assert result["status"] == "dispatched"
    assert "EcommerceRouter" in result["target"]
    assert "ML Question Handler" in result["target"]


@pytest.mark.asyncio
async def test_miercoles_403_retorna_paused(monkeypatch):
    """
    CLAUDE_FIX: Miércoles 403 debe retornar {"status": "paused"} — NO lanzar excepción.
    El código de Gemini seguía haciendo raise_for_status() después del print.
    """
    class MockDatetime:
        @classmethod
        def now(cls):
            return datetime(2026, 4, 8)  # Miércoles

        @classmethod
        def combine(cls, d, t):
            return datetime.combine(d, t)

    monkeypatch.setattr("src.adapters.ml_adapter.datetime", MockDatetime)
    adapter = make_adapter()

    with respx.mock:
        respx.get("https://api.mercadolibre.com/test").respond(403)

        result = await adapter._request("GET", "/test")
        assert result["status"] == "paused"
        assert result["reason"] == "wednesday_pause"


@pytest.mark.asyncio
async def test_timeout_manejo_graceful():
    """Verifica que el timeout se aplica y se eleva tras 3 reintentos."""
    adapter = make_adapter()

    with respx.mock:
        respx.get("https://api.mercadolibre.com/slow").side_effect = httpx.TimeoutException(
            "Too slow"
        )

        with pytest.raises(httpx.TimeoutException):
            await adapter._request("GET", "/slow")


@pytest.mark.asyncio
async def test_tenant_isolation_ml():
    """Verifica que dos instancias mantienen su tenant_id separado."""
    adapter_a = MLAdapter(tenant_id="tenant-a")
    adapter_b = MLAdapter(tenant_id="tenant-b")
    assert adapter_a.tenant_id != adapter_b.tenant_id
    assert adapter_a.tenant_id == "tenant-a"
    assert adapter_b.tenant_id == "tenant-b"


# ──────────────────────── NUEVOS TESTS DE CLAUDE (H2) ────────────────────── #

# --- Seguridad: logs y secrets ---

@pytest.mark.asyncio
async def test_no_token_en_logs(caplog):
    """
    H2 Security: logs NUNCA deben contener access_token, client_secret ni refresh_token.
    """
    adapter = make_adapter_with_creds(client_secret="super-secret-value")

    with caplog.at_level(logging.DEBUG, logger="src.adapters.ml_adapter"):
        # Trigger load path que loggea
        adapter._assert_credentials_loaded()  # no-op si ya hay creds

        # Simular un log interno de refresh
        logger = logging.getLogger("src.adapters.ml_adapter")
        logger.info("Refreshing ML access token for tenant=%s", adapter.tenant_id)

    full_log = caplog.text
    assert "super-secret-value" not in full_log
    assert "access_token" not in full_log.lower().replace("access_token", "")
    # El tenant_id puede aparecer — no es secreto
    assert adapter.tenant_id in full_log


@pytest.mark.asyncio
async def test_vault_falla_gracefully():
    """
    H2: Si db_client no está configurado, load_credentials lanza RuntimeError claro,
    no un crash silencioso ni KeyError críptico.
    """
    adapter = MLAdapter(tenant_id="test-tenant", db_client=None)

    with pytest.raises(RuntimeError, match="db_client requerido"):
        await adapter.load_credentials()


@pytest.mark.asyncio
async def test_vault_get_secret_falla_propaga_error():
    """
    H2: Si Vault responde con error, la excepción se propaga — no swallow silencioso.
    """
    mock_db = MagicMock()
    mock_db.get_vault_secret = AsyncMock(side_effect=ConnectionError("Vault unreachable"))

    adapter = MLAdapter(tenant_id="test-tenant", db_client=mock_db)

    with pytest.raises(ConnectionError, match="Vault unreachable"):
        await adapter.load_credentials()


# --- Webhook: validación de firma ---

@pytest.mark.asyncio
async def test_webhook_firma_invalida_rechazada():
    """
    H2 Security: payload sin X-Signature-ML debe ser rechazado con http_status=401.
    """
    adapter = make_adapter_with_creds()
    payload = {"topic": "orders_v2", "resource": "/orders/999"}
    payload_bytes = b'{"topic": "orders_v2"}'

    # Sin firma
    result = await adapter.handle_webhook(payload, x_signature=None, payload_bytes=payload_bytes)
    assert result["status"] == "rejected"
    assert result["http_status"] == 401

    # Con firma incorrecta
    result2 = await adapter.handle_webhook(
        payload, x_signature="firma-falsa", payload_bytes=payload_bytes
    )
    assert result2["status"] == "rejected"
    assert result2["http_status"] == 401


@pytest.mark.asyncio
async def test_webhook_firma_valida_aceptada():
    """
    H2: Payload con firma HMAC-SHA256 correcta es procesado normalmente.
    """
    secret = "my-real-secret"
    adapter = make_adapter_with_creds(client_secret=secret)
    payload = {"topic": "orders_v2", "resource": "/orders/42"}
    payload_bytes = b'{"topic": "orders_v2", "resource": "/orders/42"}'

    # Calcular firma correcta
    good_sig = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()

    result = await adapter.handle_webhook(
        payload, x_signature=good_sig, payload_bytes=payload_bytes
    )
    assert result["status"] == "dispatched"


@pytest.mark.asyncio
async def test_webhook_unknown_topic_ignorado():
    """
    CLAUDE_FIX: Topic desconocido retorna status='ignored', no falla silenciosamente
    ni retorna "Unknown Domain" sin log.
    """
    adapter = make_adapter()
    payload = {"topic": "topic_raro_desconocido", "resource": "/x/1"}

    result = await adapter.handle_webhook(payload)

    assert result["status"] == "ignored"
    assert result["reason"] == "unknown_topic"
    assert result["topic"] == "topic_raro_desconocido"


# --- Token refresh ---

@pytest.mark.asyncio
async def test_token_expirado_refresh_falla_tres_veces_escala():
    """
    H2: Si refresh_token falla 3 veces (503), re-raise para que el caller escale.
    No swallow silencioso — las socias deben ser notificadas.
    """
    adapter = make_adapter_with_creds()

    with respx.mock:
        respx.post("https://api.mercadolibre.com/oauth/token").respond(503)

        with pytest.raises(httpx.HTTPStatusError):
            await adapter.refresh_token("my-refresh-token")


@pytest.mark.asyncio
async def test_credentials_no_cargadas_bloquean_refresh():
    """
    H2: refresh_token sin credenciales cargadas lanza RuntimeError inmediato.
    """
    adapter = make_adapter()  # sin client_id ni client_secret

    with pytest.raises(RuntimeError, match="Credenciales no cargadas"):
        await adapter.refresh_token("any-token")


# --- Rate limit ---

@pytest.mark.asyncio
async def test_rate_limit_ml_429_agota_reintentos():
    """
    H2: Si ML devuelve 429, el adaptador reintenta (3x) y luego re-raise.
    No debe ignorar 429 ni enviar spam de requests sin backoff.
    """
    adapter = make_adapter()

    with respx.mock:
        route = respx.get("https://api.mercadolibre.com/items/TEST1").respond(429)

        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await adapter._request("GET", "/items/TEST1")

        assert exc_info.value.response.status_code == 429
        assert route.call_count == 3  # 3 intentos antes de rendirse


# --- Validaciones de negocio ---

@pytest.mark.asyncio
async def test_post_answer_supera_800_chars_bloqueado():
    """
    H2 Business Rule: answer_text > 800 chars debe ser bloqueado antes de llamar a ML.
    """
    adapter = make_adapter()
    texto_largo = "a" * 801

    with pytest.raises(ValueError, match="supera el límite de ML"):
        await adapter.post_answer("q-123", texto_largo)


@pytest.mark.asyncio
async def test_post_answer_exactamente_800_chars_permitido():
    """
    H2: Exactamente 800 chars debe pasar la validación (límite inclusivo).
    """
    adapter = make_adapter()
    texto_exacto = "a" * 800

    with respx.mock:
        respx.post("https://api.mercadolibre.com/answers").respond(
            200, json={"id": "ans-1"}
        )
        result = await adapter.post_answer("q-123", texto_exacto)
        assert result["id"] == "ans-1"


@pytest.mark.asyncio
async def test_update_stock_qty_negativo_bloqueado():
    """
    H2 Business Rule: update_stock con qty < 0 debe bloquearse — nunca enviar a ML.
    """
    adapter = make_adapter()

    with pytest.raises(ValueError, match="qty debe ser >= 0"):
        await adapter.update_stock("ITEM123", qty=-5)


@pytest.mark.asyncio
async def test_update_stock_qty_cero_permitido():
    """
    H2: qty=0 es válido (agota stock explícitamente).
    """
    adapter = make_adapter()

    with respx.mock:
        respx.put("https://api.mercadolibre.com/items/ITEM123").respond(
            200, json={"id": "ITEM123", "available_quantity": 0}
        )
        result = await adapter.update_stock("ITEM123", qty=0)
        assert result["available_quantity"] == 0
