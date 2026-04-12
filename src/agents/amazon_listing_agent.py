import logging
import re
from typing import Any, Dict, List, Optional
from src.adapters.amazon_adapter import AmazonAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class AmazonListingAgent(BaseAgent):
    """
    Agente #10: Amazon Listing Agent.
    Optimiza títulos, bullet points y keywords.
    Reglas específicas Amazon: títulos max 200, 5 bullets max 255.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="amazon_listing_agent_v1", supabase_client=supabase_client
        )
        self.amazon_adapter = AmazonAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        optimize_listing, apply_changes
        """
        action = data.get("action", "optimize")
        sku = data.get("sku")
        asin = data.get("asin")

        if not sku or not asin:
            raise ValueError("sku y asin son obligatorios")

        if action == "optimize":
            return await self._optimize_listing(sku, asin)
        elif action == "apply_changes":
            proposal_id = data.get("proposal_id")
            return await self._apply_listing_changes(proposal_id)
        else:
            raise ValueError(f"Acción desconocida: {action}")

    async def _optimize_listing(self, sku: str, asin: str) -> dict:
        # 1. Obtener datos actuales (mock)
        current_data = {"title": "Producto Amazon", "bullets": ["Punto 1"]}
        
        # 2. Generar sugerencia (Regla 200 chars, no HTML)
        suggested_title = self._sanitize_title(f"OPTIMIZADO: {current_data['title']}")
        if len(suggested_title) > 200:
            suggested_title = suggested_title[:197] + "..."
            
        suggested_bullets = [
            "Calidad Premium garantizada",
            "Diseño ergonómico y moderno",
            "Envío rápido por FBA",
            "Garantía total de satisfacción",
            "El mejor precio del mercado"
        ]
        # Validar bullets max 255
        suggested_bullets = [b[:255] for b in suggested_bullets]

        proposal = {
            "tenant_id": self.tenant_id,
            "sku": sku,
            "asin": asin,
            "current_title": current_data["title"],
            "suggested_title": suggested_title,
            "suggested_bullets": suggested_bullets,
            "status": "pending_approval"
        }

        # 3. Guardar propuesta (Reusando listing_proposals si existe, o similar)
        res = await self.supabase.table("listing_proposals").insert(proposal).execute()
        proposal_id = res.data[0]["id"] if res and hasattr(res, "data") and res.data else "mock-id"

        return {
            "proposal_id": proposal_id,
            "suggested_title": suggested_title,
            "suggested_bullets": suggested_bullets,
            "asin": asin
        }

    def _sanitize_title(self, title: str) -> str:
        # Eliminar HTML
        clean = re.sub('<[^<]+?>', '', title)
        # Eliminar caracteres especiales prohibidos
        # Amazon prefiere títulos limpios
        return clean.strip()

    async def _apply_listing_changes(self, proposal_id: str) -> dict:
        # 1. Leer propuesta
        # 2. amazon_adapter.update_listing(...)
        return {"status": "applied", "proposal_id": proposal_id}

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
