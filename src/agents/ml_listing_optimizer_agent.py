import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, Optional

from src.adapters.meta_adapter import MetaAdapter
from src.adapters.ml_adapter import MLAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Caracteres prohibidos en títulos de ML
ML_FORBIDDEN_CHARS = frozenset([
    '!', '@', '#', '$', '%', '^', '&', '*',
    '(', ')', '+', '=', '[', ']', '{', '}',
    '|', '\\', '<', '>', '?', '/', '"'
])

class MLListingOptimizerAgent(BaseAgent):
    """
    Agente #4: ML Listing Optimizer.
    Optimiza títulos, descripciones y precios de publicaciones en Mercado Libre.
    Requiere guardar propuestas y notificar antes de aplicar.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="ml_listing_optimizer_agent_v1", supabase_client=supabase_client
        )
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=self)
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        1. Obtener listing
        2. Obtener producto de Supabase
        3. Optimizar según optimization_type
        4. Guardar propuesta
        5. NOTIFY
        """
        item_id = data.get("item_id")
        sku = data.get("sku")
        opt_type = data.get("optimization_type")

        if not item_id or not sku or not opt_type:
            raise ValueError("item_id, sku, optimization_type son requeridos")

        product = await self._query_product(sku)
        if not product:
            raise RuntimeError(f"Producto {sku} no encontrado en inventory")

        # Mock ML fetch, already handled by ml_adapter or we assume current values from product logic
        # if in production: item_info = await self.ml_adapter.get_item(item_id)
        current_title = product.get("name", "")
        current_desc = product.get("description", "")
        current_price = Decimal(str(product.get("price_ml", 0)))

        optimized_title = None
        optimized_desc = None
        suggested_price = None
        requires_approval = True  # Business rule: NOTIFY socias antes de aplicar (siempre aprueban precio/titulo)

        # 3. Optimizar
        if opt_type in ["title", "all"]:
            optimized_title = await self._optimize_title(current_title, product)
            if optimized_title != current_title:
                await self._save_proposal(sku, item_id, "title", current_title, optimized_title)

        if opt_type in ["description", "all"]:
            optimized_desc = await self._optimize_description(current_desc, product)
            # if optimized_desc != current_desc: # ignoring diff check for simplicity
            await self._save_proposal(sku, item_id, "description", current_desc, optimized_desc)

        if opt_type in ["price", "all"]:
            suggested_price = await self._suggest_price(current_price, sku, product)
            if suggested_price != current_price:
                await self._save_proposal(sku, item_id, "price", str(current_price), str(suggested_price))
                # Validate > 15% 
                if current_price > 0:
                    change_pct = abs(float((suggested_price - current_price) / current_price))
                    if change_pct > 0.15:
                        requires_approval = True

        # 4. Notify - Best effort
        await self._notify_socias(sku, item_id)

        return {
            "optimized_title": optimized_title,
            "optimized_description": optimized_desc,
            "suggested_price": float(suggested_price) if suggested_price else None,
            "changes_applied": False, # Business rule: NO aplicar hasta aprobación
            "requires_approval": requires_approval
        }

    async def _optimize_title(self, current: str, product: dict) -> str:
        sanitized = await self._sanitize_for_prompt(current)
        # Mock AI generation: Append " Premium"
        new_title = f"{sanitized} Premium"
        
        # Strip forbidden characters
        clean_title = "".join(c for c in new_title if c not in ML_FORBIDDEN_CHARS)
        
        return clean_title[:60].strip()

    async def _optimize_description(self, current: str, product: dict) -> str:
        sanitized = await self._sanitize_for_prompt(current)
        # Mock AI generation: Append keywords
        new_desc = f"{sanitized}\nPalabras clave SEO: relojería, precisión, joyería, micro-herramientas"
        return new_desc[:500]

    async def _suggest_price(self, current_price: Decimal, sku: str, product: dict) -> Decimal:
        cost = Decimal(str(product.get("cost", 0)))
        
        rules = await self._query_tenant_business_rules()
        min_margin = Decimal(str(rules.get("ml_min_margin", 0.30)))

        min_price = cost * (Decimal("1.0") + min_margin)
        min_price = min_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # MOCK AI SUGGESTION
        suggested = current_price * Decimal("1.05") 

        # Business Rule: NUNCA bajar precio por debajo del mínimo
        if suggested < min_price:
            suggested = min_price

        return suggested.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def _save_proposal(self, sku: str, item_id: str, prop_type: str, current_val: str, proposed_val: str):
        data = {
            "tenant_id": self.tenant_id,
            "sku": sku,
            "item_id": item_id,
            "proposal_type": prop_type,
            "current_value": current_val,
            "proposed_value": proposed_val,
            "status": "pending",
            "created_at": self._get_now().isoformat()
        }
        await self.supabase.table("listing_proposals").insert(data).execute()

    async def _notify_socias(self, sku: str, item_id: str):
        try:
            # await self.meta_adapter.send_whatsapp("SOCIAS", f"Propuestas para {sku}")
            pass
        except Exception as e:
            logger.error("Error notificando socias ml_listing sku=%s: %s", sku, e)

    async def _query_product(self, sku: str) -> Optional[dict]:
        res = await self.supabase.table("inventory").select("*").eq("tenant_id", self.tenant_id).eq("sku", sku).single().execute()
        return res.data if res and hasattr(res, 'data') else None

    async def _query_tenant_business_rules(self) -> dict:
        try:
            res = await self.supabase.table("tenant_business_rules").select("*").eq("tenant_id", self.tenant_id).single().execute()
            if res and hasattr(res, 'data') and res.data:
                return res.data
        except Exception as e:
            logger.error("Error cargando business rules tenant=%s: %s", self.tenant_id, e)
        return {}

    # Stubs
    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
