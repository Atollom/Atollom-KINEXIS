# src/agents/customer_support_agent.py
import logging
import re
from typing import Any, Dict, List

from src.adapters.meta_adapter import MetaAdapter
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Intenciones/Tipos de ticket
TICKET_TYPES = frozenset(["tracking", "return", "exchange", "complaint", "other"])

# Regex para detectar quejas de ácidos
ACID_REGEX = re.compile(r"ácido|acid|no funciona|no sirve", re.IGNORECASE)
SILVER_REGEX = re.compile(r"plata|silver", re.IGNORECASE)
GOLD_REGEX = re.compile(r"oro|gold|10k|14k|18k", re.IGNORECASE)

# Videos de ayuda Kap Tools
VIDEO_PLATA = "https://youtu.be/9nINypdi-6w"
VIDEO_ORO = "https://youtu.be/pV_I49L6J2o"

class CustomerSupportAgent(BaseAgent):
    """
    Agente #24: Customer Support Agent.
    Maneja soporte post-venta, rastreo de pedidos y escalaciones.
    """

    def __init__(self, tenant_id: str, supabase_client: Any = None):
        super().__init__(
            tenant_id, agent_id="customer_support_agent_v1", supabase_client=supabase_client
        )
        self.meta_adapter = MetaAdapter(tenant_id=tenant_id, db_client=self)

    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Entry point compatible con BaseAgent.run()"""
        return await self.execute(data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orquestación de soporte al cliente.
        """
        # 1. Sanitizar message
        raw_message = data.get("message", "")
        message = await self._sanitize_for_prompt(raw_message)
        
        ticket_type = data.get("ticket_type", "other")
        order_external_id = data.get("order_id") # Puede ser external_id o UUID
        contact_phone = data.get("contact_phone")
        
        if not contact_phone:
            raise ValueError("contact_phone es requerido para soporte.")

        # 2. Obtener o crear ticket
        ticket = await self._get_or_create_ticket(order_external_id, contact_phone, ticket_type)
        ticket_id = ticket.get("id")
        turn_count = ticket.get("turn_count", 0)

        # 3. Verificar condiciones de escalación inmediata
        escalation_keywords = ["demanda", "legal", "profeco", "abogado", "pendejo", "inútil", "estafa", "chinga"]
        if any(kw in message.lower() for kw in escalation_keywords):
            await self._escalate(ticket, f"Palabra clave de escalación detectada: {message}")
            return await self._format_response(ticket, "He transferido tu caso a un supervisor para atención prioritaria.", True)

        # 4. Rutear según ticket_type
        response_text = ""

        if ticket_type == "tracking":
            response_text = await self._handle_tracking(order_external_id)
        elif ticket_type == "return":
            response_text = await self._handle_return(ticket_id, order_external_id)
        elif ticket_type == "complaint":
            response_text = await self._check_acid_complaint(message)
        else:
            response_text = "Gracias por contactarnos. ¿En qué podemos ayudarte con tu pedido?"

        # 5. Incrementar turn_count y verificar escalación por turnos
        new_turn_count = turn_count + 1
        await self._update_ticket_turn(ticket_id, new_turn_count)

        is_escalated = False
        if new_turn_count >= 3:
            is_escalated = await self._escalate(ticket, f"Máximo de turnos (3) alcanzado sin resolución. Último mensaje: {message}")
            response_text += "\n\nHe escalado tu caso con nuestro equipo de soporte avanzado. Te contactarán en breve."

        # 6. Enviar respuesta vía Meta (Best-effort)
        try:
            await self.meta_adapter.send_whatsapp(contact_phone, response_text[:1024])
        except Exception as e:
            logger.error("Error enviando respuesta WA a %s: %s", contact_phone, e)

        return {
            "response_sent": True,
            "response": response_text,
            "ticket_id": ticket_id,
            "ticket_status": "escalated" if is_escalated else "open",
            "turn_count": new_turn_count,
            "escalated": is_escalated
        }

    async def _get_or_create_ticket(self, order_id: str, contact_phone: str, issue_type: str) -> Dict[str, Any]:
        """
        Busca un ticket abierto o crea uno nuevo.
        """
        try:
            res = await self.supabase.table("support_tickets")\
                .select("*")\
                .eq("tenant_id", self.tenant_id)\
                .eq("contact_phone", contact_phone)\
                .eq("status", "open")\
                .execute()
            
            if res.data and len(res.data) > 0:
                return res.data[0]
            
            # Crear nuevo ticket
            new_ticket = {
                "tenant_id": self.tenant_id,
                "order_id": order_id,
                "contact_phone": contact_phone,
                "issue_type": issue_type,
                "status": "open",
                "turn_count": 0
            }
            ins_res = await self.supabase.table("support_tickets").insert(new_ticket).execute()
            return ins_res.data[0]
        except Exception as e:
            logger.error("Error en _get_or_create_ticket: %s", e)
            # Retornar objeto mínimo para no romper el flujo
            return {"id": "temp_id", "turn_count": 0, "contact_phone": contact_phone}

    async def _handle_tracking(self, order_id: str) -> str:
        """
        Consulta estado de la orden y retorna link de rastreo si aplica.
        """
        if not order_id:
            return "Lo siento, no tengo un número de orden para rastrear. ¿Podrías proporcionarlo?"

        try:
            # Buscar por UUID o external_id
            query = self.supabase.table("orders").select("*").eq("tenant_id", self.tenant_id)
            if self._is_uuid(order_id):
                query = query.eq("id", order_id)
            else:
                query = query.eq("external_id", order_id)
            
            res = await query.execute()
            
            if not res.data:
                return f"No encontré ninguna orden con el ID {order_id}. ¿Es correcto?"

            order = res.data[0]
            status = order.get("status")
            platform = order.get("platform")
            tracking = order.get("external_id") # Por convención en S8 se guarda ahí

            msg = f"Tu pedido ({order_id}) está en estado: {status}."
            
            if tracking:
                if platform == "ml":
                    msg += f"\nLink de rastreo: https://www.mercadolibre.com.mx/envios/{tracking}"
                elif platform == "amazon":
                    msg += f"\nNúmero de rastreo de Amazon: {tracking}"
                elif platform == "b2b":
                    msg += f"\nGuía de envío: {tracking}"
            
            return msg
        except Exception as e:
            logger.error("Error en _handle_tracking: %s", e)
            return "Tuve un problema al consultar tu pedido. Por favor intenta más tarde."

    async def _handle_return(self, ticket_id: str, order_id: str) -> str:
        """
        Inicia proceso de devolución (avisa, no autoriza).
        """
        try:
            await self.supabase.table("support_tickets")\
                .update({"issue_type": "return"})\
                .eq("id", ticket_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()
            
            # Notificar socias (best-effort)
            await self._notify_partners(ticket_id, "Solicitud de devolución abierta.")
            
            return (
                "He registrado tu solicitud de devolución para la orden {}. "
                "Un agente de devoluciones revisará tu caso y te enviará las "
                "instrucciones por este medio. Por favor, no envíes el producto aún."
            ).format(order_id or "del pedido")
        except Exception as e:
            logger.error("Error en _handle_return: %s", e)
            return "He tenido un problema al registrar la devolución. Un asesor humano te contactará."

    async def _check_acid_complaint(self, message: str) -> str:
        """
        Detección de reclamos por ácidos y respuesta con videos Kap.
        """
        response = "Siento mucho que tengas problemas con el producto. "
        
        if ACID_REGEX.search(message):
            if SILVER_REGEX.search(message):
                response += "Para limpiar piezas de plata Kap, te recomiendo este video instructivo: " + VIDEO_PLATA
            elif GOLD_REGEX.search(message):
                response += "Para el cuidado de piezas de oro Kap, aquí tienes una guía paso a paso: " + VIDEO_ORO
            else:
                response += "Contamos con videos especializados para el cuidado de cada metal. ¿Te refieres a plata u oro?"
        else:
            response += "¿Podrías darme más detalles sobre lo que sucede con el producto?"
            
        return response

    async def _update_ticket_turn(self, ticket_id: str, new_turn: int):
        try:
            await self.supabase.table("support_tickets")\
                .update({"turn_count": new_turn})\
                .eq("id", ticket_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()
        except Exception as e:
            logger.error("Error actualizando turn_count: %s", e)

    async def _escalate(self, ticket: Dict[str, Any], reason: str) -> bool:
        """
        Escala el ticket a socias.
        """
        ticket_id = ticket.get("id")
        try:
            await self.supabase.table("support_tickets")\
                .update({
                    "status": "escalated",
                    "updated_at": self._get_now().isoformat()
                })\
                .eq("id", ticket_id)\
                .eq("tenant_id", self.tenant_id)\
                .execute()
            
            # Notificación detallada a socias
            await self._notify_partners(ticket_id, f"ESCALACIÓN: {reason}")
            return True
        except Exception as e:
            logger.error("Error en escalación: %s", e)
            return False

    async def _notify_partners(self, ticket_id: str, note: str):
        """
        Notifica a las socias vía WhatsApp (Best-effort).
        """
        try:
            config = await self.get_tenant_config(self.tenant_id)
            partners = config.get("partner_whatsapp", [])
            if not isinstance(partners, list):
                partners = [partners] if partners else []

            # Obtener datos del ticket para el reporte — tenant_id siempre (IDOR prevention)
            res = await self.supabase.table("support_tickets").select("*").eq("id", ticket_id).eq("tenant_id", self.tenant_id).execute()
            ticket_data = res.data[0] if res.data else {}

            report = (
                "🚨 *ALERTA DE SOPORTE*\n"
                f"Ticket ID: {ticket_id}\n"
                f"Cliente: {ticket_data.get('contact_phone')}\n"
                f"Orden: {ticket_data.get('order_id')}\n"
                f"Tipo: {ticket_data.get('issue_type')}\n"
                f"Nota: {note}\n"
            )

            for p in partners:
                await self.meta_adapter.send_whatsapp(p, report[:1024])
        except Exception as e:
            logger.error("Fallo notificación a socias: %s", e)

    async def _format_response(self, ticket: Dict[str, Any], text: str, escalated: bool) -> Dict[str, Any]:
        return {
            "response_sent": True,
            "response": text,
            "ticket_id": ticket.get("id"),
            "ticket_status": "escalated" if escalated else "open",
            "turn_count": ticket.get("turn_count", 0),
            "escalated": escalated
        }

    def _is_uuid(self, val: str) -> bool:
        return bool(re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", str(val).lower()))

    # ── Stubs de compatibilidad ──
    async def get_vault_secrets(self, _tenant_id: str, _keys: List[str]) -> Dict[str, Any]:
        return {}

    async def get_tenant_config(self, _tenant_id: str) -> Dict[str, Any]:
        # En test/producción esto vendría de la BD
        return {"partner_whatsapp": ["521234567890", "521098765432"]}

    async def get_vault_secret(self, _tenant_id: str, _secret_name: str) -> Dict[str, Any]:
        return {}
