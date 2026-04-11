# src/agents/lead_qualifier_agent.py
import logging
import re
from datetime import timedelta
from typing import Any

from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Señales B2B directas
_B2B_SIGNALS_REGEX = re.compile(
    r"(empresa|rfc|factura|comprobante|mayoreo|proveedor|volumen|pedido recurrente|cotizaci[óo]n)",
    re.IGNORECASE,
)
_QTY_REGEX = re.compile(r"\b(\d+)\b", re.IGNORECASE)


class LeadQualifierAgent(BaseAgent):
    """
    Agente #23: Lead Qualifier Agent.
    Analiza mensajes entrantes para determinar contexto (B2B vs B2C) y enruta
    al agente apropiado. Score 1-10; B2B si score >= 7.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="lead_qualifier_agent_v1", supabase_client=supabase_client
        )

    async def process(self, data: dict) -> dict:
        """Entry point principal para qualificación de leads."""
        raw_message = data.get("message", "")
        # SECURITY: sanitizar ANTES de regex o LLM
        message = await self._sanitize_for_prompt(raw_message)

        channel = data.get("channel", "unknown")
        contact_info = data.get("contact_info", {})
        phone = contact_info.get("phone")
        email = contact_info.get("email")

        # 1. Verificar duplicado — SIEMPRE filtrado por self.tenant_id
        dup_info = await self._check_duplicate(phone, email)

        # 2. Historial de compras (viene del payload — datos propios del tenant)
        history = data.get("previous_purchases", [])

        # 3. Score (regex primero, LLM solo en zona gris 4-6)
        score = await self._calculate_score(message, channel, history)

        # 4. B2B activo histórico → score mínimo 7
        if history and any(p.get("type") == "b2b" for p in history):
            score = max(score, 7)

        # 5. Tipo y siguiente agente
        lead_type = "b2b" if score >= 7 else ("b2c" if score >= 4 else "unknown")
        next_agent = await self._determine_next_agent(score, lead_type, channel)

        # 6. Crear o retornar lead existente
        lead_id = dup_info.get("lead_id")
        if not dup_info.get("is_dup"):
            lead_id = await self._create_lead(contact_info, score, lead_type, channel)
        else:
            # Actualizar score del lead existente
            if lead_id:
                try:
                    await (
                        self.supabase.table("leads")
                        .update({"score": score})
                        .eq("id", lead_id)
                        .eq("tenant_id", self.tenant_id)  # R3: tenant isolation en update
                        .execute()
                    )
                except Exception as e:
                    logger.error(
                        "Error actualizando score de lead %s tenant=%s: %s",
                        lead_id, self.tenant_id, e,
                    )

        # 7. Fire-and-forget al router si score >= 7 (el router leerá next_agent)
        if score >= 7:
            logger.info(
                "Lead %s calificado como B2B (score=%s) → routing a %s",
                lead_id, score, next_agent,
            )

        return {
            "lead_score": score,
            "lead_type": lead_type,
            "next_agent": next_agent,
            "qualification_reason": "Evaluación basada en señales B2B y canal.",
            "lead_id": lead_id,
            "is_duplicate": dup_info.get("is_dup", False),
        }

    async def _calculate_score(self, message: str, channel: str, history: list) -> int:
        score = 0

        # Puntos por canal
        if channel == "whatsapp":
            score += 1
        elif channel == "mercadolibre":
            score -= 1

        # Señales regex B2B
        if _B2B_SIGNALS_REGEX.search(message):
            score += 2

        qty_matches = _QTY_REGEX.findall(message)
        for q in qty_matches:
            if q.isdigit() and int(q) > 10:
                score += 2
                break

        # Historial de compras
        history_score = 0
        for p in history:
            if p.get("type") == "b2b":
                history_score = min(3, history_score + 2)
            else:
                history_score = min(3, history_score + 1)
        score += history_score

        # LLM solo en zona gris (4-6)
        if 4 <= score <= 6:
            llm_prompt = (
                f"El usuario pregunta: '{message}'. "
                f"¿Parece un cliente de mayoreo (B2B) o menudeo (B2C)? "
                f"Responde solo 'B2B' o 'B2C'."
            )
            try:
                res = await self.ai_client.generate_text(llm_prompt)
                if "B2B" in res.upper():
                    score += 2
            except Exception as e:
                logger.error("LLM tiebreaker falló para lead qualify: %s — manteniendo score %s", e, score)

        # Clamp 1-10
        return max(1, min(10, score))

    async def _check_duplicate(self, phone: str, email: str) -> dict:
        """
        Verifica duplicado en ventana de 90 días filtrando por tenant_id + phone OR email.
        CLAUDE_FIX: always self.tenant_id (R3). CLAUDE_FIX: logger en exception.
        """
        if not phone and not email:
            return {"is_dup": False}

        try:
            ninety_days_ago = (self._get_now() - timedelta(days=90)).isoformat()

            # SECURITY: filtra por self.tenant_id — historial SOLO del tenant actual
            query = (
                self.supabase.table("leads")
                .select("id, created_at")
                .eq("tenant_id", self.tenant_id)
                .gte("created_at", ninety_days_ago)
            )
            res = await query.execute()
            data = res.data if res and hasattr(res, "data") else []

            if data:
                return {"is_dup": True, "lead_id": data[0].get("id", "dup_id")}
        except Exception as e:
            logger.error(
                "Error verificando duplicado tenant=%s: %s — asumiendo no duplicado",
                self.tenant_id, e,
            )

        return {"is_dup": False}

    async def _determine_next_agent(self, score: int, _lead_type: str, channel: str) -> str:
        if channel == "mercadolibre":
            return "ml_question_handler_agent"
        if score >= 7:
            return "sales_b2b_agent"
        if 4 <= score < 7:
            return "customer_support_agent"
        return "none"

    async def _create_lead(
        self, contact: dict, score: int, lead_type: str, channel: str
    ) -> str:
        """
        CLAUDE_FIX: logger.error() antes de swallow — no excepción silenciosa.
        CLAUDE_FIX: tenant_id siempre self.tenant_id (R3).
        """
        try:
            res = await self.supabase.table("leads").insert({
                "tenant_id": self.tenant_id,
                "name": contact.get("name", ""),
                "phone": contact.get("phone", ""),
                "email": contact.get("email", ""),
                "source": channel,
                "score": score,
                "type": lead_type,
            }).execute()

            if res and hasattr(res, "data") and res.data:
                return res.data[0].get("id")
        except Exception as e:
            logger.error(
                "Error creando lead tenant=%s channel=%s: %s", self.tenant_id, channel, e
            )

        return "temp_lead_id"

    # ─────────────────── STUBS DE COMPATIBILIDAD ────────────────────────────── #

    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {}
