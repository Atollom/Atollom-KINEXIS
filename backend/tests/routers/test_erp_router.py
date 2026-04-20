"""Tests for ERP Router."""

import pytest
from src.routers.erp_router import ERPRouter


@pytest.fixture
def router():
    return ERPRouter()


@pytest.mark.asyncio
async def test_erp_router_check_inventory(router):
    result = await router.route({
        "intent": "check_inventory",
        "tenant_id": "orthocardio",
        "data": {"action": "check_stock", "sku": "SKU-001"},
    })
    assert result["success"] is True
    assert result["router"] == "ERP Router"
    assert "Agent #5" in result["agents_called"][0]
    assert "execution_time_ms" in result


@pytest.mark.asyncio
async def test_erp_router_generate_cfdi(router):
    result = await router.route({
        "intent": "generate_cfdi",
        "tenant_id": "orthocardio",
        "data": {
            "customer_rfc": "XAXX010101000",
            "customer_name": "Publico en General",
            "payment_method": "01",
            "items": [{"description": "Servicio", "quantity": 1, "unit_price": 1000.0}],
        },
    })
    assert result["success"] is True
    assert "Agent #13" in result["agents_called"][0]
    assert "folio" in result["result"]


@pytest.mark.asyncio
async def test_erp_router_evaluate_supplier(router):
    result = await router.route({
        "intent": "evaluate_supplier",
        "data": {
            "action": "evaluate",
            "priority": "cost",
            "suppliers": [
                {"id": "S1", "name": "Supplier A", "price_per_unit": 30.0, "delivery_days": 5, "rating": 4.5},
                {"id": "S2", "name": "Supplier B", "price_per_unit": 50.0, "delivery_days": 3, "rating": 4.8},
            ],
        },
    })
    assert result["success"] is True
    assert "Agent #16" in result["agents_called"][0]
    assert "recommendation" in result["result"]


@pytest.mark.asyncio
async def test_erp_router_get_finance_snapshot(router):
    result = await router.route({
        "intent": "get_finance_snapshot",
        "tenant_id": "orthocardio",
        "data": {"period": "month", "tenant_id": "orthocardio"},
    })
    assert result["success"] is True
    assert "Agent #18" in result["agents_called"][0]
    assert "period" in result["result"]


@pytest.mark.asyncio
async def test_erp_router_print_label(router):
    result = await router.route({
        "intent": "print_label",
        "data": {
            "type": "shipping_label",
            "format": "zpl",
            "data": {
                "order_id": "ORD-001",
                "tracking": "TRK-001",
                "recipient": "Juan Perez",
                "address": "Av. Principal 1, Puebla",
            },
        },
    })
    assert result["success"] is True
    assert "Agent #24" in result["agents_called"][0]
    assert result["result"]["format"] == "zpl"


@pytest.mark.asyncio
async def test_erp_router_create_shipment(router):
    result = await router.route({
        "intent": "create_shipment",
        "data": {
            "order_id": "ORD-001",
            "carrier": "estafeta",
            "service_level": "standard",
            "package": {"weight": 2.0, "length": 30, "width": 20, "height": 15},
            "address": {"name": "Cliente", "street": "Calle 2", "city": "Puebla", "state": "Puebla", "zip": "72000", "phone": "2220000000"},
        },
    })
    assert result["success"] is True
    assert "Agent #25" in result["agents_called"][0]
    assert "tracking_number" in result["result"]


@pytest.mark.asyncio
async def test_erp_router_create_po(router):
    result = await router.route({
        "intent": "create_po",
        "data": {
            "action": "create",
            "supplier_id": "SUPP-001",
            "supplier_name": "Proveedor SA",
            "requested_by": "user@orthocardio.com",
            "approver": "owner@orthocardio.com",
            "items": [{"sku": "SKU-001", "description": "Taladro", "quantity": 50, "unit_price": 400.0}],
        },
    })
    assert result["success"] is True
    assert "Agent #30" in result["agents_called"][0]
    assert result["result"]["po_number"].startswith("PO-")


@pytest.mark.asyncio
async def test_erp_router_invalid_intent(router):
    result = await router.route({"intent": "delete_records", "data": {}})
    assert result["success"] is False
    assert "intent" in result["error"].lower() or "Unknown" in result["error"]


@pytest.mark.asyncio
async def test_erp_router_tenant_id_forwarded(router):
    result = await router.route({
        "intent": "check_inventory",
        "tenant_id": "kap_tools",
        "data": {"action": "check_stock", "sku": "SKU-003"},
    })
    assert result["success"] is True
    assert result["router"] == "ERP Router"


@pytest.mark.asyncio
async def test_erp_router_execution_time_present(router):
    result = await router.route({
        "intent": "get_finance_snapshot",
        "data": {"period": "today", "tenant_id": "orthocardio"},
    })
    assert "execution_time_ms" in result
    assert result["execution_time_ms"] >= 0
