"""
Agente #4: B2B Collector
Responsabilidad: Captar y calificar leads B2B automáticamente
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_SOURCES = {"web_form", "whatsapp", "linkedin", "referral"}
VALID_URGENCIES = {"high", "medium", "low"}

CONSUMER_EMAIL_DOMAINS = {"gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "live.com", "icloud.com"}

DECISION_MAKER_KEYWORDS = {
    "gerente", "director", "ceo", "coo", "compras", "procurement",
    "jefe", "responsable", "encargado", "dueño", "socio", "owner",
}

# Lead counter — Fase 2: from Supabase sequence
_LEAD_COUNTER = 41


def _next_lead_id() -> str:
    global _LEAD_COUNTER
    _LEAD_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"LEAD-{year}-{_LEAD_COUNTER:03d}"


def _is_corporate_email(email: str) -> bool:
    domain = email.lower().split("@")[-1] if "@" in email else ""
    return domain not in CONSUMER_EMAIL_DOMAINS and "." in domain


def _is_decision_maker(position: str) -> bool:
    pos_lower = position.lower()
    return any(kw in pos_lower for kw in DECISION_MAKER_KEYWORDS)


class Agent04B2BCollector:
    """
    B2B Collector — Captación y calificación automática de leads B2B.

    Scoring:
      +30 empresa presente
      +15 email corporativo (no gmail/hotmail)
      +30 budget >= $50,000
      +20 budget >= $10,000
      +10 budget >= $5,000
      +15 urgency high / +10 medium
      +10 cargo de decisión (gerente/director/CEO)
      +5  fuente = referral

    Prioridad: high >= 70 | medium >= 40 | low < 40

    Input:
        {
            "source":  str  — web_form | whatsapp | linkedin | referral
            "contact": dict — {name, email, phone, company, position}
            "context": dict — {message, budget, urgency}
        }

    Output:
        {
            "lead_id":       str
            "qualification": {is_b2b, quality_score, priority, reasoning}
            "next_actions":  list[str]
            "captured_at":   str
        }
    """

    REQUIRED_FIELDS = ["source", "contact"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #4 - B2B Collector"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Califica y registra un lead B2B."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} lead={result.get('lead_id')} "
                f"score={result['qualification']['quality_score']} "
                f"priority={result['qualification']['priority']}"
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error(f"{self.name} failed: {e}")
            return {
                "success": False,
                "agent": self.name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        if data["source"] not in VALID_SOURCES:
            raise ValueError(f"Invalid source. Valid: {VALID_SOURCES}")

        contact = data["contact"]
        if not isinstance(contact, dict):
            raise ValueError("contact must be a dict")
        if not contact.get("name", "").strip():
            raise ValueError("contact.name is required")

        context = data.get("context", {})
        urgency = context.get("urgency", "low")
        if urgency not in VALID_URGENCIES:
            raise ValueError(f"Invalid urgency. Valid: {VALID_URGENCIES}")

        return data

    def _calculate_score(self, contact: Dict, context: Dict, source: str) -> tuple[int, list, bool]:
        """Returns (score, reasoning_parts, is_b2b)."""
        score = 0
        reasons = []

        company = contact.get("company", "").strip()
        if company:
            score += 30
            reasons.append("company present")

        email = contact.get("email", "")
        is_b2b = bool(company)
        if email and _is_corporate_email(email):
            score += 15
            reasons.append("corporate email")

        budget = float(context.get("budget", 0))
        if budget >= 50_000:
            score += 30
            reasons.append("budget >$50k")
        elif budget >= 10_000:
            score += 20
            reasons.append("budget >$10k")
        elif budget >= 5_000:
            score += 10
            reasons.append("budget >$5k")

        urgency = context.get("urgency", "low")
        if urgency == "high":
            score += 15
            reasons.append("urgency: high")
        elif urgency == "medium":
            score += 10
            reasons.append("urgency: medium")

        position = contact.get("position", "")
        if position and _is_decision_maker(position):
            score += 10
            reasons.append("decision maker")

        if source == "referral":
            score += 5
            reasons.append("referral source")

        return min(score, 100), reasons, is_b2b

    def _determine_next_actions(self, score: int, priority: str) -> list:
        if priority == "high":
            return ["assign_to_sales_rep", "send_catalog", "schedule_call"]
        elif priority == "medium":
            return ["send_catalog", "add_to_nurturing_sequence"]
        else:
            return ["add_to_newsletter", "send_general_info"]

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Persist lead to Supabase (table: crm_leads)
        - Trigger Agent #33 (Follow-up) schedule
        - Notify sales rep via WhatsApp if high priority
        """
        contact = data["contact"]
        context = data.get("context", {})
        source = data["source"]

        score, reasons, is_b2b = self._calculate_score(contact, context, source)
        priority = "high" if score >= 70 else "medium" if score >= 40 else "low"
        next_actions = self._determine_next_actions(score, priority)
        lead_id = _next_lead_id()

        return {
            "lead_id": lead_id,
            "source": source,
            "contact_name": contact.get("name"),
            "company": contact.get("company"),
            "qualification": {
                "is_b2b": is_b2b,
                "quality_score": score,
                "priority": priority,
                "reasoning": " + ".join(reasons) if reasons else "no qualifying signals",
            },
            "next_actions": next_actions,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "note": "Supabase CRM persistence & sales notification pending — Fase 2",
        }


b2b_collector = Agent04B2BCollector()
