"""
Agente #32: Quote Generator
Responsabilidad: Generar cotizaciones profesionales en PDF
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_PAYMENT_TERMS = {"immediate", "15_days", "30_days", "60_days", "90_days"}
DEFAULT_TAX_RATE = 0.16

# Quote counter — Fase 2: from Supabase sequence
_QUOTE_COUNTER = 41


def _next_quote_number() -> str:
    global _QUOTE_COUNTER
    _QUOTE_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"COT-{year}-{_QUOTE_COUNTER:03d}"


class Agent32QuoteGenerator:
    """
    Quote Generator — Generación de cotizaciones profesionales con PDF.

    Cálculo:
      subtotal = sum(quantity * unit_price per item)
      tax      = subtotal * 0.16 (IVA Mexico)
      total    = subtotal + tax

    Input:
        {
            "customer":      dict  — {name, contact, email}
            "items":         list  — [{sku, description, quantity, unit_price}]
            "payment_terms": str   — immediate | 15_days | 30_days | 60_days | 90_days
            "valid_until":   str   — ISO date YYYY-MM-DD (opcional)
            "notes":         str   — (opcional)
            "tax_rate":      float — (opcional, default 0.16)
        }

    Output:
        {
            "quote_number":  str
            "customer_name": str
            "subtotal":      float
            "tax":           float
            "total":         float
            "pdf_url":       str  — (Fase 2)
            "valid_until":   str
            "sent_at":       str
            "sent_to":       str
        }
    """

    REQUIRED_FIELDS = ["customer", "items"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #32 - Quote Generator"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Genera cotización con totales calculados."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                f"{self.name} quote={result.get('quote_number')} "
                f"total={result.get('total')} customer={result.get('customer_name')}"
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

        customer = data["customer"]
        if not isinstance(customer, dict):
            raise ValueError("customer must be a dict")
        if not customer.get("name", "").strip():
            raise ValueError("customer.name is required")

        items = data["items"]
        if not isinstance(items, list) or len(items) == 0:
            raise ValueError("items must be a non-empty list")

        for i, item in enumerate(items):
            qty = int(item.get("quantity", 0))
            if qty <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
            price = float(item.get("unit_price", 0))
            if price < 0:
                raise ValueError(f"items[{i}] unit_price must be >= 0")

        payment_terms = data.get("payment_terms", "30_days")
        if payment_terms not in VALID_PAYMENT_TERMS:
            raise ValueError(f"Invalid payment_terms. Valid: {VALID_PAYMENT_TERMS}")
        data["payment_terms"] = payment_terms

        tax_rate = float(data.get("tax_rate", DEFAULT_TAX_RATE))
        if not (0 <= tax_rate <= 1):
            raise ValueError("tax_rate must be between 0 and 1")
        data["tax_rate"] = tax_rate

        return data

    def _calculate_totals(self, items: list, tax_rate: float) -> tuple[float, float, float]:
        subtotal = sum(
            float(item["unit_price"]) * int(item["quantity"])
            for item in items
        )
        tax = round(subtotal * tax_rate, 2)
        return round(subtotal, 2), tax, round(subtotal + tax, 2)

    def _get_valid_until(self, specified: Optional[str]) -> str:
        if specified:
            return specified
        return (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - Generate PDF via WeasyPrint with branded template
        - Upload PDF to Supabase Storage
        - Send email via Resend/SendGrid to customer
        - Persist quote to Supabase (table: crm_quotes)
        """
        customer = data["customer"]
        items = data["items"]
        tax_rate = data["tax_rate"]
        subtotal, tax, total = self._calculate_totals(items, tax_rate)
        quote_number = _next_quote_number()
        valid_until = self._get_valid_until(data.get("valid_until"))

        return {
            "quote_number": quote_number,
            "customer_name": customer["name"],
            "customer_contact": customer.get("contact"),
            "sent_to": customer.get("email"),
            "items_count": len(items),
            "subtotal": subtotal,
            "tax": tax,
            "tax_rate": tax_rate,
            "total": total,
            "payment_terms": data["payment_terms"],
            "valid_until": valid_until,
            "notes": data.get("notes"),
            "pdf_url": None,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "note": "PDF generation & email delivery integration pending — Fase 2",
        }


quote_generator = Agent32QuoteGenerator()
