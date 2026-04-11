import logging
from datetime import datetime, time
from typing import Any, Dict, List, Optional
from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class InstagramContentPublisher(BaseAgent):
    """
    Agente #15: Instagram Content Publisher.
    Propone contenido para Instagram (feed/stories).
    requires_approval=True SIEMPRE. Solo guarda en content_proposals.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="instagram_content_publisher_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        schedule_post, create_story
        """
        action = data.get("action", "schedule_post")
        content = data.get("content", {})
        
        if not content.get("image_url") or not content.get("caption"):
            raise ValueError("image_url y caption son obligatorios")

        # 1. Validar caption (IG max 2200)
        caption = content.get("caption", "")
        if len(caption) > 2200:
            caption = caption[:2197] + "..."

        # 2. Agregar hashtags (min 3)
        hashtags = content.get("hashtags", [])
        if len(hashtags) < 3:
            hashtags.extend(["#ecommerce", "#kinexis", "#marketing"])
        
        # 3. Validar horario óptimo
        scheduled_at = data.get("scheduled_at")
        warning = None
        if scheduled_at:
            is_optimal, suggestion = self._check_optimal_time(scheduled_at)
            if not is_optimal:
                warning = f"Sugerencia: El horario óptimo es {suggestion} CDMX."

        # 4. Guardar propuesta (requiere aprobación)
        proposal = {
            "tenant_id": self.tenant_id,
            "action": action,
            "image_url": content.get("image_url"),
            "caption": caption,
            "product_sku": content.get("product_sku"),
            "hashtags": hashtags,
            "scheduled_at": scheduled_at,
            "status": "pending"
        }

        res = await self.supabase.table("content_proposals").insert(proposal).execute()
        proposal_id = res.data[0]["id"] if res and hasattr(res, "data") and res.data else "mock-id"

        return {
            "proposal_id": proposal_id,
            "requires_approval": True,
            "status": "pending",
            "warning": warning,
            "hashtags_added": len(hashtags)
        }

    def _check_optimal_time(self, dt_str: str) -> (bool, str):
        try:
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            hr = dt.hour
            # Óptimo: 12PM-2PM (12-14) y 7PM-9PM (19-21)
            if (12 <= hr <= 14) or (19 <= hr <= 21):
                return True, ""
            return False, "12:00 PM - 02:00 PM o 07:00 PM - 09:00 PM"
        except ValueError as e:
            logger.error("Error parsing scheduled_at '%s': %s", dt_str, e)
            return True, ""

    async def get_vault_secrets(self, t, k): return {}
    async def get_vault_secret(self, t, s): return {}
