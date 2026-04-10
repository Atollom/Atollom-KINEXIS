# src/agents/ml_question_handler_agent.py
import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from src.adapters.ml_adapter import MLAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Límite de chars del buyer que entran al prompt (mitigación de prompt injection)
_MAX_QUESTION_IN_PROMPT = 500

# Patrones de prompt injection básicos (instrucciones de override)
_INJECTION_PATTERN = re.compile(
    r"(ignore|forget|disregard|override)\s+(all\s+)?"
    r"(previous|prior|above|earlier)\s+(instructions?|context|rules?|directives?)",
    flags=re.IGNORECASE,
)


class MLQuestionHandlerAgent(BaseAgent):
    """
    Agente #2: ML Question Handler.
    Gestiona respuestas inteligentes en Mercado Libre con lógica B2B y reglas Kap Tools.
    """

    SYSTEM_PROMPT_TEMPLATE = """
Eres el asistente de ventas de Kap Tools SA de CV.
Respondes preguntas de compradores en Mercado Libre.
Catálogo: herramientas de micro-relojería, lupas,
calibradores, reactivos químicos, ácidos de prueba
para joyería, baterías de reloj.

REGLAS ABSOLUTAS:
- Responde en español mexicano, tono amable y profesional
- NUNCA prometas fechas de entrega específicas
- NUNCA menciones precios de competidores
- Si stock = 0: "Por el momento no contamos con
  disponibilidad. Te notificaremos cuando tengamos stock."
- Si preguntan por ácidos y dicen que no funciona:
  Incluir el video correspondiente + aclarar que es
  producto profesional que requiere experiencia previa
- Respuesta máxima: 800 caracteres

VIDEOS DE SOPORTE (incluir cuando aplique):
- Ácido de plata: https://youtu.be/9nINypdi-6w
- Ácido de oro (10K,14K,18K): https://youtu.be/pV_I49L6J2o

Contexto del producto: {product_context}
Stock actual: {stock_qty} unidades disponibles
Historial del comprador: {buyer_history}
"""

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(tenant_id, agent_id="ml_question_handler_agent_v1", supabase_client=supabase_client)
        self.ml_adapter = MLAdapter(tenant_id=tenant_id, db_client=supabase_client)

    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Punto de entrada compatible con BaseAgent.run()."""
        return await self.execute(input_data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Lógica principal de atención a preguntas.
        Tiempo de respuesta esperado: <10s (incluye LLM call).
        """
        question_id = data.get("question_id")
        item_id = data.get("item_id")
        question_text = data.get("question_text") or ""
        buyer_id = data.get("buyer_id")

        # Validación de campos requeridos
        if not question_id:
            return {"error": "question_id requerido", "answer_published": False}
        if not item_id:
            return {"error": "item_id requerido", "answer_published": False}

        # SECURITY_FIX: tenant_id SIEMPRE desde self — nunca del payload (R3)
        # El payload puede venir de un caller no confiable.
        tenant_id = self.tenant_id

        # 1. Cargar credenciales ML
        await self.ml_adapter.load_credentials()

        # 2. Obtener contexto del producto
        product_context = await self.ml_adapter.get_item(item_id)

        # 3. Consultar stock real (caché 15 min) — query usa self.tenant_id
        stock_data = await self._get_stock_realtime(item_id)
        stock_qty = stock_data["qty"]
        is_stale = stock_data.get("stale", False)

        # 4. Historial del comprador (stub Fase 1)
        buyer_history = "Sin compras previas registradas."

        # 5. Detección B2B
        is_b2b = await self._detect_b2b_intent(question_text, data.get("qty", 0))

        # 6. Generar respuesta con Claude
        try:
            answer_text = await self._build_answer(
                product_context=product_context,
                stock_qty=stock_qty,
                buyer_history=buyer_history,
                question_text=question_text,
                is_stale=is_stale,
            )
        except Exception as e:
            # CLAUDE_FIX: si LLM falla, NO publicar respuesta vacía — escalar
            logger.error(
                "LLM generation failed for question_id=%s tenant=%s: %s",
                question_id, tenant_id, e,
            )
            return {
                "answer_text": None,
                "is_b2b_lead": is_b2b,
                "answer_published": False,
                "crm_interaction_id": None,
                "error": "llm_generation_failed",
            }

        # 7. Publicar respuesta
        publish_result = await self.ml_adapter.post_answer(question_id, answer_text)
        # CLAUDE_FIX: case-insensitive check — ML API puede retornar "ACTIVE" o "active"
        answer_published = publish_result.get("status", "").lower() == "active"

        # 8. Registro en CRM (inbound + outbound en paralelo)
        crm_id = await self._register_interactions(buyer_id, question_text, answer_text)

        # 9. Si B2B → Crear Lead (sin duplicados)
        if is_b2b:
            await self._create_lead(buyer_id, crm_id)

        return {
            "answer_text": answer_text,
            "is_b2b_lead": is_b2b,
            "answer_published": answer_published,
            "crm_interaction_id": crm_id,
        }

    # ─────────────────────────── B2B DETECTION ───────────────────────────── #

    async def _detect_b2b_intent(self, text: str, qty: int) -> bool:
        """Detecta intención B2B: cantidad directa → regex → LLM (en ese orden)."""
        if qty > 10:
            return True

        if not text:
            return False

        patterns = [
            r"\b(\d+)\s*(piezas?|unidades?|pzas?)\b",
            r"\bpor\s+mayor\b",
            r"\bmayoreo\b",
            r"\bRFC\b",
            r"\bfactura\b",
            r"\blista\s+de\s+precios?\b",
            r"\bvolumen\b",
            r"\bpedido\s+grande\b",
        ]
        for p in patterns:
            if re.search(p, text, re.IGNORECASE):
                return True

        # LLM tiebreaker — solo si regex no concluyó (stub Fase 1)
        return False

    # ─────────────────────────── STOCK ───────────────────────────────────── #

    async def _get_stock_realtime(self, item_id: str) -> Dict[str, Any]:
        """
        Consulta inventario con caché de 15 minutos.
        SECURITY_FIX: usa self.tenant_id — nunca el tenant_id del payload.
        Si Supabase falla, retorna stale=True con qty=0 (conservador, no crash).
        """
        try:
            res = await (
                self.supabase.table("inventory")
                .select("stock, updated_at")
                .eq("tenant_id", self.tenant_id)  # R3: filtro tenant_id SIEMPRE
                .eq("sku", item_id)
                .single()
                .execute()
            )

            if res.data:
                updated_at_raw = res.data.get("updated_at", "")
                if updated_at_raw:
                    last_sync = datetime.fromisoformat(
                        updated_at_raw.replace("Z", "+00:00")
                    )
                    if datetime.now(last_sync.tzinfo) - last_sync < timedelta(minutes=15):
                        return {"qty": res.data["stock"], "stale": False}

            qty = res.data["stock"] if res.data else 0
            return {"qty": qty, "stale": True}

        except Exception as e:
            logger.error(
                "Stock query failed for item=%s tenant=%s: %s",
                item_id, self.tenant_id, e,
            )
            # Fail safe: conservador, no crash
            return {"qty": 0, "stale": True}

    # ─────────────────────────── LLM ANSWER ──────────────────────────────── #

    def _sanitize_for_prompt(self, text: str, max_len: int = _MAX_QUESTION_IN_PROMPT) -> str:
        """
        Sanitiza input del comprador antes de insertar en el prompt del LLM.
        SECURITY_FIX: mitigación básica de prompt injection.
        """
        if not text:
            return ""
        text = text[:max_len]
        # Eliminar patrones de override de instrucciones
        text = _INJECTION_PATTERN.sub("[contenido eliminado]", text)
        return text.strip()

    async def _build_answer(self, **kwargs) -> str:
        """
        Llama a Claude para generar la respuesta final.
        Valida que la respuesta no sea vacía antes de retornarla.
        """
        # SECURITY_FIX: sanitizar pregunta del comprador antes de insertar en prompt
        safe_question = self._sanitize_for_prompt(kwargs["question_text"])

        system_prompt = self.SYSTEM_PROMPT_TEMPLATE.format(
            product_context=kwargs["product_context"],
            stock_qty=kwargs["stock_qty"],
            buyer_history=kwargs["buyer_history"],
        )

        prompt = safe_question
        if kwargs.get("is_stale"):
            prompt += "\n(Nota interna: El stock no está verificado recientemente. Sé conservador.)"

        response = await self.ai_client.generate_response(prompt, system_prompt=system_prompt)

        # CLAUDE_FIX: YAML valida no_empty_answer — nunca publicar respuesta vacía
        if not response or not response.strip():
            raise RuntimeError(
                "LLM retornó respuesta vacía — se rechaza para no publicar nada en ML"
            )

        return response[:800]

    # ─────────────────────────── CRM / LEADS ─────────────────────────────── #

    async def _register_interactions(
        self, buyer_id: Optional[str], question: str, answer: str
    ) -> Optional[str]:
        """
        Registra inbound (pregunta) y outbound (respuesta) en CRM en paralelo.
        CLAUDE_FIX: paralelo con asyncio.gather() — antes era secuencial.
        """
        inbound_payload = {
            "tenant_id": self.tenant_id,
            "customer_id": buyer_id,
            "channel": "mercadolibre",
            "direction": "inbound",
            "content": question,
            "agent_id": self.agent_id,
        }
        outbound_payload = {
            "tenant_id": self.tenant_id,
            "customer_id": buyer_id,
            "channel": "mercadolibre",
            "direction": "outbound",
            "content": answer,
            "agent_id": self.agent_id,
        }
        try:
            inbound_res, _ = await asyncio.gather(
                self.supabase.table("crm_interactions").insert(inbound_payload).execute(),
                self.supabase.table("crm_interactions").insert(outbound_payload).execute(),
            )
            return inbound_res.data[0]["id"]
        except Exception as e:
            logger.error(
                "CRM interaction insert failed for tenant=%s buyer=%s: %s",
                self.tenant_id, buyer_id, e,
            )
            raise

    async def _lead_exists(self, buyer_id: Optional[str]) -> bool:
        """Verifica si ya existe un lead activo para este buyer en este tenant."""
        if not buyer_id:
            return False
        try:
            res = await (
                self.supabase.table("leads")
                .select("id")
                .eq("tenant_id", self.tenant_id)
                .eq("name", buyer_id)
                .eq("status", "new")
                .execute()
            )
            return bool(res.data)
        except Exception as e:
            logger.error("Lead exists check failed for tenant=%s: %s", self.tenant_id, e)
            return False  # Fail safe: no bloquear el flujo por error de check

    async def _create_lead(self, buyer_id: Optional[str], interaction_id: Optional[str]) -> None:
        """
        Crea un lead B2B. CLAUDE_FIX: verifica duplicado antes de insertar.
        """
        if not buyer_id:
            logger.warning("_create_lead llamado sin buyer_id — omitiendo")
            return

        if await self._lead_exists(buyer_id):
            logger.info(
                "Lead ya existe para buyer=%s tenant=%s — no se duplica",
                buyer_id, self.tenant_id,
            )
            return

        try:
            await self.supabase.table("leads").insert({
                "tenant_id": self.tenant_id,
                "name": buyer_id,
                "channel": "mercadolibre",
                "score": 7,
                "type": "b2b",
                "status": "new",
                "source_interaction_id": interaction_id,
            }).execute()
            logger.info("Lead creado para buyer=%s tenant=%s score=7", buyer_id, self.tenant_id)
        except Exception as e:
            logger.error(
                "Lead insert failed for tenant=%s buyer=%s: %s",
                self.tenant_id, buyer_id, e,
            )
            raise
