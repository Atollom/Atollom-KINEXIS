# src/utils/ai_client.py
import os
import logging
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)

class ModelID(Enum):
    GEMINI_FLASH_LITE = "gemini-2.5-flash-lite"
    GEMINI_FLASH = "gemini-2.0-flash"
    CLAUDE_SONNET = "claude-3-5-sonnet-20240620"

class AIClientWithFallback:
    """
    Cliente de IA con lógica de redundancia (Fallback).
    Primary: Gemini 2.0 Flash | Fallback: Sin LLM
    """
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY"))
        self.claude_api_key = os.getenv("ANTHROPIC_API_KEY")

    async def generate_response(self, prompt: str, system_prompt: str = "", model: Optional[ModelID] = None) -> str:
        target_model = model or ModelID.GEMINI_FLASH_LITE
        
        if target_model == ModelID.GEMINI_FLASH_LITE and not self.gemini_api_key:
            logger.warning("No se encontró GEMINI_API_KEY. Intentando fallback a Gemini 2.0...")
            target_model = ModelID.GEMINI_FLASH
            if not self.gemini_api_key:
                logger.warning("Tampoco hay clave para el fallback. Continuando sin LLM...")
                return "Respuesta simulada sin LLM."
            
        try:
            return await self._call_provider(target_model, prompt, system_prompt)
        except Exception as e:
            if target_model == ModelID.GEMINI_FLASH_LITE:
                logger.warning(f"Error usando {target_model.value}: {e}. Reintentando con Gemini 2.0...")
                try:
                    return await self._call_provider(ModelID.GEMINI_FLASH, prompt, system_prompt)
                except Exception as e2:
                    logger.warning(f"Error en fallback {ModelID.GEMINI_FLASH.value}: {e2}. Continuando sin LLM...")
                    return "Respuesta simulada sin LLM tras error en fallback."
            elif target_model == ModelID.GEMINI_FLASH:
                logger.warning(f"Error usando Gemini: {e}. Continuando sin LLM...")
                return "Respuesta simulada sin LLM tras error de API."
            raise e

    async def _call_provider(self, model: ModelID, prompt: str, system_prompt: str) -> str:
        # Mock de respuesta para la inicialización
        return f"Response from {model.value}"

