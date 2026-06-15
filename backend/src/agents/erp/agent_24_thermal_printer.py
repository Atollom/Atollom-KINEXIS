"""Agent #24 — Thermal Printer (ZPL/PDF label generator)"""
import io
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def _zpl_shipping_label(d: dict) -> str:
    return (
        "^XA\n"
        "^FO50,30^A0N,40,40^FDKINExIS^FS\n"
        f"^FO50,80^A0N,25,25^FD{d.get('carrier','').upper()} {d.get('service','').upper()}^FS\n"
        f"^FO50,115^A0N,20,20^FDTracking: {d.get('tracking_number','N/A')}^FS\n"
        "^FO50,145^GB700,3,3^FS\n"
        f"^FO50,155^A0N,22,22^FDDE: {d.get('origin_name','')}^FS\n"
        f"^FO50,185^A0N,18,18^FD{d.get('origin_address','')}^FS\n"
        "^FO50,215^GB700,3,3^FS\n"
        f"^FO50,225^A0N,22,22^FDPARA: {d.get('dest_name','')}^FS\n"
        f"^FO50,255^A0N,18,18^FD{d.get('dest_address','')}^FS\n"
        f"^FO50,285^A0N,18,18^FD{d.get('dest_city','')}, {d.get('dest_zip','')}^FS\n"
        "^FO50,315^GB700,3,3^FS\n"
        f"^FO50,325^A0N,18,18^FDPeso: {d.get('weight_kg','?')} kg | Piezas: {d.get('pieces',1)}^FS\n"
        f"^FO50,350^A0N,18,18^FDReferencia: {d.get('reference','')}^FS\n"
        f"^FO50,375^BCN,80,Y,N,N^FD{d.get('tracking_number','000000')}^FS\n"
        "^XZ"
    )


def _zpl_product_label(d: dict) -> str:
    return (
        "^XA\n"
        f"^FO30,20^A0N,30,30^FD{d.get('name','Producto')}^FS\n"
        f"^FO30,60^A0N,22,22^FDSKU: {d.get('sku','')}^FS\n"
        f"^FO30,90^A0N,22,22^FDPrecio: ${float(d.get('price',0)):,.2f}^FS\n"
        f"^FO30,120^BCN,60,Y,N,N^FD{d.get('barcode', d.get('sku','000'))}^FS\n"
        "^XZ"
    )


def _pdf_invoice_ticket(d: dict) -> bytes:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=(3 * inch, 6 * inch), topMargin=0.3 * inch, bottomMargin=0.3 * inch)
        styles = getSampleStyleSheet()
        story = [
            Paragraph("<b>TICKET DE VENTA</b>", styles["Title"]),
            Spacer(1, 6),
            Paragraph(f"Folio: {d.get('folio','N/A')}", styles["Normal"]),
            Paragraph(f"Fecha: {d.get('date', datetime.now().strftime('%Y-%m-%d %H:%M'))}", styles["Normal"]),
            Spacer(1, 6),
        ]
        for item in d.get("items", []):
            story.append(Paragraph(
                f"{item.get('description','')} x{item.get('qty',1)} — ${float(item.get('subtotal',0)):,.2f}",
                styles["Normal"],
            ))
        story += [
            Spacer(1, 6),
            Paragraph(f"<b>Total: ${float(d.get('total',0)):,.2f}</b>", styles["Normal"]),
        ]
        doc.build(story)
        return buf.getvalue()
    except ImportError:
        return b""


class ThermalPrinterAgent:
    name = "Thermal Printer #24"

    async def execute(self, data: dict) -> dict:
        label_type = data.get("label_type", "shipping_label")
        fmt = data.get("format", "zpl")
        payload = data.get("data", {})

        try:
            if label_type == "shipping_label":
                content = _zpl_shipping_label(payload)
                return {"success": True, "data": {"format": "zpl", "content": content, "label_type": label_type}}
            elif label_type == "product_label":
                content = _zpl_product_label(payload)
                return {"success": True, "data": {"format": "zpl", "content": content, "label_type": label_type}}
            elif label_type == "invoice_ticket":
                pdf = _pdf_invoice_ticket(payload)
                return {"success": True, "data": {"format": "pdf", "content_b64": pdf.hex(), "label_type": label_type}}
            else:
                return {"success": False, "error": f"Unknown label_type: {label_type}", "data": {}}
        except Exception as exc:
            logger.error("ThermalPrinter failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


thermal_printer = ThermalPrinterAgent()
