"""Tests para CFDI Dual Provider."""

import pytest
from src.integrations.cfdi_provider import CFDIProvider, cfdi_provider


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


def test_cfdi_get_stats_empty():
    cp = CFDIProvider()
    stats = cp.get_stats()
    assert stats["total_invoices"] == 0
    assert stats["success_rate"] == 0
    assert "facturama" in stats
    assert "facturapi" in stats


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
