"""
Tests para Agent #26 — Validation
"""

import pytest
from src.agents.core.agent_26_validation import validation


@pytest.mark.asyncio
async def test_validation_passes_well_formed_response():
    from datetime import datetime
    result = await validation.execute({
        "agent_name": "Agent #1 - ML Fulfillment",
        "response": {
            "success": True,
            "agent": "Agent #1",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {"order_id": "ML-123", "status": "fulfilled"},
        },
    })
    assert result["success"] is True
    assert result["data"]["valid"] is True


@pytest.mark.asyncio
async def test_validation_fails_missing_success_field():
    result = await validation.execute({
        "agent_name": "Agent #X",
        "response": {"data": {"foo": "bar"}},
    })
    assert result["success"] is True
    assert result["data"]["valid"] is False
    assert "has_success_field" in result["data"]["checks_failed"]


@pytest.mark.asyncio
async def test_validation_warns_on_placeholder():
    from datetime import datetime
    result = await validation.execute({
        "agent_name": "Agent #1",
        "response": {
            "success": True,
            "data": {"tracking": "PENDING_IMPLEMENTATION"},
            "timestamp": datetime.utcnow().isoformat(),
        },
    })
    assert result["success"] is True
    # Placeholder is a warning, not a failure
    warnings = result["data"]["warnings"]
    assert any("placeholder" in w for w in warnings)


@pytest.mark.asyncio
async def test_validation_checks_expected_fields():
    from datetime import datetime
    result = await validation.execute({
        "agent_name": "Agent #13",
        "response": {
            "success": True,
            "data": {"uuid": "ABC-123"},
            "timestamp": datetime.utcnow().isoformat(),
        },
        "expected": ["uuid", "pdf_url"],
    })
    assert result["success"] is True
    assert "expected_field_uuid" in result["data"]["checks_passed"]
    assert "missing_expected_field_pdf_url" in result["data"]["checks_failed"]
