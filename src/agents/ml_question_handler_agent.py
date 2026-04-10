# src/agents/ml_question_handler_agent.py
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from src.agents.base_agent import BaseAgent
from src.adapters.ml_adapter import MLAdapter

logger = logging.getLogger(__name__)

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
        """
        Punto de entrada compatible con BaseAgent.run().
        """
        return await self.execute(input_data)

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Lógica principal de atención a preguntas.
        """
        tenant_id = data.get("tenant_id")
        question_id = data.get("question_id")
        item_id = data.get("item_id")
        question_text = data.get("question_text", "")
        buyer_id = data.get("buyer_id")

        # 1. Cargar credenciales ML
        await self.ml_adapter.load_credentials()

        # 2. Obtener contexto del producto
        product_context = await self.ml_adapter.get_item(item_id)
        
        # 3. Consultar stock real (Caché 15m)
        stock_data = await self._get_stock_realtime(tenant_id, item_id)
        stock_qty = stock_data["qty"]
        is_stale = stock_data.get("stale", False)

        # 4. Historial del comprador (Mock para Fase 1)
        buyer_history = "Sin compras previas registradas."

        # 5. Detección B2B
        is_b2b = await self._detect_b2b_intent(question_text, data.get("qty", 0))

        # 6. Generar respuesta con Claude
        answer_text = await self._build_answer(
            product_context=product_context,
            stock_qty=stock_qty,
            buyer_history=buyer_history,
            question_text=question_text,
            is_stale=is_stale
        )

        # 7. Publicar respuesta
        publish_result = await self.ml_adapter.post_answer(question_id, answer_text)

        # 8. Registro en CRM e Interacciones
        crm_id = await self._register_interactions(buyer_id, question_text, answer_text)

        # 9. Si B2B -> Crear Lead
        if is_b2b:
            await self._create_lead(buyer_id, crm_id)

        return {
            "answer_text": answer_text,
            "is_b2b_lead": is_b2b,
            "answer_published": publish_result.get("status") == "active",
            "crm_interaction_id": crm_id
        }

    async def _detect_b2b_intent(self, text: str, qty: int) -> bool:
        # Método 1: Cantidad directa
        if qty > 10: return True
        
        # Método 2: Regex
        patterns = [
            r'\b(\d+)\s*(piezas?|unidades?|pzas?)\b',
            r'\bpor\s+mayor\b', r'\bmayoreo\b',
            r'\bRFC\b', r'\bfactura\b',
            r'\blista\s+de\s+precios?\b',
            r'\bvolumen\b', r'\bpedido\s+grande\b'
        ]
        for p in patterns:
            if re.search(p, text, re.IGNORECASE):
                return True
        
        # Método 3: LLM Tiebreaker (opcional)
        return False

    async def _get_stock_realtime(self, tenant_id: str, item_id: str) -> Dict[str, Any]:
        """
        Consulta inventario con lógica de 15 minutos.
        """
        # 1. Consultar Supabase
        res = await self.supabase.table('inventory').select('stock, updated_at').eq('tenant_id', tenant_id).eq('sku', item_id).single().execute()
        
        if res.data:
            last_sync = datetime.fromisoformat(res.data['updated_at'].replace('Z', '+00:00'))
            if datetime.now(last_sync.tzinfo) - last_sync < timedelta(minutes=15):
                return {"qty": res.data['stock'], "stale": False}
        
        # Si no hay data o es vieja
        # En producción dispararía un background task de sync
        # Retornamos lo que hay con flag stale
        qty = res.data['stock'] if res.data else 0
        return {"qty": qty, "stale": True}

    async def _build_answer(self, **kwargs) -> str:
        """
        Llama a Claude para generar la respuesta final.
        """
        system_prompt = self.SYSTEM_PROMPT_TEMPLATE.format(
            product_context=kwargs['product_context'],
            stock_qty=kwargs['stock_qty'],
            buyer_history=kwargs['buyer_history']
        )
        
        # Lógica especial si stock es stale
        prompt = kwargs['question_text']
        if kwargs.get('is_stale'):
            prompt += "\n(Nota interna: El stock no está verificado recientemente. Sé conservador.)"

        response = await self.ai_client.generate_response(prompt, system_prompt=system_prompt)
        
        # Recorte de seguridad a 800 chars
        return response[:800]

    async def _register_interactions(self, buyer_id: str, question: str, answer: str) -> str:
        # Registro Inbound
        inbound = await self.supabase.table('crm_interactions').insert({
            "tenant_id": self.tenant_id,
            "customer_id": buyer_id,
            "channel": "mercadolibre",
            "direction": "inbound",
            "content": question,
            "agent_id": self.agent_id
        }).execute()
        
        crm_id = inbound.data[0]['id']
        
        # Registro Outbound
        await self.supabase.table('crm_interactions').insert({
            "tenant_id": self.tenant_id,
            "customer_id": buyer_id,
            "channel": "mercadolibre",
            "direction": "outbound",
            "content": answer,
            "agent_id": self.agent_id
        }).execute()
        
        return crm_id

    async def _create_lead(self, buyer_id: str, interaction_id: str):
        await self.supabase.table('leads').insert({
            "tenant_id": self.tenant_id,
            "name": buyer_id,
            "channel": "mercadolibre",
            "score": 7,
            "type": "b2b",
            "status": "new",
            "source_interaction_id": interaction_id
        }).execute()
