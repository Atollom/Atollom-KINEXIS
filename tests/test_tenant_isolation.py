# tests/test_tenant_isolation.py
import pytest
import asyncio
from src.agents.validation_agent import ValidationAgent

@pytest.mark.asyncio
async def test_tenant_isolation_success():
    """
    Test: ValidationAgent debe pasar si el tenant_id coincide.
    """
    tenant_a_id = "tenant-a-uuid"
    agent = ValidationAgent(tenant_id=tenant_a_id)
    
    input_data = {
        "tenant_id": tenant_a_id,
        "source": "api",
        "payload": {
            "price": 100, 
            "cost": 50, 
            "platform": "ml",
            "total": 100.00
        }
    }
    
    result = await agent.process(input_data)
    
    # El check de isolation debe ser passing
    isolation_check = next(c for c in result["failed_checks"] + [{"check_name": "check_tenant_isolation", "is_passing": True}] if c["check_name"] == "check_tenant_isolation")
    
    assert isolation_check["is_passing"] is True
    assert result["is_passing"] is True

@pytest.mark.asyncio
async def test_tenant_isolation_failure():
    """
    Test Crítico: ValidationAgent debe RECHAZAR si el tenant_id no coincide.
    Simula intento de acceso de Tenant B a datos de Tenant A.
    """
    tenant_a_id = "tenant-a-uuid"
    tenant_b_id = "tenant-b-uuid"
    
    # Agente configurado para Tenant A
    agent = ValidationAgent(tenant_id=tenant_a_id)
    
    # Input que viene con Tenant B
    input_data = {
        "tenant_id": tenant_b_id,
        "source": "api",
        "payload": {"price": 100, "cost": 50, "platform": "ml"}
    }
    
    result = await agent.process(input_data)
    
    # Debe haber fallado la validación global
    assert result["is_passing"] is False
    
    # Buscamos específicamente el check de isolation en los fallos
    isolation_check = next(c for c in result["failed_checks"] if c["check_name"] == "check_tenant_isolation")
    
    assert isolation_check["is_passing"] is False
    print("\n✅ TEST PASSED: El sistema bloqueó correctamente el acceso cruzado de tenants.")

if __name__ == "__main__":
    asyncio.run(test_tenant_isolation_failure())

# ── H2 ──

@pytest.mark.asyncio
async def test_precio_menor_margen_ml_falla():
    agent = ValidationAgent(tenant_id="t1")
    # ML margin 1.20: price=110, cost=100 → 110 < 120 → fail
    data = {"tenant_id": "t1", "source": "api", "payload": {"price": 110, "cost": 100, "platform": "ml", "total": 110}}
    result = await agent.process(data)
    margin_check = next((c for c in result["failed_checks"] if c["check_name"] == "check_price_above_minimum"), None)
    assert margin_check is not None
    assert margin_check["is_passing"] is False

@pytest.mark.asyncio
async def test_precio_mayor_margen_amazon_pasa():
    agent = ValidationAgent(tenant_id="t1")
    # Amazon margin 1.25: price=130, cost=100 → 130 >= 125 → pass
    data = {"tenant_id": "t1", "source": "api", "payload": {"price": 130, "cost": 100, "platform": "amazon", "total": 130}}
    result = await agent.process(data)
    assert result["is_passing"] is True

@pytest.mark.asyncio
async def test_rfc_formato_invalido_falla():
    agent = ValidationAgent(tenant_id="t1")
    data = {"tenant_id": "t1", "source": "api", "payload": {"price": 130, "cost": 100, "platform": "ml", "total": 130, "rfc_emisor": "INVALIDO"}}
    result = await agent.process(data)
    rfc_check = next((c for c in result["failed_checks"] if c["check_name"] == "check_rfc_format"), None)
    assert rfc_check is not None and rfc_check["is_passing"] is False

@pytest.mark.asyncio
async def test_rfc_formato_valido_pasa():
    agent = ValidationAgent(tenant_id="t1")
    # RFC válido de persona moral
    data = {"tenant_id": "t1", "source": "api", "payload": {"price": 130, "cost": 100, "platform": "ml", "total": 130, "rfc_emisor": "XAXX010101000"}}
    result = await agent.process(data)
    # RFC válido no debe aparecer en failed_checks
    rfc_fail = next((c for c in result["failed_checks"] if c["check_name"] == "check_rfc_format"), None)
    assert rfc_fail is None

@pytest.mark.asyncio
async def test_cfdi_total_negativo_bloqueado():
    agent = ValidationAgent(tenant_id="t1")
    data = {"tenant_id": "t1", "source": "api", "payload": {"price": 130, "cost": 100, "platform": "ml", "total": -50}}
    result = await agent.process(data)
    total_check = next((c for c in result["failed_checks"] if c["check_name"] == "check_cfdi_total_positive"), None)
    assert total_check is not None and total_check["is_passing"] is False

@pytest.mark.asyncio
async def test_schema_falta_payload_falla():
    agent = ValidationAgent(tenant_id="t1")
    data = {"tenant_id": "t1", "source": "api"}  # no 'payload' key
    result = await agent.process(data)
    schema_check = next((c for c in result["failed_checks"] if c["check_name"] == "check_json_schema"), None)
    assert schema_check is not None and schema_check["is_passing"] is False
