"""
Agente #31: Lead Scorer
Responsabilidad: Puntuar leads automáticamente (0-100)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Fuentes de alta intención (mayor peso)
HIGH_INTENT_SOURCES = {"whatsapp", "referido", "llamada", "demo_request"}
# Fuentes de baja intención
LOW_INTENT_SOURCES = {"facebook_organic", "instagram_organic", "web_scrape"}


class Agent31LeadScorer:
    """
    Lead Scorer — Puntuación automática de leads 0-100.

    Criterios de puntuación:
      - Empresa presente (B2B)  → +30 pts
      - Email corporativo       → +15 pts
      - Email genérico          → +5 pts
      - Budget > 50k            → +30 pts
      - Budget 10k-50k          → +20 pts
      - Budget 1k-10k           → +10 pts
      - Fuente alta intención   → +15 pts
      - Fuente baja intención   → +0 pts
      - Historial de compra     → +10 pts extra

    Prioridad:
      70-100 → high
      40-69  → medium
      0-39   → low

    Input:
        {
            "name":            str
            "company":         str   (opcional)
            "email":           str   (opcional)
            "source":          str   — canal origen
            "budget":          float (opcional)
            "has_purchase_history": bool (opcional)
        }

    Output:
        {
            "score":      int    — 0-100
            "priority":   str    — high|medium|low
            "breakdown":  dict   — desglose de puntos
        }
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #31 - Lead Scorer"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calcula score del lead."""
        try:
            if not input_data.get("name"):
                raise ValueError("Missing required field: name")

            result = self._score(input_data)
            logger.info(f"{self.name} scored lead '{input_data['name']}': {result['score']}")
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    def _score(self, data: Dict[str, Any]) -> Dict[str, Any]:
        breakdown: Dict[str, int] = {}
        score = 0

        # Empresa → B2B
        if data.get("company"):
            breakdown["company_b2b"] = 30
            score += 30

        # Email
        email = data.get("email", "")
        if email:
            is_corporate = email and "gmail" not in email and "hotmail" not in email and "yahoo" not in email
            pts = 15 if is_corporate else 5
            breakdown["email"] = pts
            score += pts

        # Budget
        budget = float(data.get("budget") or 0)
        if budget > 50_000:
            breakdown["budget"] = 30
            score += 30
        elif budget > 10_000:
            breakdown["budget"] = 20
            score += 20
        elif budget > 1_000:
            breakdown["budget"] = 10
            score += 10

        # Fuente
        source = (data.get("source") or "").lower()
        if source in HIGH_INTENT_SOURCES:
            breakdown["source_high_intent"] = 15
            score += 15

        # Historial de compra
        if data.get("has_purchase_history"):
            breakdown["purchase_history"] = 10
            score += 10

        score = min(score, 100)
        priority = "high" if score >= 70 else "medium" if score >= 40 else "low"

        return {
            "score": score,
            "priority": priority,
            "breakdown": breakdown,
        }


lead_scorer = Agent31LeadScorer()
