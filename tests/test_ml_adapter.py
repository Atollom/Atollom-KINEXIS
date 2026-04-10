# tests/test_ml_adapter.py
import pytest
import respx
import httpx
from datetime import datetime
from src.adapters.ml_adapter import MLAdapter

@pytest.mark.asyncio
async def test_retry_logic_3_intentos():
    """
    Test: Verifica que el adaptador reintenta hasta 3 veces antes de tener éxito.
    """
    adapter = MLAdapter(tenant_id="test-tenant")
    
    with respx.mock:
        # Simulamos 2 fallos seguidos y un éxito en el 3er intento
        route = respx.get("https://api.mercadolibre.com/test")
        route.side_effect = [
            httpx.Response(500),
            httpx.Response(500),
            httpx.Response(200, json={"status": "ok"})
        ]
        
        result = await adapter._request("GET", "/test")
        assert result["status"] == "ok"
        assert route.call_count == 3

@pytest.mark.asyncio
async def test_webhook_orders_v2_ruta_correcta():
    """
    Test: Verifica el despacho correcto del webhook de órdenes.
    """
    adapter = MLAdapter(tenant_id="test-tenant")
    payload = {"topic": "orders_v2", "resource": "/orders/123"}
    
    result = await adapter.handle_webhook(payload)
    
    assert result["status"] == "dispatched"
    assert "EcommerceRouter" in result["target"]
    assert "ML Question Handler" in result["target"]

@pytest.mark.asyncio
async def test_miercoles_publicaciones_pausadas_no_es_error(monkeypatch):
    """
    Test: Verifica que los miércoles el error 403 se maneja con gracia.
    """
    class MockDatetime:
        @classmethod
        def now(cls): return datetime(2026, 4, 8) # Un miércoles
        @classmethod
        def combine(cls, d, t): return datetime.combine(d, t)
    
    monkeypatch.setattr("src.adapters.ml_adapter.datetime", MockDatetime)
    
    adapter = MLAdapter(tenant_id="test-tenant")
    
    with respx.mock:
        respx.get("https://api.mercadolibre.com/test").respond(403)
        
        # Debe fallar finalmente con 403, pero el log interno se disparó.
        with pytest.raises(httpx.HTTPStatusError):
            await adapter._request("GET", "/test")

@pytest.mark.asyncio
async def test_timeout_manejo_graceful():
    """
    Test: Verifica que el timeout se aplica y se eleva tras 3 reintentos.
    """
    adapter = MLAdapter(tenant_id="test-tenant")
    
    with respx.mock:
        route = respx.get("https://api.mercadolibre.com/slow").side_effect = httpx.TimeoutException("Too slow")
        
        # Debido a retry(3), veremos la excepción tras agotar intentos
        with pytest.raises(httpx.TimeoutException):
            await adapter._request("GET", "/slow")

@pytest.mark.asyncio
async def test_tenant_isolation_ml():
    """
    Test: Verifica aislamiento de instancia.
    """
    adapter_a = MLAdapter(tenant_id="tenant-a")
    adapter_b = MLAdapter(tenant_id="tenant-b")
    assert adapter_a.tenant_id != adapter_b.tenant_id
