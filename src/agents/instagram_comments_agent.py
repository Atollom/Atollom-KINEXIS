# src/agents/instagram_comments_agent.py
import logging
import re
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class InstagramCommentsAgent(BaseAgent):
    """
    Agente #14: Instagram Comments Agent.
    Modera comentarios, responde a preguntas y gestiona reclamos técnicos (ácidos).
    """

    # Videos informativos para reclamos comunes (Kap Tools)
    ACID_VIDEOS = {
        "oro": "https://kinexis.app/v/acid-gold-tutorial",
        "plata": "https://kinexis.app/v/acid-silver-tutorial"
    }

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="instagram_comments_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clasifica, modera y responde a comentarios en posts de Instagram.
        """
        # 1. Verificar firma HMAC
        webhook_payload = data.get("webhook_payload", {})
        signature = data.get("x_hub_signature", "")
        payload_bytes = data.get("payload_bytes", b"")
        
        if payload_bytes and signature:
            is_valid = await self.meta_adapter.verify_webhook_signature(payload_bytes, signature)
            if not is_valid:
                return {"status": "error", "message": "Invalid HMAC signature", "reply_sent": False}

        # 2. Sanitizar comment_text
        raw_comment = data.get("comment_text", "")
        clean_comment = self._sanitize_comment(raw_comment)

        # 3. Clasificar comentario
        classification = await self._classify_comment(clean_comment)
        
        # 4. Determinar si ocultar (Solo spam o lenguaje ofensivo)
        should_hide = await self._should_hide(clean_comment, classification)
        comment_hidden = False
        if should_hide:
            comment_hidden = await self.meta_adapter.hide_instagram_comment(data.get("comment_id"))

        # 5. Construir respuesta
        reply_sent = False
        if classification != "spam":
            reply_text = await self._build_reply(classification, clean_comment)
            if reply_text:
                reply_sent = await self.meta_adapter.post_instagram_comment_reply(data.get("comment_id"), reply_text)

        # 9. Registrar en crm_interactions
        await self._log_interaction(data.get("commenter_id"), clean_comment, classification)

        return {
            "reply_sent": reply_sent,
            "comment_hidden": comment_hidden,
            "intent_detected": classification,
            "lead_created": False # Comments usually don't create leads directly, they invite to DM
        }

    def _sanitize_comment(self, text: str) -> str:
        """Limpieza básica de spam/html."""
        if not text: return ""
        text = re.sub(r'<[^>]*>', '', text)
        return text.strip()[:500]

    async def _classify_comment(self, text: str) -> str:
        """Clasifica el comentario usando Regex + LLM fallback."""
        text_lower = text.lower()
        
        # Spam/Abuso
        spam_patterns = [r'http[s]?://', r'www\.', r'\.com', r'ganar dinero', r'bit\.ly']
        if any(re.search(p, text_lower) for p in spam_patterns):
            return "spam"
        
        # Reclamo Ácido
        if "acido" in text_lower or "ácido" in text_lower or "no funciona" in text_lower:
            return "reclamo_acido"
        
        # Positivo
        positive_keywords = ["excelente", "genial", "gracias", "recomendado", "buenisimo", "top"]
        if any(kw in text_lower for kw in positive_keywords):
            return "positivo"
        
        # Pregunta
        if "?" in text or any(kw in text_lower for kw in ["precio", "costo", "donde", "donde compro", "envi"]):
            return "pregunta"
        
        return "neutral"

    async def _should_hide(self, text: str, classification: str) -> bool:
        """Ocultar solo si es spam o lenguaje ofensivo (NUNCA críticas legítimas)."""
        if classification == "spam":
            return True
        
        offensive_keywords = ["estafa", "robo", "pendejo"] # Lista base para el scaffold
        if any(kw in text.lower() for kw in offensive_keywords):
            return True
            
        return False

    async def _build_reply(self, classification: str, text: str) -> str:
        """Construye respuesta personalizada (Max 150 chars)."""
        if classification == "positivo":
            return "¡Muchas gracias por tu comentario! Nos alegra que te guste la calidad Kap Tools. 🛠️"
        
        if classification == "reclamo_acido":
            kind = "oro" if "oro" in text.lower() else "plata"
            video = self.ACID_VIDEOS.get(kind, self.ACID_VIDEOS["plata"])
            return f"Es un producto profesional y su uso es técnico. Mira el tutorial: {video}. Te contactamos a DM."
        
        if classification == "pregunta":
            return "Con gusto te apoyamos con la información técnica y de envío. Te enviamos los detalles por DM ahora mismo. 📬"
        
        return "¡Gracias por escribirnos! Enseguida te contactamos por DM para darte una atención personalizada. ✨"

    async def _log_interaction(self, user_id: str, message: str, intent: str):
        """Registro en BD."""
        try:
            interaction_data = {
                "tenant_id": self.tenant_id,
                "platform": "instagram_comment",
                "external_id": user_id,
                "message_in": message,
                "intent": intent,
                "created_at": self._get_now().isoformat()
            }
            await self._insert_crm_interaction(interaction_data)
        except Exception as e:
            logger.error("Error logging IG comment: %s", e)

    async def _insert_crm_interaction(self, data: dict):
        return await self.supabase.table("crm_interactions").insert(data).execute()

    # Stubs
    async def get_vault_secrets(self, tenant_id: str, keys: list) -> dict: return {}
