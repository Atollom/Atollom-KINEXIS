"""Tests for Agent #18 - Finance Snapshot."""

import pytest
from src.agents.erp.agent_18_finance_snapshot import Agent18FinanceSnapshot


@pytest.fixture
def agent():
    return Agent18FinanceSnapshot()


@pytest.mark.asyncio
async def test_finance_snapshot_today(agent):
    result = await agent.execute({"period": "today", "tenant_id": "orthocardio"})
    assert result["success"] is True
    data = result["data"]
    assert data["period"] == "today"
    assert "snapshot" in data
    assert "sales" in data["snapshot"]


@pytest.mark.asyncio
async def test_finance_snapshot_week(agent):
    result = await agent.execute({"period": "week", "tenant_id": "orthocardio"})
    assert result["success"] is True
    snapshot = result["data"]["snapshot"]
    assert snapshot["sales"]["total"] > 0


@pytest.mark.asyncio
async def test_finance_snapshot_month(agent):
    result = await agent.execute({"period": "month", "tenant_id": "orthocardio"})
    assert result["success"] is True
    snapshot = result["data"]["snapshot"]
    assert snapshot["sales"]["total"] > snapshot["sales"]["count"]


@pytest.mark.asyncio
async def test_finance_snapshot_quarter_larger_than_month(agent):
    month = await agent.execute({"period": "month", "tenant_id": "orthocardio"})
    quarter = await agent.execute({"period": "quarter", "tenant_id": "orthocardio"})
    assert quarter["data"]["snapshot"]["sales"]["total"] > month["data"]["snapshot"]["sales"]["total"]


@pytest.mark.asyncio
async def test_finance_calculate_cashflow(agent):
    result = await agent.execute({
        "period": "month",
        "tenant_id": "orthocardio",
        "include": ["sales", "payables", "cashflow"],
    })
    assert result["success"] is True
    snapshot = result["data"]["snapshot"]
    assert "cashflow" in snapshot
    assert "net" in snapshot["cashflow"]
    expected_net = round(snapshot["sales"]["total"] - snapshot["payables"]["total"], 2)
    assert snapshot["cashflow"]["net"] == expected_net


@pytest.mark.asyncio
async def test_finance_detect_overdue_alert(agent):
    result = await agent.execute({"period": "month", "tenant_id": "orthocardio"})
    assert result["success"] is True
    alerts = result["data"]["alerts"]
    # Month period has receivables overdue > 0
    has_overdue = any("CxC" in a or "vencida" in a for a in alerts)
    assert has_overdue


@pytest.mark.asyncio
async def test_finance_detect_due_soon_alert(agent):
    result = await agent.execute({"period": "month", "tenant_id": "orthocardio"})
    assert result["success"] is True
    alerts = result["data"]["alerts"]
    has_payables_alert = any("pago" in a.lower() or "proveedor" in a.lower() for a in alerts)
    assert has_payables_alert


@pytest.mark.asyncio
async def test_finance_invalid_period_returns_error(agent):
    result = await agent.execute({"period": "decade", "tenant_id": "orthocardio"})
    assert result["success"] is False
    assert "period" in result["error"].lower() or "Invalid" in result["error"]


@pytest.mark.asyncio
async def test_finance_invalid_tenant_returns_error(agent):
    result = await agent.execute({"period": "month", "tenant_id": "   "})
    assert result["success"] is False
    assert "tenant_id" in result["error"]
