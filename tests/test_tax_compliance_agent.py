import pytest
import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.tax_compliance_agent import TaxComplianceAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.storage.from_.return_value.upload = AsyncMock()
    supa.table.return_value.select.return_value.eq.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = TaxComplianceAgent("t1", mock_supabase)
    
    # Mocking now
    now_mock = MagicMock()
    now_mock.date.return_value = datetime.date(2023, 10, 10)
    agent._get_now = MagicMock(return_value=now_mock)
    
    return agent

@pytest.mark.asyncio
async def test_human_required_siempre(agent):
    result = await agent.run({"trigger": "efos_check"})
    assert result["output"]["requires_approval"] is True

@pytest.mark.asyncio
async def test_period_formato_yyyy_mm_valido(agent, mock_supabase):
    # Valid
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock()
    result = await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_period_invalido_rechazado(agent):
    result = await agent.run({"trigger": "monthly_summary", "period": "2023-9"})
    assert result["status"] == "failed"
    assert "inválido" in result["error"].lower()

@pytest.mark.asyncio
async def test_cfdi_count_correcto(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"total": 100}, {"total": 200}])
    )
    result = await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    assert result["output"]["cfdi_count"] == 2

@pytest.mark.asyncio
async def test_total_invoiced_decimal(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"total": "100.50"}, {"total": 200.25}])
    )
    result = await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    # Since agent returns float to the output dict for BaseAgent serialization compatibility, we should test internal Decimal logic
    assert result["output"]["total_invoiced"] == 300.75

@pytest.mark.asyncio
async def test_total_iva_decimal(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"iva": 16.0}, {"iva": 32.0}])
    )
    result = await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    assert result["output"]["total_iva"] == 48.0

@pytest.mark.asyncio
async def test_recordatorio_dia_10_del_mes(agent):
    # Today is 10. Deadline for period '2023-09' is 2023-10-17.
    # 17 - 10 = 7 days
    result = await agent.run({"trigger": "deadline_reminder", "period": "2023-09"})
    assert result["output"]["deadline_days"] == 7

@pytest.mark.asyncio
async def test_recordatorio_dia_15_del_mes(agent):
    # Today is 15. Deadline for period '2023-09' is 2023-10-17.
    now_mock = MagicMock()
    now_mock.date.return_value = datetime.date(2023, 10, 15)
    agent._get_now = MagicMock(return_value=now_mock)
    
    result = await agent.run({"trigger": "deadline_reminder", "period": "2023-09"})
    assert result["output"]["deadline_days"] == 2

@pytest.mark.asyncio
async def test_dias_hasta_deadline_correcto(agent):
    result = await agent.run({"trigger": "deadline_reminder", "period": "2023-09"})
    assert result["output"]["deadline_days"] == 7

@pytest.mark.asyncio
async def test_resumen_guardado_storage_privado(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock()
    await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    mock_supabase.storage.from_.assert_called_with("fiscal")
    mock_supabase.storage.from_.return_value.upload.assert_called()

@pytest.mark.asyncio
async def test_tenant_isolation_cfdi_records(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock()
    await agent.run({"trigger": "monthly_summary", "period": "2023-09"})
    mock_supabase.table.return_value.select.return_value.eq.assert_called_with("tenant_id", "t1")

@pytest.mark.asyncio
async def test_efos_check_mock_retorna_lista(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"rfc_receptor": "EFO000000XXX"}])
    )
    result = await agent.run({"trigger": "efos_check"})
    alerts = result["output"]["efos_alerts"]
    assert len(alerts) == 1
    assert "EFOS" in alerts[0]
