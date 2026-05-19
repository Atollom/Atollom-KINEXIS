"""
Agente #24: Thermal Printer
Responsabilidad: Generar etiquetas ZPL y tickets PDF para impresión térmica
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

VALID_TYPES   = {"shipping_label", "product_label", "invoice_ticket"}
VALID_FORMATS = {"zpl", "pdf"}

REQUIRED_DATA_FIELDS: Dict[str, list] = {
    "shipping_label": ["order_id", "tracking", "recipient", "address"],
    "product_label":  ["sku", "name", "price"],
    "invoice_ticket": ["order_id", "total", "items"],
}


# ── ZPL builders ──────────────────────────────────────────────────────────────

def _zpl_shipping(d: Dict) -> str:
    return (
        "^XA"
        "^FO50,30^A0N,40,40^FDKINEXIS^FS"
        f"^FO50,90^A0N,30,30^FDOrden: {d.get('order_id','')}^FS"
        f"^FO50,140^A0N,30,30^FDTracking: {d.get('tracking','')}^FS"
        f"^FO50,200^A0N,28,28^FD{d.get('recipient','')}^FS"
        f"^FO50,240^A0N,24,24^FD{d.get('address','')}^FS"
        "^FO50,300^GB700,3,3^FS"
        "^XZ"
    )


def _zpl_product(d: Dict) -> str:
    return (
        "^XA"
        f"^FO50,30^A0N,30,30^FDSKU: {d.get('sku','')}^FS"
        f"^FO50,80^A0N,40,40^FD{d.get('name','')}^FS"
        f"^FO50,140^A0N,35,35^FD${d.get('price','0.00')} MXN^FS"
        "^XZ"
    )


def _text_ticket(d: Dict) -> str:
    lines = [
        "=" * 40,
        "       KINEXIS — Comprobante",
        "=" * 40,
        f"Orden: {d.get('order_id','N/A')}",
        f"Total: ${d.get('total','0.00')} MXN",
        "-" * 40,
    ]
    for item in d.get("items", []):
        lines.append(f"  {item.get('qty',1)}x {item.get('name','Producto')}  ${item.get('price',0)}")
    lines += ["-" * 40, "      Gracias por su compra", "=" * 40]
    return "\n".join(lines)


# ── PDF builder (reportlab) ───────────────────────────────────────────────────

def _build_pdf(label_type: str, data: Dict) -> bytes:
    from reportlab.lib.pagesizes import A6
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    import io

    buf = io.BytesIO()
    w, h = A6
    c = canvas.Canvas(buf, pagesize=A6)

    # Header bar
    c.setFillColorRGB(0.08, 0.32, 0.17)
    c.rect(0, h - 22 * mm, w, 22 * mm, fill=1, stroke=0)
    c.setFillColorRGB(0.8, 1.0, 0.0)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(8 * mm, h - 14 * mm, "KINEXIS")

    c.setFillColorRGB(0.1, 0.1, 0.1)

    if label_type == "shipping_label":
        c.setFont("Helvetica-Bold", 10)
        c.drawString(8 * mm, h - 34 * mm, f"Orden: {data.get('order_id','')}")
        c.drawString(8 * mm, h - 44 * mm, f"Tracking: {data.get('tracking','')}")
        c.setFont("Helvetica", 10)
        c.drawString(8 * mm, h - 56 * mm, f"Destinatario: {data.get('recipient','')}")
        c.drawString(8 * mm, h - 64 * mm, str(data.get("address", "")))

    elif label_type == "product_label":
        c.setFont("Helvetica-Bold", 12)
        c.drawString(8 * mm, h - 34 * mm, f"SKU: {data.get('sku','')}")
        c.setFont("Helvetica-Bold", 14)
        c.drawString(8 * mm, h - 48 * mm, str(data.get("name", "")))
        c.setFont("Helvetica-Bold", 18)
        c.setFillColorRGB(0.08, 0.5, 0.2)
        c.drawString(8 * mm, h - 66 * mm, f"${data.get('price','0.00')} MXN")

    else:  # invoice_ticket
        c.setFont("Helvetica-Bold", 11)
        c.drawString(8 * mm, h - 34 * mm, f"Orden: {data.get('order_id','')}")
        y = h - 46 * mm
        c.setFont("Helvetica", 9)
        for item in data.get("items", []):
            line = f"  {item.get('qty',1)}x {item.get('name','Producto')}  ${item.get('price',0)}"
            c.drawString(8 * mm, y, line)
            y -= 6 * mm
        c.setFont("Helvetica-Bold", 12)
        c.setFillColorRGB(0.08, 0.5, 0.2)
        c.drawString(8 * mm, y - 4 * mm, f"Total: ${data.get('total','0.00')} MXN")

    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.6, 0.6, 0.6)
    c.drawString(8 * mm, 6 * mm,
                 f"Generado {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC — KINEXIS")
    c.save()
    return buf.getvalue()


class Agent24ThermalPrinter:
    """
    Thermal Printer — ZPL (Zebra) y PDF (reportlab) para impresión térmica.

    Input:
        {
            "type":   str  — shipping_label | product_label | invoice_ticket
            "format": str  — zpl | pdf
            "data":   dict — campos según tipo
        }
    """

    REQUIRED_FIELDS = ["type", "format", "data"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #24 - Thermal Printer"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info("%s type=%s format=%s print_ready=%s",
                        self.name, validated["type"], validated["format"],
                        result.get("print_ready"))
            return {"success": True, "agent": self.name,
                    "timestamp": datetime.now(timezone.utc).isoformat(), "data": result}
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
            return {"success": False, "agent": self.name, "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()}

    def _validate_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        for f in self.REQUIRED_FIELDS:
            if f not in data:
                raise ValueError(f"Missing required field: {f}")
        if data["type"] not in VALID_TYPES:
            raise ValueError(f"Invalid type. Valid: {VALID_TYPES}")
        if data["format"] not in VALID_FORMATS:
            raise ValueError(f"Invalid format. Valid: {VALID_FORMATS}")
        if not isinstance(data["data"], dict):
            raise ValueError("data must be a dict")
        missing = [f for f in REQUIRED_DATA_FIELDS[data["type"]] if f not in data["data"]]
        if missing:
            raise ValueError(f"data missing fields for {data['type']}: {missing}")
        return data

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        label_type = data["type"]
        fmt        = data["format"]
        payload    = data["data"]

        if fmt == "zpl":
            if label_type == "shipping_label":
                content = _zpl_shipping(payload)
            elif label_type == "product_label":
                content = _zpl_product(payload)
            else:
                content = _text_ticket(payload)
            return {
                "type": label_type, "format": "zpl",
                "content": content, "pdf_bytes": None,
                "print_ready": True,
            }

        # PDF via reportlab
        try:
            pdf_bytes = _build_pdf(label_type, payload)
            import base64
            return {
                "type": label_type, "format": "pdf",
                "content": f"PDF generated ({len(pdf_bytes)} bytes)",
                "pdf_base64": base64.b64encode(pdf_bytes).decode(),
                "pdf_bytes": pdf_bytes,
                "print_ready": True,
            }
        except ImportError:
            return {
                "type": label_type, "format": "pdf",
                "content": "reportlab not installed — ZPL format available",
                "print_ready": False,
            }


thermal_printer = Agent24ThermalPrinter()
