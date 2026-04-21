"""Tests para CFDI Dual Provider (multi-tenant)."""

import pytest
from src.integrations.cfdi_provider import CFDIProvider, cfdi_provider


# ── Singleton & health ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cfdi_provider_singleton_exists():
    assert cfdi_provider is not None
    assert cfdi_provider.name == "CFDI Dual Provider"


@pytest.mark.asyncio
async def test_cfdi_provider_test_connection():
    result = await cfdi_provider.test_connection()
    assert "success" in result
    assert "primary" in result
    assert "fallback" in result
    assert "stats" in result
    assert result["primary"]["provider"] == "Facturama"
    assert result["fallback"]["provider"] == "FacturAPI"


# ── Format converters ─────────────────────────────────────────────────────────

def test_cfdi_convert_to_facturama_format():
    items = [
        {"description": "Producto A", "product_key": "01010101", "quantity": 2, "unit_price": 100.0}
    ]
    result = cfdi_provider._convert_to_facturama_format(items)
    assert len(result) == 1
    r = result[0]
    assert r["ProductCode"] == "01010101"
    assert r["Description"] == "Producto A"
    assert r["Quantity"] == 2
    assert r["UnitPrice"] == 100.0
    assert r["TaxObject"] == "02"
    assert r["Unit"] == "E48"


def test_cfdi_convert_to_facturama_defaults():
    result = cfdi_provider._convert_to_facturama_format([{}])
    r = result[0]
    assert r["ProductCode"] == "01010101"
    assert r["Quantity"] == 1
    assert r["UnitPrice"] == 0


def test_cfdi_convert_to_facturapi_format():
    items = [
        {"description": "Producto B", "product_key": "84111506", "quantity": 3, "unit_price": 150.0}
    ]
    result = cfdi_provider._convert_to_facturapi_format(items)
    assert len(result) == 1
    r = result[0]
    assert r["product"]["description"] == "Producto B"
    assert r["product"]["product_key"] == "84111506"
    assert r["product"]["price"] == 150.0
    assert r["quantity"] == 3


def test_cfdi_convert_to_facturapi_defaults():
    result = cfdi_provider._convert_to_facturapi_format([{}])
    r = result[0]
    assert r["product"]["product_key"] == "01010101"
    assert r["quantity"] == 1


# ── Stats ─────────────────────────────────────────────────────────────────────

def test_cfdi_get_stats_empty():
    cp = CFDIProvider()
    stats = cp.get_stats()
    assert stats["total_invoices"] == 0
    assert stats["success_rate"] == 0
    assert "facturama" in stats
    assert "facturapi" in stats
    assert "quota_exceeded_count" in stats
    assert stats["quota_exceeded_count"] == 0


def test_cfdi_get_stats_with_data():
    cp = CFDIProvider()
    cp.stats["facturama_success"] = 8
    cp.stats["facturama_failed"] = 1
    cp.stats["facturapi_success"] = 1
    cp.stats["facturapi_failed"] = 0
    stats = cp.get_stats()
    assert stats["total_invoices"] == 10
    assert stats["success_rate"] == 90.0
    assert stats["facturama"]["success"] == 8
    assert stats["facturapi"]["success"] == 1


def test_cfdi_stats_counters_isolated():
    cp = CFDIProvider()
    assert cp.stats["facturama_success"] == 0
    assert cp.stats["facturapi_failed"] == 0
    assert cp.stats["quota_exceeded"] == 0


# ── Multi-tenant: fiscal config ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cfdi_get_tenant_fiscal_config_default():
    cp = CFDIProvider()
    config = await cp._get_tenant_fiscal_config("any_tenant_id")
    assert config is not None
    assert "rfc" in config
    assert "razon_social" in config
    assert "invoice_limit" in config
    assert "invoices_used" in config


@pytest.mark.asyncio
async def test_cfdi_get_tenant_fiscal_config_over_quota():
    cp = CFDIProvider()
    config = await cp._get_tenant_fiscal_config("tenant_over_quota")
    assert config["invoice_limit"] == 1
    assert config["invoices_used"] == 1


# ── Multi-tenant: quota usage ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cfdi_get_usage_structure():
    usage = await cfdi_provider.get_tenant_invoice_usage("test_tenant")
    assert "limit" in usage
    assert "used" in usage
    assert "remaining" in usage
    assert "percentage" in usage
    assert "status" in usage


@pytest.mark.asyncio
async def test_cfdi_get_usage_values():
    usage = await cfdi_provider.get_tenant_invoice_usage("test_tenant")
    assert usage["limit"] == 500
    assert usage["used"] == 127
    assert usage["remaining"] == 373
    assert usage["percentage"] == 25.4
    assert usage["status"] == "ok"


@pytest.mark.asyncio
async def test_cfdi_get_usage_over_quota_tenant():
    usage = await cfdi_provider.get_tenant_invoice_usage("tenant_over_quota")
    assert usage["used"] >= usage["limit"]
    assert usage["remaining"] == 0
    assert usage["status"] == "critical"


# ── Multi-tenant: create_invoice ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cfdi_create_invoice_multi_tenant_structure():
    """Sin credenciales reales debe fallar con estructura correcta."""
    result = await cfdi_provider.create_invoice(
        tenant_id="test_tenant_123",
        customer_rfc="XAXX010101000",
        customer_name="Cliente Ejemplo SA de CV",
        items=[{"description": "Producto Test", "product_key": "01010101", "quantity": 1, "unit_price": 100.0}],
    )
    assert "success" in result
    # Con mock config y sin credenciales → falla en providers pero retorna dict válido
    if not result["success"]:
        assert "error" in result or "message" in result


@pytest.mark.asyncio
async def test_cfdi_quota_exceeded():
    """Tenant con cuota agotada recibe error específico."""
    cp = CFDIProvider()
    result = await cp.create_invoice(
        tenant_id="tenant_over_quota",
        customer_rfc="XAXX010101000",
        customer_name="Cliente",
        items=[{"description": "Test", "product_key": "01010101", "quantity": 1, "unit_price": 100.0}],
    )
    assert result["success"] is False
    assert "quota" in result["error"].lower() or "quota" in result
    assert "quota" in result
    assert result["quota"]["remaining"] == 0
    assert cp.stats["quota_exceeded"] == 1


@pytest.mark.asyncio
async def test_cfdi_create_invoice_legacy_no_tenant():
    """Sin tenant_id usa flujo legacy — estructura válida sin importar resultado."""
    result = await cfdi_provider.create_invoice(
        customer_rfc="XAXX010101000",
        customer_name="Público General",
        items=[{"description": "Servicio", "product_key": "84111506", "quantity": 1, "unit_price": 500.0}],
    )
    assert "success" in result
    assert isinstance(result["success"], bool)


# ── Multi-tenant: cancel (structure) ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_cfdi_cancel_invoice_structure():
    """Cancel retorna dict con success key."""
    result = await cfdi_provider.cancel_invoice(
        invoice_id="fake_id_000",
        provider="facturama",
        motive="02",
    )
    assert "success" in result
