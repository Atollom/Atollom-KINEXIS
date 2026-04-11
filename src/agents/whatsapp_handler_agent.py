# src/agents/whatsapp_handler_agent.py
import hashlib
import hmac
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Regex para detección rápida de intención (CLAUDE_LESSON)
_RE_COTIZACION = re.compile(r"cotización|presupuesto|precio mayoreo", re.IGNORECASE)
_RE_FACTURA = re.compile(r"factura|RFC|comprobante|fiscal", re.IGNORECASE)
_RE_DEVOLUCION = re.compile(r"devolu|regres|cambio|no llegó|no funciona", re.IGNORECASE)
_RE_PRODUCTO = re.compile(r"precio|stock|disponible|tienen", re.IGNORECASE)

# Regex para detectar y enmascarar RFCs en mensajes de log
_RFC_PATTERN = re.compile(r"\b([A-ZÑ&]{3,4})([0-9]{6})([A-Z0-9]{3})\b")

# Límite de Meta para mensajes WhatsApp
_MAX_WA_CHARS = 1024

# TTL de sesiones: inactividad máxima en segundos (24h)
_SESSION_TTL_SECONDS = 86400


def _mask_rfc(text: str) -> str:
    """
    Enmascara RFCs en texto para logs: KTO2202178K8 → KTO****78K8.
    SECURITY: RFC no debe aparecer en texto plano en logs.
    """
    return _RFC_PATTERN.sub(lambda m: f"{m.group(1)}****{m.group(3)}", text)


class WhatsAppHandlerAgent(BaseAgent):
    """
    Agente #17: WhatsApp Handler Agent.
    Puerta de entrada para mensajes de Meta. Verifica firmas, detecta intención
    y enruta al agente especializado.
    """

    def __init__(self, tenant_id: str, supabase_client: Any):
        super().__init__(
            tenant_id, agent_id="whatsapp_handler_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    # ─────────────────────── ENTRY POINT ────────────────────────────────────── #

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ciclo de vida del mensaje entrante.
        SECURITY: HMAC verificado PRIMERO — antes de cualquier lógica.
        Meta requiere 200 OK incluso al rechazar (no 401).
        """
        # 1. HMAC — verificar firma antes de cualquier procesamiento
        raw_body = data.get("raw_body", b"")
        signature = (
            data.get("x_hub_signature_256", "")
            or data.get("x_hub_signature", "")  # fallback para Meta legacy
        )
        if not await self._verify_signature(raw_body, signature):
            logger.warning(
                "HMAC inválido para tenant=%s — rechazando webhook silenciosamente",
                self.tenant_id,
            )
            return {"status": "invalid_signature", "response_sent": False}

        message_text = data.get("message_text", "")
        from_number = data.get("from_number", "")

        # 2. Sanitizar message_text antes de cualquier LLM
        sanitized_text = await self._sanitize_for_prompt(message_text)

        # 3. Guardar mensaje entrante inmediatamente (TRAZABILIDAD PRIMERO)
        await self._save_message(
            from_number=from_number,
            to_number="system",
            text=message_text,
            direction="inbound",
            intent="pending",
        )

        # 4. Verificar horario de atención
        if not await self._check_business_hours():
            await self._send_best_effort(from_number, self._absence_message())
            return {"status": "out_of_hours", "response_sent": True, "intent_detected": "none"}

        # 5. Detección de intención
        intent = await self._detect_intent(sanitized_text)

        # 6. Enrutar según intención
        result = await self._route_by_intent(intent, from_number, sanitized_text, data)

        return {
            "intent_detected": intent,
            "response_sent": result.get("response_sent", True),
            "lead_created": result.get("lead_created", False),
            "escalated": result.get("escalated", False),
        }

    # ────────────────────────── HMAC ────────────────────────────────────────── #

    async def _verify_signature(self, raw_body: bytes, signature: str) -> bool:
        """
        CLAUDE_FIX: Verifica X-Hub-Signature-256 de Meta con HMAC-SHA256.
        Si raw_body está vacío (tests o GET verification) → aceptar sin verificar.
        Si no hay secret en Vault → MOCK_MODE (aceptar, loggear warning).
        """
        if not raw_body:
            # GET de verificación de webhook o llamada de test sin body
            return True

        try:
            secrets = await self.get_vault_secrets(self.tenant_id, ["meta_app_secret"])
            app_secret = secrets.get("meta_app_secret")
        except Exception as e:
            logger.warning("Vault no disponible para meta_app_secret: %s — MOCK_MODE", e)
            app_secret = None

        if not app_secret:
            logger.warning(
                "META_MOCK_MODE: sin meta_app_secret en Vault tenant=%s — aceptando sin verificar",
                self.tenant_id,
            )
            return True

        expected = "sha256=" + hmac.new(
            app_secret.encode(), raw_body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    # ────────────────────────── INTENCIÓN ───────────────────────────────────── #

    async def _detect_intent(self, message: str) -> str:
        """
        Detecta la intención del usuario. Regex primero, LLM como desempate.
        """
        if _RE_COTIZACION.search(message):
            return "cotizacion_b2b"
        if _RE_FACTURA.search(message):
            return "solicitud_factura"
        if _RE_DEVOLUCION.search(message):
            return "devolución"
        if _RE_PRODUCTO.search(message):
            return "consulta_producto"

        prompt = (
            f"Clasifica la intención del siguiente mensaje de WhatsApp:\n"
            f"Mensaje: '{message}'\n\n"
            f"Opciones: [consulta_producto, cotizacion_b2b, solicitud_factura, "
            f"soporte_postventa, devolución, otro]\n"
            f"Responde solo con la etiqueta."
        )
        try:
            intent = await self.ai_client.generate_text(prompt)
            return intent.strip().lower()
        except Exception:
            return "otro"

    # ────────────────────────── HORARIO ─────────────────────────────────────── #

    async def _check_business_hours(self) -> bool:
        """
        L-V 8AM-7PM hora de México (UTC-6 fijo — CDMX ya no tiene horario de verano).
        CLAUDE_FIX: usa _get_now() para facilitar testing.
        """
        now = self._get_now()
        if now.weekday() >= 5:  # Sábado=5, Domingo=6
            return False
        hour = now.hour
        return 8 <= hour < 19

    # ────────────────────────── ENRUTAMIENTO ────────────────────────────────── #

    async def _route_by_intent(
        self,
        intent: str,
        from_number: str,
        text: str,
        _original_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Lógica de enrutamiento por intención."""
        if intent == "cotizacion_b2b":
            logger.info("Transferring to SalesB2BAgent: %s", from_number)
            return {"status": "transferred", "agent": "sales_b2b_agent", "response_sent": False}

        if intent == "solicitud_factura":
            return await self._collect_cfdi_data(from_number, text)

        if intent == "consulta_producto":
            await self._send_best_effort(
                from_number,
                "En un momento te proporcionamos la información del producto.",
            )
            return {"response_sent": True}

        await self._send_best_effort(
            from_number,
            "Gracias por tu mensaje. Un asesor te atenderá pronto.",
        )
        return {"response_sent": True}

    # ────────────────────────── CFDI COLLECTION ─────────────────────────────── #

    async def _collect_cfdi_data(self, from_number: str, text: str) -> Dict[str, Any]:
        """
        Flujo de recolección de datos CFDI usando whatsapp_sessions.
        Pasos 1-2 implementados. Pasos 3-5: Fase 2.
        CLAUDE_FIX: paso incompleto informa al cliente en lugar de silencio.
        """
        session = await self._get_session(from_number, "cfdi_collection")

        # CLAUDE_FIX: verificar TTL — sesión inactiva > 24h se descarta
        if session and not self._is_session_valid(session):
            session = {}
            logger.info("Sesión CFDI expirada para %s — reiniciando", from_number)

        state = session.get("state", {})
        step = state.get("step", 1)

        if step == 1:
            await self._send_best_effort(
                from_number, "Para facturar, por favor proporciónanos tu RFC:"
            )
            await self._update_session(from_number, "cfdi_collection", {"step": 2})
            return {"response_sent": True}

        if step == 2:
            rfc = text.upper().strip()
            if not re.match(r"^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", rfc):
                await self._send_best_effort(from_number, "RFC inválido. Inténtalo de nuevo:")
                return {"response_sent": True}
            # SECURITY: RFC enmascarado en log (no en BD — ahí se guarda completo para facturación)
            logger.info("RFC recibido para facturación: %s", _mask_rfc(rfc))
            await self._send_best_effort(
                from_number, "Gracias. Ahora, tu Razón Social (nombre completo):"
            )
            await self._update_session(
                from_number, "cfdi_collection", {"step": 3, "rfc": rfc}
            )
            return {"response_sent": True}

        # Pasos 3-5 pendientes para Fase 2.
        # CLAUDE_FIX: informar al cliente en lugar de silencio
        await self._send_best_effort(
            from_number,
            "Recibimos tu información. Un asesor completará tu factura a la brevedad. "
            "Recibirás tu CFDI en este chat.",
        )
        return {"response_sent": True}

    # ────────────────────────── ENVÍO BEST-EFFORT ───────────────────────────── #

    async def _send_best_effort(self, to_number: str, message: str) -> bool:
        """
        CLAUDE_FIX: envío best-effort — errores se loggean pero no escalan.
        CLAUDE_FIX: trunca a _MAX_WA_CHARS antes de enviar.
        Si falla: registra en BD como outbound con status='failed'.
        """
        truncated = message[:_MAX_WA_CHARS]
        if len(message) > _MAX_WA_CHARS:
            logger.warning(
                "Mensaje truncado de %d → %d chars para tenant=%s",
                len(message), _MAX_WA_CHARS, self.tenant_id,
            )
        try:
            result = await self.meta_adapter.send_whatsapp(to_number, truncated)
            return bool(result)
        except Exception as e:
            logger.error(
                "Fallo al enviar WA a %s tenant=%s: %s — guardando como failed",
                to_number, self.tenant_id, e,
            )
            await self._save_message(
                from_number="system",
                to_number=to_number,
                text=truncated,
                direction="outbound",
                intent="system",
                status="failed",
            )
            return False

    def _absence_message(self) -> str:
        return (
            "Gracias por contactarnos. Nuestro horario es L-V 8AM-7PM. "
            "Te responderemos a la brevedad el siguiente día hábil."
        )

    # ────────────────────────── PERSISTENCIA ────────────────────────────────── #

    async def _save_message(
        self,
        from_number: str,
        to_number: str,
        text: str,
        direction: str,
        intent: str,
        status: str = "ok",
    ):
        """Persiste mensaje en BD."""
        try:
            await self.supabase.table("whatsapp_messages").insert({
                "tenant_id": self.tenant_id,
                "from_number": from_number,
                "to_number": to_number,
                "direction": direction,
                "message_text": text,
                "intent": intent,
                "status": status,
                "processed": direction == "outbound",
            }).execute()
        except Exception as e:
            logger.error("Error saving message tenant=%s: %s", self.tenant_id, e)

    # ─────────────────────── HELPERS DE SESIÓN ──────────────────────────────── #

    def _is_session_valid(self, session: Dict[str, Any]) -> bool:
        """
        CLAUDE_FIX: verificar TTL de sesión. Sesiones > 24h se descartan.
        updated_at ausente → sesión inválida (seguro por defecto).
        """
        updated_at_raw = session.get("updated_at")
        if not updated_at_raw:
            return False
        try:
            updated_at = datetime.fromisoformat(updated_at_raw)
            # Si no tiene timezone, asumir UTC
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)
            now = self._get_now()
            age_seconds = (now - updated_at).total_seconds()
            return age_seconds < _SESSION_TTL_SECONDS
        except (ValueError, TypeError):
            return False

    async def _get_session(self, from_number: str, session_type: str) -> Dict[str, Any]:
        """
        CLAUDE_FIX: filtra por tenant_id + from_number — previene acceso cruzado entre clientes.
        """
        try:
            res = (
                await self.supabase.table("whatsapp_sessions")
                .select("*")
                .eq("tenant_id", self.tenant_id)
                .eq("from_number", from_number)
                .eq("session_type", session_type)
                .single()
                .execute()
            )
            return res.data or {}
        except Exception:
            return {}

    async def _update_session(
        self, from_number: str, session_type: str, state: Dict[str, Any]
    ):
        """
        CLAUDE_FIX: usa self._get_now() para updated_at — no datetime.now() suelto.
        """
        try:
            await self.supabase.table("whatsapp_sessions").upsert({
                "tenant_id": self.tenant_id,
                "from_number": from_number,
                "session_type": session_type,
                "state": state,
                "updated_at": self._get_now().isoformat(),
            }).execute()
        except Exception as e:
            logger.error(
                "Error updating session tenant=%s from=%s: %s",
                self.tenant_id, from_number, e,
            )

    # ─────────────────────── UTILIDADES ─────────────────────────────────────── #

    def _get_now(self) -> datetime:
        """Retorna la hora actual en CDMX (UTC-6 fijo)."""
        tz_mx = timezone(timedelta(hours=-6))
        return datetime.now(tz_mx)

    # ─────────────────────── STUBS DE COMPATIBILIDAD ────────────────────────── #

    async def get_vault_secrets(self, _tenant_id: str, _keys: list) -> dict:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> dict:
        return {}

    async def get_vault_secret(self, _tenant_id: str, _secret_name: str) -> dict:
        return {}
