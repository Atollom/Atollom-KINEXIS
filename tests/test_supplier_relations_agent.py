import pytest
from unittest.mock import AsyncMock, MagicMock
from src.agents.supplier_relations_agent import SupplierRelationsAgent

@pytest.fixture
def mock_supabase():
    supa = MagicMock()
    supa.table.return_value.update.return_value.eq.return_value.eq.return_value.execute = AsyncMock()
    return supa

@pytest.fixture
def agent(mock_supabase):
    agent = SupplierRelationsAgent("t1", mock_supabase)
    
    agent._notify_socias = AsyncMock()
    # By default, mock enough actives
    agent._get_supplier_category = AsyncMock(return_value="electronics")
    agent._count_active_suppliers = AsyncMock(return_value=5)
    
    return agent

@pytest.mark.asyncio
async def test_score_calculado_internamente(agent):
    agent._calculate_score = AsyncMock(return_value=85)
    agent._check_incumplimientos = AsyncMock(return_value=0)
    # Passed a fake score in payload
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1", "supplier_score": 10})
    assert result["output"]["supplier_score"] == 85

@pytest.mark.asyncio
async def test_score_no_aceptado_del_payload(agent):
    agent._calculate_score = AsyncMock(return_value=70)
    agent._check_incumplimientos = AsyncMock(return_value=0)
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1", "supplier_score": 99})
    assert result["output"]["supplier_score"] != 99

@pytest.mark.asyncio
async def test_score_ponderado_correcto(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"score_precio": 100, "score_calidad": 100, "score_tiempo": 100}
        ])
    )
    # Score real method unmockeado
    res = await agent._calculate_score("sup1")
    # 100*0.3 + 100*0.4 + 100*0.3 = 100
    assert res == 100

@pytest.mark.asyncio
async def test_score_clamp_min_0_max_100(agent, mock_supabase):
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[
            {"score_precio": -50, "score_calidad": 200, "score_tiempo": 500}
        ])
    )
    res = await agent._calculate_score("sup1")
    # Clamped in query loop to [0,100]. So: precio=0, calidad=100, tiempo=100
    # 0*0.3 + 100*0.4 + 100*0.3 = 70
    assert res == 70

@pytest.mark.asyncio
async def test_3_incumplimientos_suspende(agent):
    agent._calculate_score = AsyncMock(return_value=90)
    agent._check_incumplimientos = AsyncMock(return_value=3)
    agent._count_active_suppliers = AsyncMock(return_value=3) # 3 > 2, allowed
    
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1"})
    assert result["output"]["supplier_status"] == "suspended"
    assert result["output"]["action_taken"] == "suspended_auto"

@pytest.mark.asyncio
async def test_2_incumplimientos_no_suspende(agent):
    agent._calculate_score = AsyncMock(return_value=90)
    agent._check_incumplimientos = AsyncMock(return_value=2)
    
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1"})
    assert result["output"]["supplier_status"] == "active"

@pytest.mark.asyncio
async def test_suspender_no_si_ultimo_proveedor(agent):
    agent._calculate_score = AsyncMock(return_value=90)
    agent._check_incumplimientos = AsyncMock(return_value=3)
    # If suspended, would leave 1. So active count is 2 right now.
    # The requirement: "Mantener mínimo 2 proveedores por categoría". 
    # That means if count > 2, suspend. If count <= 2, don't.
    agent._count_active_suppliers = AsyncMock(return_value=2)
    
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1"})
    assert result["output"]["supplier_status"] == "active"
    assert result["output"]["alert_sent"] is True

@pytest.mark.asyncio
async def test_score_menor_40_alerta_socias(agent):
    agent._calculate_score = AsyncMock(return_value=30)
    agent._check_incumplimientos = AsyncMock(return_value=0)
    
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1"})
    assert result["output"]["alert_sent"] is True
    agent._notify_socias.assert_called()

@pytest.mark.asyncio
async def test_supplier_id_filtrado_tenant_id(agent, mock_supabase):
    agent._calculate_score = SupplierRelationsAgent._calculate_score.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock()
    await agent.run({"event_type": "quarterly_review", "supplier_id": "SUPXX"})
    mock_supabase.table.return_value.select.return_value.eq.assert_called_with("tenant_id", "t1")

@pytest.mark.asyncio
async def test_issue_details_sanitizado(agent):
    # LLM injection or bad chars
    result = await agent.run({"event_type": "quality_issue", "supplier_id": "sup1", "issue_details": "bad text ; DROP TABLE!"})
    # Since it is a void process returning default things, we can just check the sanitize method directly
    sanitized = agent._sanitize_details("bad text ; DROP TABLE!")
    assert ";" not in sanitized

@pytest.mark.asyncio
async def test_tenant_isolation_evaluations(agent, mock_supabase):
    agent._check_incumplimientos = SupplierRelationsAgent._check_incumplimientos.__get__(agent)
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute = AsyncMock()
    await agent.run({"event_type": "quarterly_review", "supplier_id": "SUPXX"})
    mock_supabase.table.return_value.select.return_value.eq.assert_any_call("tenant_id", "t1")

@pytest.mark.asyncio
async def test_quarterly_review_completo(agent):
    agent._calculate_score = AsyncMock(return_value=85)
    agent._check_incumplimientos = AsyncMock(return_value=1)
    
    result = await agent.run({"event_type": "quarterly_review", "supplier_id": "sup1"})
    assert result["output"]["supplier_score"] == 85
    assert result["output"]["supplier_status"] == "active"
    assert result["output"]["alert_sent"] is False
