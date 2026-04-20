"""
Agente #13: CFDI Billing
Responsabilidad: Generar facturas CFDI 4.0 SAT-compliant vía FacturAPI
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import re
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# RFC genérico para público en general (SAT)
RFC_PUBLICO_GENERAL = "XAXX010101000"
# Regex validación RFC (personas físicas y morales)
RFC_PATTERN = re.compile(r"^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$")


class Agent13CFDIBilling:
    """
    CFDI Billing — Generación y timbrado de facturas CFDI 4.0.

    Flujo:
      1. Valida RFC del receptor con SAT
      2. Construye XML CFDI 4.0
      3. Timbra vía FacturAPI
      4. Genera PDF
      5. Envía por email / guarda en Supabase Storage

    Input:
        {
            "tenant_id":      str
            "customer_rfc":   str   — RFC receptor
            "customer_name":  str
            "items":          list  — [{description, qty, unit_price, unit_key}]
            "total":          float
            "payment_form":   str   — "03" transferencia, "01" efectivo
            "use":            str   — "G03" gastos generales
        }

    Output:
        {
            "uuid":     str   — Folio fiscal SAT
            "xml_url":  str
            "pdf_url":  str
            "series":   str
            "folio":    int
        }
    """

    REQUIRED_FIELDS = ["tenant_id", "customer_rfc", "items", "total", "payment_form"]
    VALID_PAYMENT_FORMS = {"01", "03", "04", "28", "29"}

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #13 - CFDI Billing"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Genera factura CFDI 4.0 timbrada."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} invoice generated for RFC {validated['customer_rfc']}")
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

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for field in self.REQUIRED_FIELDS:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        rfc = data["customer_rfc"].upper().strip()
        if not RFC_PATTERN.match(rfc):
            raise ValueError(f"RFC inválido: {rfc}")
        data["customer_rfc"] = rfc

        if not isinstance(data["items"], list) or len(data["items"]) == 0:
            raise ValueError("items must be non-empty list")

        if float(data["total"]) <= 0:
            raise ValueError("total must be > 0")

        if data["payment_form"] not in self.VALID_PAYMENT_FORMS:
            raise ValueError(f"payment_form inválida. Válidas: {self.VALID_PAYMENT_FORMS}")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        import facturapi
        client = facturapi.Facturapi(os.getenv("FACTURAPI_KEY"))
        invoice = await client.invoices.create({
            "customer": {"legal_name": data["customer_name"], "tax_id": data["customer_rfc"]},
            "items": data["items"],
            "payment_form": data["payment_form"],
            "use": data.get("use", "G03"),
        })
        return {"uuid": invoice.uuid, "xml_url": invoice.xml_url, "pdf_url": invoice.pdf_url}
        """
        return {
            "uuid": None,
            "xml_url": None,
            "pdf_url": None,
            "series": "A",
            "folio": None,
            "note": "FacturAPI integration pending — Fase 2",
        }


cfdi_billing = Agent13CFDIBilling()
