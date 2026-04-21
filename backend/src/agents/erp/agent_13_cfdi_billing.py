"""
Agente #13: CFDI Billing
Responsabilidad: Generar facturas CFDI 4.0 SAT-compliant con validación completa
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

RFC_PUBLICO_GENERAL = "XAXX010101000"
RFC_PATTERN = re.compile(r"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$")

# Forma de pago SAT (cómo se pagó: transferencia, efectivo, etc.)
VALID_PAYMENT_METHODS = {"01", "02", "03", "04", "28", "29"}

# Método de pago SAT (cuándo: una exhibición vs diferido)
VALID_PAYMENT_FORMS = {"PUE", "PPD"}

# Uso CFDI SAT
VALID_USES = {"G01", "G02", "G03", "I01", "I02", "I03", "P01", "S01", "CP01"}

# Folio counter — Fase 2: from Supabase sequence
_FOLIO_COUNTER = 41


def _next_folio() -> str:
    global _FOLIO_COUNTER
    _FOLIO_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"F-{year}-{_FOLIO_COUNTER:03d}"


class Agent13CFDIBilling:
    """
    CFDI Billing — Generación y timbrado de facturas CFDI 4.0.

    Flujo:
      1. Valida RFC receptor con regex SAT
      2. Calcula subtotal/impuestos/total desde items
      3. Construye XML CFDI 4.0 (Fase 2: FacturAPI)
      4. Timbra y genera PDF
      5. Guarda en Supabase Storage

    Input:
        {
            "customer_rfc":    str   — RFC receptor (o XAXX010101000)
            "customer_name":   str   — Nombre/razón social
            "items":           list  — [{description, quantity, unit_price, tax_rate}]
            "payment_method":  str   — "03" transferencia, "01" efectivo, etc.
            "payment_form":    str   — "PUE" | "PPD"
            "use":             str   — "G03" gastos generales, etc.
        }

    Output:
        {
            "uuid":        str   — Folio fiscal SAT (UUID v4)
            "folio":       str   — Folio interno F-YYYY-NNN
            "subtotal":    float
            "tax":         float
            "total":       float
            "xml_url":     str   — (Fase 2)
            "pdf_url":     str   — (Fase 2)
            "status":      str   — "timbrada" (Fase 2)
            "timbrado_at": str   — ISO timestamp
        }
    """

    REQUIRED_FIELDS = ["customer_rfc", "customer_name", "items", "payment_method"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #13 - CFDI Billing"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Genera factura CFDI 4.0."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} invoice {result['folio']} RFC={validated['customer_rfc']}")
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

        rfc = str(data["customer_rfc"]).upper().strip()
        if not RFC_PATTERN.match(rfc):
            raise ValueError(f"RFC inválido: {rfc}")
        data["customer_rfc"] = rfc

        customer_name = str(data["customer_name"]).strip()
        if not customer_name:
            raise ValueError("customer_name cannot be empty")

        items = data["items"]
        if not isinstance(items, list) or len(items) == 0:
            raise ValueError("items must be non-empty list")

        for i, item in enumerate(items):
            if float(item.get("unit_price", 0)) < 0:
                raise ValueError(f"items[{i}] unit_price must be >= 0")
            if int(item.get("quantity", 0)) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
            tax_rate = float(item.get("tax_rate", 0.16))
            if not (0 <= tax_rate <= 1):
                raise ValueError(f"items[{i}] tax_rate must be 0-1")

        if data["payment_method"] not in VALID_PAYMENT_METHODS:
            raise ValueError(f"Invalid payment_method. Valid: {VALID_PAYMENT_METHODS}")

        payment_form = data.get("payment_form", "PUE")
        if payment_form not in VALID_PAYMENT_FORMS:
            raise ValueError(f"Invalid payment_form. Valid: {VALID_PAYMENT_FORMS}")
        data["payment_form"] = payment_form

        use = data.get("use", "G03")
        if use not in VALID_USES:
            raise ValueError(f"Invalid use. Valid: {VALID_USES}")
        data["use"] = use

        return data

    def _calculate_totals(self, items: list) -> tuple[float, float, float]:
        """Returns (subtotal, tax, total)."""
        subtotal = sum(
            float(item["unit_price"]) * int(item["quantity"])
            for item in items
        )
        tax = sum(
            float(item["unit_price"]) * int(item["quantity"]) * float(item.get("tax_rate", 0.16))
            for item in items
        )
        return round(subtotal, 2), round(tax, 2), round(subtotal + tax, 2)

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        subtotal, tax, total = self._calculate_totals(data["items"])
        folio = _next_folio()

        # Try real CFDI dual provider (Facturama → FacturAPI fallback)
        try:
            from src.integrations import cfdi_provider
            generic_items = [
                {
                    "description": item.get("description", "Producto"),
                    "product_key": item.get("product_key", "01010101"),
                    "quantity": int(item.get("quantity", 1)),
                    "unit_price": float(item.get("unit_price", 0)),
                }
                for item in data["items"]
            ]
            result = await cfdi_provider.create_invoice(
                customer_rfc=data["customer_rfc"],
                customer_name=data["customer_name"],
                items=generic_items,
                payment_form=data["payment_method"],
                payment_method=data.get("payment_form", "PUE"),
                use=data.get("use", "G03"),
            )
            if result["success"]:
                logger.info(f"{self.name} timbrado OK via {result.get('provider')}")
                return {
                    "uuid": result.get("uuid") or str(uuid.uuid4()),
                    "folio": result.get("folio_number") or folio,
                    "customer_rfc": data["customer_rfc"],
                    "customer_name": data["customer_name"],
                    "subtotal": subtotal,
                    "tax": tax,
                    "total": total,
                    "payment_method": data["payment_method"],
                    "payment_form": data.get("payment_form", "PUE"),
                    "use": data.get("use", "G03"),
                    "xml_url": result.get("xml_url"),
                    "pdf_url": result.get("pdf_url"),
                    "status": "timbrada",
                    "timbrado_at": result.get("timbrado_at") or datetime.now(timezone.utc).isoformat(),
                    "provider": result.get("provider"),
                }
        except Exception as e:
            logger.warning(f"{self.name} CFDI provider unavailable, using mock: {e}")

        # Mock fallback — no credentials or provider error
        return {
            "uuid": str(uuid.uuid4()),
            "folio": folio,
            "customer_rfc": data["customer_rfc"],
            "customer_name": data["customer_name"],
            "subtotal": subtotal,
            "tax": tax,
            "total": total,
            "payment_method": data["payment_method"],
            "payment_form": data.get("payment_form", "PUE"),
            "use": data.get("use", "G03"),
            "xml_url": None,
            "pdf_url": None,
            "status": "pending_timbrado",
            "timbrado_at": None,
            "note": "CFDI provider integration pending — configure credentials in .env",
        }


cfdi_billing = Agent13CFDIBilling()
