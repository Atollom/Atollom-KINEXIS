"""
Samantha Core — LLM orchestrator.
Provider: Gemini 2.0 Flash (default) | Anthropic Claude (LLM_PROVIDER=anthropic)
Singleton: call get_samantha() to get the shared instance.
"""
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT_TEMPLATE = """Eres Samantha, la IA concierge central de KINEXIS — como el concierge de un hotel de lujo: proactiva, cordial, anticipas necesidades, nunca modificas datos sin confirmación explícita.
Empresa: {tenant_name} | Plan: {plan}{page_section}

CONTEXTO ACTUAL DEL NEGOCIO:
- Productos en inventario: {products_count}
- Órdenes últimos 30 días: {orders_count}
- Ingresos últimos 30 días: ${revenue_30d:,.0f} MXN
- Clientes registrados: {customers_count}
- Facturas (CFDI) mes actual: {invoices_count}
{low_stock_section}{memory_section}
INSTRUCCIONES:
- Responde SIEMPRE en español, de forma directa y concisa.
- Usa el contexto del negocio y la página actual para respuestas relevantes y proactivas.
- Si no tienes un dato, dilo claramente — nunca inventes números.
- Solo puedes LEER, ANALIZAR y MOSTRAR información — nunca modificar datos sin confirmación explícita.
- Anticipa la siguiente necesidad del usuario y ofrece sugerencias útiles.
- Máximo 3 párrafos por respuesta salvo que se pida un análisis extenso."""


def _build_system_prompt(context: Dict[str, Any], system_prompt_override: Optional[str]) -> str:
    if system_prompt_override:
        return system_prompt_override

    low_stock = context.get("low_stock", [])
    low_stock_section = ""
    if low_stock:
        items = ", ".join(f"{r.get('sku','?')} ({r.get('stock',0)} uds)" for r in low_stock[:5])
        low_stock_section = f"- Stock crítico: {items}\n"

    memory_context = context.get("memory_context", "")
    memory_section = f"\nMEMORIA DE SESIONES ANTERIORES:\n{memory_context}\n" if memory_context else ""

    current_page = context.get("current_page", "")
    page_section = f" | Módulo actual: {current_page}" if current_page else ""

    return _SYSTEM_PROMPT_TEMPLATE.format(
        tenant_name=context.get("tenant_name", "tu empresa"),
        plan=context.get("plan", "starter"),
        page_section=page_section,
        products_count=context.get("products_count", 0),
        orders_count=context.get("orders_count", 0),
        revenue_30d=float(context.get("revenue_30d", 0)),
        customers_count=context.get("customers_count", 0),
        invoices_count=context.get("invoices_count", 0),
        low_stock_section=low_stock_section,
        memory_section=memory_section,
    )


class SamanthaGemini:
    """Samantha backed by Google Gemini."""

    def __init__(self):
        self._model = None

    def _get_model(self):
        if self._model is None:
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
            genai.configure(api_key=api_key)
            model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
            self._model = genai.GenerativeModel(model_name)
        return self._model

    async def query(
        self,
        message: str,
        tenant_id: str,
        context: Dict[str, Any],
        history: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        import asyncio
        import functools

        system = _build_system_prompt(context, system_prompt)
        model = self._get_model()

        # Build conversation history for Gemini
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.get("content", "")]})

        # Build current message parts
        parts: List[Any] = [message]
        if attachments:
            import base64
            for att in attachments:
                mime = att.get("type", "application/octet-stream")
                data = att.get("data", "")
                if data:
                    parts.append({"mime_type": mime, "data": base64.b64decode(data)})

        # Prepend system prompt as first user/model exchange if no history
        if not gemini_history:
            gemini_history = [
                {"role": "user", "parts": [f"[INSTRUCCIONES DEL SISTEMA]\n{system}"]},
                {"role": "model", "parts": ["Entendido. Estoy lista para ayudarte con KINEXIS."]},
            ]

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            functools.partial(
                lambda: model.start_chat(history=gemini_history).send_message(parts)
            ),
        )
        return response.text


class SamanthaAnthropic:
    """Samantha backed by Anthropic Claude."""

    async def query(
        self,
        message: str,
        tenant_id: str,
        context: Dict[str, Any],
        history: List[Dict[str, Any]],
        system_prompt: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        system = _build_system_prompt(context, system_prompt)

        messages = []
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        content: List[Any] = [{"type": "text", "text": message}]
        if attachments:
            import base64
            for att in attachments:
                mime = att.get("type", "")
                data = att.get("data", "")
                if data and mime.startswith("image/"):
                    content.insert(0, {
                        "type": "image",
                        "source": {"type": "base64", "media_type": mime, "data": data},
                    })

        messages.append({"role": "user", "content": content})

        resp = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system,
            messages=messages,
        )
        return resp.content[0].text


_samantha_instance: Optional[Any] = None


def get_samantha():
    """Return the singleton Samantha LLM instance for the configured provider."""
    global _samantha_instance
    if _samantha_instance is None:
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "anthropic":
            _samantha_instance = SamanthaAnthropic()
            logger.info("Samantha initialized with Anthropic Claude")
        else:
            _samantha_instance = SamanthaGemini()
            logger.info("Samantha initialized with Google Gemini")
    return _samantha_instance
