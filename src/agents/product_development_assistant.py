import logging
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class ProductDevelopmentAssistant(BaseAgent):
    """
    Agente #40: Product Development Assistant.
    Asistente de I+D usando ML/Claude. Requiere supervisión siempre (NOTIFY).
    Inversión máxima permitida sin aprobación = $0.00
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="product_development_assistant_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Siempre requere approval.
        Inputs: request_type, category, budget_max
        """
        request_type = data.get("request_type")
        if not request_type:
             raise ValueError("request_type es obligatorio")

        category = data.get("category", "")
        if category:
             category = self._sanitize_category(category)

        # Budget parsing
        rules = await self._query_tenant_business_rules()
        default_budget = rules.get("default_budget", 0)
        
        # budget_max debe ser Decimal SIEMPRE. Si viene como float: convertir a str primero
        b_max_str = str(data.get("budget_max", default_budget))
        budget_max = Decimal(b_max_str)
        if budget_max < 0:
             raise ValueError("budget_max debe ser mayor a 0")

        # Inversión máxima permitida sin aprobación es $0.00
        result_data = {
             "opportunities": [],
             "proposed_skus": [],
             "estimated_roi": float(Decimal("0.00")),
             "requires_approval": True, # SIEMPRE True
             "proposal_id": None
        }

        analysis = await self._analyze_sales_history()
        
        # Get target ROI
        target_roi = Decimal(str(rules.get("min_roi_percent", 35.0)))
        
        if request_type == "new_sku_proposal":
             rois = []
             # Mock a proposed SKU and calculate ROI
             cost = Decimal("100.00")
             suggested_price = Decimal("150.00")
             roi = await self._calculate_roi(cost, suggested_price, 10.0)
             if roi >= target_roi:
                  result_data["proposed_skus"].append("PROPOSED-1")
                  rois.append(roi)
             if rois:
                  result_data["estimated_roi"] = float(sum(rois) / len(rois))
                  
             proposal_str = await self._generate_proposal(analysis)
             result_data["opportunities"].append(proposal_str)

        elif request_type in ["market_analysis", "competitor_analysis"]:
             pass
        else:
             raise ValueError(f"Unknown request_type: {request_type}")

        # Guardar proposal en BD
        proposal_id = await self._insert_proposal({
             "tenant_id": self.tenant_id,
             "request_type": request_type,
             "category": category,
             "proposed_skus": result_data["proposed_skus"],
             "estimated_roi": float(result_data["estimated_roi"]),
             "budget_required": float(budget_max),
             "status": "pending",
             "created_at": self._get_now().isoformat()
        })
        
        result_data["proposal_id"] = proposal_id

        await self._notify_socias("Tiene una nueva propuesta de producto.")

        return result_data

    def _sanitize_category(self, cat: str) -> str:
        return re.sub(r'[^\w\s\.-]', '', cat).strip()

    async def _analyze_sales_history(self) -> dict:
        # returns top sellers and slow movers
        return {
            "top_sellers": ["SKU-TOP"],
            "slow_movers": ["SKU-SLOW"]
        }

    async def _calculate_roi(self, cost: Decimal, suggested_price: Decimal, velocity: float) -> Decimal:
        if cost == 0:
             return Decimal("0.00")
        roi = ((suggested_price - cost) / cost) * Decimal("100.00")
        return roi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def _generate_proposal(self, analysis: dict) -> str:
        # LLM mock
        top = analysis.get("top_sellers", [])
        slow = analysis.get("slow_movers", [])
        return f"Proponemos ampliar stock de {' y '.join(top)}"

    async def _insert_proposal(self, proposal: dict) -> str:
        res = await self.supabase.table("product_proposals").insert(proposal).execute()
        return res.data[0]["id"] if res and hasattr(res, 'data') and res.data else None

    async def _query_tenant_business_rules(self) -> dict:
        try:
             res = await self.supabase.table("tenant_business_rules").select("*").eq("tenant_id", self.tenant_id).single().execute()
             if res and hasattr(res, 'data') and res.data:
                  return res.data
        except Exception:
             pass
        return {}

    async def _notify_socias(self, msg: str):
        try:
             # await self.meta_adapter.send_whatsapp("SOCIAS", msg)
             pass
        except Exception:
             pass

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
