import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from src.agents.finance_cashflow_agent import FinanceCashflowAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    # Mock para insert default
    supa.table.return_value.insert.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = FinanceCashflowAgent("t1", mock_supabase)
    
    agent._query_user_role = AsyncMock(return_value="admin")
    agent._query_tenant_business_rules = AsyncMock(return_value={"liquidity_threshold": 50000.00})
    
    # Internal method mocks for stable calculations
    agent._calculate_revenue = AsyncMock(return_value=Decimal("100000.00"))
    agent._calculate_costs = AsyncMock(return_value=Decimal("30000.00"))
    agent._project_30_days = AsyncMock(return_value=Decimal("500000.00"))
    agent._notify_socias = AsyncMock()
    return agent

@pytest.mark.asyncio
async def test_revenue_decimal_no_float(agent, mock_supabase):
    # Unmock for this test
    agent._calculate_revenue = FinanceCashflowAgent._calculate_revenue.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.neq.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"total_mxn": 50.5}, {"total_mxn": "100.5"}])
    )
    res = await agent._calculate_revenue(agent._get_now().date(), agent._get_now().date())
    assert isinstance(res, Decimal)
    assert res == Decimal("151.00")

@pytest.mark.asyncio
async def test_costs_decimal_no_float(agent, mock_supabase):
    # Unmock and test costs logic
    agent._calculate_costs = FinanceCashflowAgent._calculate_costs.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.gte.return_value.lte.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"qty": 2, "unit_cost": 10.5}])
    )
    res = await agent._calculate_costs(agent._get_now().date(), agent._get_now().date())
    assert isinstance(res, Decimal)
    assert res == Decimal("21.00")

@pytest.mark.asyncio
async def test_gross_margin_calculo_correcto(agent):
    result = await agent.run({"trigger": "manual_request"})
    # 100k - 30k = 70k
    assert result["output"]["gross_margin"] == 70000.0

@pytest.mark.asyncio
async def test_alerta_cash_menor_50k(agent):
    agent._calculate_revenue = AsyncMock(return_value=Decimal("40000.00"))
    agent._calculate_costs = AsyncMock(return_value=Decimal("0.00"))
    result = await agent.run({"trigger": "manual_request"})
    alerts = result["output"]["alerts"]
    assert len(alerts) > 0
    assert "CRÍTICA" in alerts[0]

@pytest.mark.asyncio
async def test_threshold_de_tenant_config(agent):
    # Threshold at 100k. Cash is 80k. Should alert.
    agent._query_tenant_business_rules = AsyncMock(return_value={"liquidity_threshold": 100000.00})
    agent._calculate_revenue = AsyncMock(return_value=Decimal("80000.00"))
    agent._calculate_costs = AsyncMock(return_value=Decimal("0.00"))
    result = await agent.run({"trigger": "manual_request"})
    alerts = result["output"]["alerts"]
    assert len(alerts) > 0

@pytest.mark.asyncio
async def test_proyeccion_30_dias_correcta(agent):
    agent._project_30_days = FinanceCashflowAgent._project_30_days.__get__(agent)
    # daily revenue is 1k
    res = await agent._project_30_days(Decimal("1000.00"))
    assert res == Decimal("30000.00")

@pytest.mark.asyncio
async def test_snapshot_guardado_en_bd(agent, mock_supabase):
    await agent.run({"trigger": "manual_request"})
    mock_supabase.table.return_value.insert.assert_called()

@pytest.mark.asyncio
async def test_socias_notificadas_si_alerta(agent):
    agent._calculate_revenue = AsyncMock(return_value=Decimal("10000.00")) # Trigger alert
    await agent.run({"trigger": "manual_request"})
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_lunes_9am_cron_trigger(agent):
    result = await agent.run({"trigger": "weekly_report"})
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_fecha_futura_rechazada(agent):
    result = await agent.run({"trigger": "manual_request", "period_start": "2030-01-01"})
    assert result["status"] == "failed"

@pytest.mark.asyncio
async def test_tenant_isolation_orders_query(agent, mock_supabase):
    agent._calculate_revenue = FinanceCashflowAgent._calculate_revenue.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.neq.return_value.gte.return_value.lte.return_value.execute = AsyncMock()
    await agent.run({"trigger": "manual_request"})
    mock_supabase.table.return_value.select.return_value.eq.assert_called_with("tenant_id", "t1")

@pytest.mark.asyncio
async def test_no_datos_financieros_sin_rol_admin(agent):
    # Role "user"
    agent._query_user_role = AsyncMock(return_value="user")
    result = await agent.run({"trigger": "manual_request", "user_id": "U-123"})
    assert result["status"] == "failed"
    assert "Acceso denegado" in result["error"]
