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
