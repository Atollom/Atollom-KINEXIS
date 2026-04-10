# src/utils/ai_client.py
import os
from typing import Optional, Dict, Any
from enum import Enum

class ModelID(Enum):
    CLAUDE_SONNET = "claude-3-5-sonnet-20240620"
    GEMINI_FLASH = "gemini-2.0-flash-exp"

class AIClientWithFallback:
    """
    Cliente de IA con lógica de redundancia (Fallback).
    Primary: Claude 3.5 Sonnet | Fallback: Gemini 2.0 Flash
    """
    def __init__(self):
        self.claude_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.gemini_api_key = os.getenv("GOOGLE_API_KEY")

    async def generate_response(self, prompt: str, system_prompt: str = "", model: Optional[ModelID] = None) -> str:
        # Aquí se implementaría la lógica de llamada real a las APIs
        # Por ahora es un scaffold que simula el fallback
        
        target_model = model or ModelID.CLAUDE_SONNET
        
        try:
            return await self._call_provider(target_model, prompt, system_prompt)
        except Exception as e:
            if target_model == ModelID.CLAUDE_SONNET:
                print(f"Claude failed, falling back to Gemini: {e}")
                return await self._call_provider(ModelID.GEMINI_FLASH, prompt, system_prompt)
            raise e

    async def _call_provider(self, model: ModelID, prompt: str, system_prompt: str) -> str:
        # Mock de respuesta para la inicialización
        return f"Response from {model.value}"
