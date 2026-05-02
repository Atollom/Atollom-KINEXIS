"""
Tests for ContextAnalyzer — mocks psycopg2 to avoid requiring a live DB.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone

from src.services.context_analyzer import (
    ContextAnalyzer,
    _analyze_sync,
    _inv_check,
    _invoice_check,
    _overdue_check,
    _crm_check,
    _empty_result,
    _CRITICAL_STOCK_THRESHOLD,
    _LOW_STOCK_THRESHOLD,
)
from src.agents.samantha.core import _build_proactive_greeting


# ── _inv_check ────────────────────────────────────────────────────────────────

def test_inv_check_critical():
    cur = MagicMock()
    cur.fetchall.return_value = [
        {"name": "TAL-003", "sku": "TAL-003", "stock": 2}
    ]
    result = _inv_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["type"] == "inventory"
    assert result[0]["severity"] == "critical"
    assert "TAL-003" in result[0]["title"]
    assert result[0]["agent_id"] == "agent_30_purchase_orders"


def test_inv_check_high():
    cur = MagicMock()
    cur.fetchall.return_value = [
        {"name": "Product B", "sku": "PRD-B", "stock": 7}  # > critical, <= low threshold
    ]
    result = _inv_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["severity"] == "high"


def test_inv_check_empty():
    cur = MagicMock()
    cur.fetchall.return_value = []
    result = _inv_check(cur, "tenant-1")
    assert result == []


def test_inv_check_db_error_returns_empty():
    cur = MagicMock()
    cur.execute.side_effect = Exception("DB error")
    result = _inv_check(cur, "tenant-1")
    assert result == []


def test_inv_check_multiple_products():
    cur = MagicMock()
    cur.fetchall.return_value = [
        {"name": "A", "sku": "A-001", "stock": 1},
        {"name": "B", "sku": "B-002", "stock": 8},
        {"name": "C", "sku": None, "stock": 3},
    ]
    result = _inv_check(cur, "tenant-1")

    assert len(result) == 3
    assert result[0]["severity"] == "critical"   # stock=1
    assert result[1]["severity"] == "high"        # stock=8
    assert result[2]["severity"] == "critical"    # stock=3 <= _CRITICAL_STOCK_THRESHOLD
    assert "N/A" in result[2]["description"]      # sku=None → "N/A"


# ── _invoice_check ────────────────────────────────────────────────────────────

def test_invoice_check_high():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 5}
    result = _invoice_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["type"] == "operations"
    assert result[0]["severity"] == "high"
    assert result[0]["agent_id"] == "agent_13_cfdi_billing"


def test_invoice_check_medium():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 2}
    result = _invoice_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["severity"] == "medium"


def test_invoice_check_zero():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 0}
    result = _invoice_check(cur, "tenant-1")
    assert result == []


def test_invoice_check_db_error_returns_empty():
    cur = MagicMock()
    cur.execute.side_effect = Exception("column invoice_id does not exist")
    result = _invoice_check(cur, "tenant-1")
    assert result == []


# ── _overdue_check ────────────────────────────────────────────────────────────

def test_overdue_check_high():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 3, "total": 45000.0}
    result = _overdue_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["type"] == "finance"
    assert result[0]["severity"] == "high"
    assert "45,000" in result[0]["title"]
    assert result[0]["agent_id"] == "agent_33_follow_up"


def test_overdue_check_zero():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 0, "total": 0.0}
    result = _overdue_check(cur, "tenant-1")
    assert result == []


def test_overdue_check_none_row():
    cur = MagicMock()
    cur.fetchone.return_value = None
    result = _overdue_check(cur, "tenant-1")
    assert result == []


def test_overdue_check_db_error_returns_empty():
    cur = MagicMock()
    cur.execute.side_effect = Exception("DB timeout")
    result = _overdue_check(cur, "tenant-1")
    assert result == []


# ── _crm_check ────────────────────────────────────────────────────────────────

def test_crm_check_medium():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 4}
    result = _crm_check(cur, "tenant-1")

    assert len(result) == 1
    assert result[0]["type"] == "crm"
    assert result[0]["severity"] == "medium"
    assert result[0]["agent_id"] == "agent_33_follow_up"


def test_crm_check_zero():
    cur = MagicMock()
    cur.fetchone.return_value = {"cnt": 0}
    result = _crm_check(cur, "tenant-1")
    assert result == []


def test_crm_check_table_not_found_returns_empty():
    """leads table may not exist yet — should silently return empty."""
    cur = MagicMock()
    cur.execute.side_effect = Exception('relation "leads" does not exist')
    result = _crm_check(cur, "tenant-1")
    assert result == []


# ── _analyze_sync ─────────────────────────────────────────────────────────────

@patch("src.services.context_analyzer.psycopg2.connect")
@patch.dict("os.environ", {"DATABASE_URL": "postgresql://fake"})
def test_analyze_sync_sorted_by_severity(mock_connect):
    mock_cur = MagicMock()
    mock_connect.return_value.__enter__ = lambda s: s
    mock_connect.return_value.cursor.return_value = mock_cur
    mock_connect.return_value.close = MagicMock()

    # inventory: 1 critical item
    mock_cur.fetchall.return_value = [{"name": "TAL-003", "sku": "TAL-003", "stock": 1}]
    # invoice: 5 pending
    # overdue: 3 overdue
    # crm: 4 stale leads
    mock_cur.fetchone.side_effect = [
        {"cnt": 5},                        # invoice check
        {"cnt": 3, "total": 15000.0},      # overdue check
        {"cnt": 4},                        # crm check
    ]

    result = _analyze_sync("tenant-1")

    assert "urgencies" in result
    assert "total_issues" in result
    assert "analyzed_at" in result
    assert isinstance(result["analyzed_at"], datetime)

    urgencies = result["urgencies"]
    # Inventory critical must come first
    assert urgencies[0]["severity"] == "critical"
    # All severities should be valid
    for u in urgencies:
        assert u["severity"] in ("critical", "high", "medium")


@patch.dict("os.environ", {}, clear=True)
def test_analyze_sync_no_db_url():
    """Without DATABASE_URL, returns empty result gracefully."""
    result = _analyze_sync("tenant-1")
    assert result["urgencies"] == []
    assert result["total_issues"] == 0


@patch("src.services.context_analyzer.psycopg2.connect")
@patch.dict("os.environ", {"DATABASE_URL": "postgresql://fake"})
def test_analyze_sync_limits_to_10(mock_connect):
    mock_cur = MagicMock()
    mock_connect.return_value.cursor.return_value = mock_cur
    mock_connect.return_value.close = MagicMock()

    # 15 low-stock items
    mock_cur.fetchall.return_value = [
        {"name": f"Prod-{i}", "sku": f"SKU-{i:03d}", "stock": i} for i in range(15)
    ]
    mock_cur.fetchone.side_effect = [
        {"cnt": 0},        # invoice check
        {"cnt": 0, "total": 0},  # overdue check
        {"cnt": 0},        # crm check
    ]

    result = _analyze_sync("tenant-1")
    assert len(result["urgencies"]) <= 10


# ── ContextAnalyzer.analyze() ─────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("src.services.context_analyzer._analyze_sync")
async def test_analyze_returns_analysis(mock_sync):
    mock_sync.return_value = {
        "urgencies": [{"type": "inventory", "severity": "critical", "title": "Stock bajo: TAL-003",
                       "description": "2 uds", "suggested_action": "Ordenar", "agent_id": "agent_30_purchase_orders",
                       "data": {}}],
        "total_issues": 1,
        "analyzed_at": datetime.now(timezone.utc),
    }

    analyzer = ContextAnalyzer()
    result = await analyzer.analyze("tenant-1")

    assert len(result["urgencies"]) == 1
    assert result["urgencies"][0]["severity"] == "critical"
    mock_sync.assert_called_once_with("tenant-1")


@pytest.mark.asyncio
@patch("src.services.context_analyzer._analyze_sync")
async def test_analyze_handles_exception_gracefully(mock_sync):
    mock_sync.side_effect = Exception("unexpected crash")

    analyzer = ContextAnalyzer()
    result = await analyzer.analyze("tenant-1")

    # Should return empty result, not raise
    assert result["urgencies"] == []
    assert result["total_issues"] == 0


# ── _build_proactive_greeting ─────────────────────────────────────────────────

def _make_analysis(urgencies):
    return {"urgencies": urgencies, "total_issues": len(urgencies)}


def test_proactive_greeting_critical():
    analysis = _make_analysis([
        {"severity": "critical", "title": "Stock bajo: TAL-003", "description": "2 uds",
         "suggested_action": "Crear OC", "type": "inventory"},
    ])
    greeting = _build_proactive_greeting(analysis)

    assert "crítica" in greeting
    assert "TAL-003" in greeting
    assert "Crear OC" in greeting
    assert "¿En cuál" in greeting


def test_proactive_greeting_high():
    analysis = _make_analysis([
        {"severity": "high", "title": "5 órdenes sin facturar", "description": "...",
         "suggested_action": "Generar CFDI", "type": "operations"},
    ])
    greeting = _build_proactive_greeting(analysis)

    assert "importante" in greeting.lower()
    assert "5 órdenes" in greeting
    assert "¿Necesitas" in greeting


def test_proactive_greeting_medium():
    analysis = _make_analysis([
        {"severity": "medium", "title": "3 leads sin seguimiento", "description": "...",
         "suggested_action": "Programar seguimiento", "type": "crm"},
    ])
    greeting = _build_proactive_greeting(analysis)

    assert "sugerencia" in greeting.lower()
    assert "3 leads" in greeting


def test_proactive_greeting_empty():
    analysis = _make_analysis([])
    greeting = _build_proactive_greeting(analysis)
    assert "Todo bajo control" in greeting


def test_proactive_greeting_plural_critical():
    analysis = _make_analysis([
        {"severity": "critical", "title": "X", "description": "d", "suggested_action": "A", "type": "inventory"},
        {"severity": "critical", "title": "Y", "description": "d", "suggested_action": "B", "type": "inventory"},
    ])
    greeting = _build_proactive_greeting(analysis)
    assert "situaciones" in greeting  # plural form


def test_proactive_greeting_shows_high_after_critical():
    analysis = _make_analysis([
        {"severity": "critical", "title": "Critical Item", "description": "d",
         "suggested_action": "Fix", "type": "inventory"},
        {"severity": "high", "title": "High Item", "description": "d",
         "suggested_action": "Do", "type": "finance"},
    ])
    greeting = _build_proactive_greeting(analysis)
    # Both should be mentioned
    assert "Critical Item" in greeting
    assert "High Item" in greeting
