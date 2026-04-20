"""
Agente #24: Thermal Printer
Responsabilidad: Generar etiquetas/tickets para impresión térmica (ZPL/PDF)
Autor: Carlos Cortés (Atollom Labs)
Fecha: 2026-04-21
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_TYPES = {"shipping_label", "product_label", "invoice_ticket"}
VALID_FORMATS = {"zpl", "pdf"}

REQUIRED_DATA_FIELDS: Dict[str, list] = {
    "shipping_label":  ["order_id", "tracking", "recipient", "address"],
    "product_label":   ["sku", "name", "price"],
    "invoice_ticket":  ["order_id", "total", "items"],
}


def _build_zpl_shipping(data: Dict) -> str:
    """Minimal ZPL template for shipping label (4x6 inch)."""
    return (
        "^XA"
        "^FO50,30^A0N,40,40^FDKINEXiS^FS"
        f"^FO50,90^A0N,30,30^FDOrder: {data.get('order_id', '')}^FS"
        f"^FO50,140^A0N,30,30^FDTracking: {data.get('tracking', '')}^FS"
        f"^FO50,200^A0N,28,28^FD{data.get('recipient', '')}^FS"
        f"^FO50,240^A0N,24,24^FD{data.get('address', '')}^FS"
        "^FO50,300^GB700,3,3^FS"
        "^XZ"
    )


def _build_zpl_product(data: Dict) -> str:
    return (
        "^XA"
        f"^FO50,30^A0N,30,30^FDSKU: {data.get('sku', '')}^FS"
        f"^FO50,80^A0N,40,40^FD{data.get('name', '')}^FS"
        f"^FO50,140^A0N,35,35^FD${data.get('price', '0.00')} MXN^FS"
        "^XZ"
    )


def _build_text_ticket(data: Dict) -> str:
    lines = [
        "=" * 40,
        "       KINEXIS — Comprobante",
        "=" * 40,
        f"Orden: {data.get('order_id', 'N/A')}",
        f"Total: ${data.get('total', '0.00')} MXN",
        "-" * 40,
    ]
    for item in data.get("items", []):
        lines.append(f"  {item.get('qty', 1)}x {item.get('name', 'Producto')}  ${item.get('price', 0)}")
    lines += ["-" * 40, "      Gracias por su compra", "=" * 40]
    return "\n".join(lines)


class Agent24ThermalPrinter:
    """
    Thermal Printer — Generación de etiquetas y tickets para impresión térmica.

    Tipos:
      shipping_label → Etiqueta de envío (guía + destinatario)
      product_label  → Etiqueta de producto (SKU, nombre, precio)
      invoice_ticket → Ticket de comprobante (items, total)

    Formatos:
      zpl → Zebra Programming Language (impresoras Zebra/Intermec)
      pdf → PDF vía generador (Fase 2)

    Input:
        {
            "type":   str  — shipping_label | product_label | invoice_ticket
            "format": str  — zpl | pdf
            "data":   dict — campos según tipo
        }

    Output:
        {
            "type":        str
            "format":      str
            "content":     str  — ZPL string o text content
            "preview_url": str  — (Fase 2 para PDF)
            "print_ready": bool
        }
    """

    REQUIRED_FIELDS = ["type", "format", "data"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #24 - Thermal Printer"
        logger.info(f"{self.name} initialized")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Genera contenido de impresión térmica."""
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(f"{self.name} type={validated['type']} format={validated['format']}")
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

        if data["type"] not in VALID_TYPES:
            raise ValueError(f"Invalid type. Valid: {VALID_TYPES}")

        if data["format"] not in VALID_FORMATS:
            raise ValueError(f"Invalid format. Valid: {VALID_FORMATS}")

        payload = data["data"]
        if not isinstance(payload, dict):
            raise ValueError("data must be a dict")

        required = REQUIRED_DATA_FIELDS[data["type"]]
        missing = [f for f in required if f not in payload]
        if missing:
            raise ValueError(f"data missing fields for {data['type']}: {missing}")

        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TODO Fase 2:
        - PDF generation via WeasyPrint or reportlab
        - Direct print via Zebra SDK / CUPS
        - Store label in Supabase Storage
        """
        label_type = data["type"]
        fmt = data["format"]
        payload = data["data"]
        content = ""

        if fmt == "zpl":
            if label_type == "shipping_label":
                content = _build_zpl_shipping(payload)
            elif label_type == "product_label":
                content = _build_zpl_product(payload)
            else:
                content = _build_text_ticket(payload)
        else:  # pdf
            content = f"PDF generation pending — Fase 2 (type={label_type})"

        return {
            "type": label_type,
            "format": fmt,
            "content": content,
            "preview_url": None,
            "print_ready": fmt == "zpl",
            "note": "PDF generation & direct print integration pending — Fase 2",
        }


thermal_printer = Agent24ThermalPrinter()
