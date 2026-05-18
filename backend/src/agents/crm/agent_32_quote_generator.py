"""
Agente #32: Quote Generator
Responsabilidad: Generar cotizaciones profesionales en PDF (reportlab)
Autor: Carlos Cortés (Atollom Labs)
"""

import io
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

VALID_PAYMENT_TERMS = {"immediate", "15_days", "30_days", "60_days", "90_days"}
PAYMENT_LABELS: Dict[str, str] = {
    "immediate": "Pago inmediato",
    "15_days":   "15 días netos",
    "30_days":   "30 días netos",
    "60_days":   "60 días netos",
    "90_days":   "90 días netos",
}
DEFAULT_TAX_RATE = 0.16

_QUOTE_COUNTER = 41


def _next_quote_number() -> str:
    global _QUOTE_COUNTER
    _QUOTE_COUNTER += 1
    year = datetime.now(timezone.utc).year
    return f"COT-{year}-{_QUOTE_COUNTER:03d}"


# ── PDF builder ───────────────────────────────────────────────────────────────

def _build_pdf(
    quote_number: str,
    customer: Dict[str, Any],
    items: list,
    subtotal: float,
    tax: float,
    total: float,
    tax_rate: float,
    payment_terms: str,
    valid_until: str,
    notes: Optional[str],
) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    )

    GREEN      = colors.HexColor("#16a34a")
    GREEN_DARK = colors.HexColor("#14532d")
    GREEN_LITE = colors.HexColor("#f0fdf4")
    GRAY_DARK  = colors.HexColor("#111827")
    GRAY_MID   = colors.HexColor("#4b5563")
    GRAY_LIGHT = colors.HexColor("#f3f4f6")
    WHITE      = colors.white

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=14 * mm,
        bottomMargin=18 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph(
            '<font color="#FFFFFF" size="22"><b>KINEXIS</b></font><br/>'
            '<font color="#bbf7d0" size="9">Plataforma E-commerce · CRM · ERP</font>',
            ParagraphStyle("logo", fontName="Helvetica", leading=14),
        ),
        Paragraph(
            f'<font color="#FFFFFF" size="20"><b>COTIZACIÓN</b></font><br/>'
            f'<font color="#bbf7d0" size="10">{quote_number}</font>',
            ParagraphStyle("folio", fontName="Helvetica", alignment=2, leading=14),
        ),
    ]]
    header_table = Table(header_data, colWidths=["55%", "45%"])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), GREEN_DARK),
        ("TOPPADDING",   (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 14),
        ("LEFTPADDING",  (0, 0), (0, -1), 16),
        ("RIGHTPADDING", (1, 0), (1, -1), 16),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6 * mm))

    # ── Customer + Meta grid ─────────────────────────────────────────────────
    def label(text: str) -> Paragraph:
        return Paragraph(f'<font color="{GRAY_MID.hexval()}" size="7"><b>{text}</b></font>',
                         ParagraphStyle("lbl", fontName="Helvetica"))

    def value(text: str, bold: bool = False, size: int = 9) -> Paragraph:
        w = "b" if bold else ""
        return Paragraph(f'<font color="{GRAY_DARK.hexval()}" size="{size}"><{w}>{text}</{w}></font>',
                         ParagraphStyle("val", fontName="Helvetica"))

    today_str = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    meta_data = [
        [label("CLIENTE"),        label("RFC"),                    label("FECHA"),       label("VÁLIDO HASTA")],
        [value(customer["name"], bold=True, size=10),
         value(customer.get("rfc", "—")),
         value(today_str),
         value(valid_until)],
        [value(customer.get("contact", ""), size=8),
         value(customer.get("email", ""), size=8),
         value(PAYMENT_LABELS.get(payment_terms, payment_terms), size=8),
         Paragraph("", styles["Normal"])],
    ]
    meta_table = Table(meta_data, colWidths=["35%", "25%", "20%", "20%"])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), GREEN_LITE),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BOX",          (0, 0), (-1, -1), 0.5, GREEN),
        ("GRID",         (0, 0), (-1, 0), 0.5, GREEN),
        ("LINEBELOW",    (0, 0), (-1, 0), 0.5, GREEN),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 7 * mm))

    # ── Items table ──────────────────────────────────────────────────────────
    col_headers = ["#", "SKU", "Descripción", "Cant.", "P. Unit.", "Subtotal"]
    rows = [col_headers]
    for idx, item in enumerate(items, start=1):
        qty = int(item["quantity"])
        price = float(item["unit_price"])
        sub = round(qty * price, 2)
        rows.append([
            str(idx),
            item.get("sku", "—"),
            item.get("description", "—"),
            str(qty),
            f"${price:,.2f}",
            f"${sub:,.2f}",
        ])

    col_widths = [8 * mm, 28 * mm, None, 14 * mm, 26 * mm, 26 * mm]
    items_table = Table(rows, colWidths=col_widths, repeatRows=1)
    items_style = [
        ("FONTNAME",     (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 0),  8),
        ("BACKGROUND",   (0, 0), (-1, 0),  GREEN),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",     (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",    (0, 1), (-1, -1), GRAY_DARK),
        ("ALIGN",        (0, 0), (-1, -1), "CENTER"),
        ("ALIGN",        (2, 1), (2, -1),  "LEFT"),
        ("ALIGN",        (4, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("GRID",         (0, 0), (-1, -1), 0.3, colors.HexColor("#d1fae5")),
        ("LINEBELOW",    (0, 0), (-1, 0),  1,   GREEN),
    ]
    for i in range(1, len(rows)):
        bg = GRAY_LIGHT if i % 2 == 0 else WHITE
        items_style.append(("BACKGROUND", (0, i), (-1, i), bg))
    items_table.setStyle(TableStyle(items_style))
    story.append(items_table)
    story.append(Spacer(1, 5 * mm))

    # ── Totals ───────────────────────────────────────────────────────────────
    tax_pct = int(tax_rate * 100)
    totals_data = [
        ["", "Subtotal",              f"${subtotal:,.2f}"],
        ["", f"IVA ({tax_pct}%)",     f"${tax:,.2f}"],
        ["", "TOTAL",                 f"${total:,.2f}"],
    ]
    totals_table = Table(totals_data, colWidths=["*", 50 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ("FONTNAME",     (0, 0), (-1, 1),  "Helvetica"),
        ("FONTNAME",     (0, 2), (-1, 2),  "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, 1),  9),
        ("FONTSIZE",     (0, 2), (-1, 2),  12),
        ("TEXTCOLOR",    (1, 0), (1, 1),   GRAY_MID),
        ("TEXTCOLOR",    (2, 0), (2, 1),   GRAY_DARK),
        ("TEXTCOLOR",    (0, 2), (-1, 2),  WHITE),
        ("BACKGROUND",   (0, 2), (-1, 2),  GREEN),
        ("ALIGN",        (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("LINEABOVE",    (1, 1), (-1, 1),  0.5, colors.HexColor("#d1fae5")),
        ("LINEABOVE",    (0, 2), (-1, 2),  1.5, GREEN_DARK),
    ]))
    story.append(totals_table)

    # ── Notes ─────────────────────────────────────────────────────────────────
    if notes:
        story.append(Spacer(1, 6 * mm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=GREEN_LITE))
        story.append(Spacer(1, 3 * mm))
        story.append(Paragraph(
            f'<font color="{GRAY_MID.hexval()}" size="8"><b>NOTAS:</b> {notes}</font>',
            ParagraphStyle("notes", fontName="Helvetica", leading=12),
        ))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(
        f'<font color="{GRAY_MID.hexval()}" size="7">'
        "Atollom Labs S. de R.L. de C.V. &nbsp;·&nbsp; contacto@atollom.com &nbsp;·&nbsp; "
        "Esta cotización es válida hasta el " + valid_until + " &nbsp;·&nbsp; "
        "Los precios indicados son en MXN e incluyen IVA en el monto total."
        "</font>",
        ParagraphStyle("footer", fontName="Helvetica", alignment=1, leading=10),
    ))

    doc.build(story)
    return buf.getvalue()


# ── Agent ─────────────────────────────────────────────────────────────────────

class Agent32QuoteGenerator:
    """
    Quote Generator — Cotizaciones PDF con reportlab.

    Input:
        {
            "customer":      dict  — {name, rfc?, contact?, email?}
            "items":         list  — [{sku, description, quantity, unit_price}]
            "payment_terms": str   — immediate | 15_days | 30_days | 60_days | 90_days
            "valid_until":   str   — ISO YYYY-MM-DD (opcional)
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
            "pdf_bytes":     bytes  — PDF binary (returned in-memory)
            "valid_until":   str
            "sent_at":       str
        }
    """

    REQUIRED_FIELDS = ["customer", "items"]

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.name = "Agent #32 - Quote Generator"
        logger.info("%s initialized", self.name)

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            validated = self._validate_input(input_data)
            result = await self._process(validated)
            logger.info(
                "%s quote=%s total=%.2f customer=%s",
                self.name, result.get("quote_number"),
                result.get("total", 0), result.get("customer_name"),
            )
            return {
                "success": True,
                "agent": self.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": result,
            }
        except Exception as e:
            logger.error("%s failed: %s", self.name, e)
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
            if int(item.get("quantity", 0)) <= 0:
                raise ValueError(f"items[{i}] quantity must be > 0")
            if float(item.get("unit_price", 0)) < 0:
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
        subtotal = sum(float(item["unit_price"]) * int(item["quantity"]) for item in items)
        tax = round(subtotal * tax_rate, 2)
        return round(subtotal, 2), tax, round(subtotal + tax, 2)

    def _get_valid_until(self, specified: Optional[str]) -> str:
        if specified:
            return specified
        return (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()

    async def _process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        customer = data["customer"]
        items = data["items"]
        tax_rate = data["tax_rate"]
        subtotal, tax, total = self._calculate_totals(items, tax_rate)
        quote_number = _next_quote_number()
        valid_until = self._get_valid_until(data.get("valid_until"))
        payment_terms = data["payment_terms"]
        notes = data.get("notes")

        pdf_bytes = _build_pdf(
            quote_number=quote_number,
            customer=customer,
            items=items,
            subtotal=subtotal,
            tax=tax,
            total=total,
            tax_rate=tax_rate,
            payment_terms=payment_terms,
            valid_until=valid_until,
            notes=notes,
        )

        return {
            "quote_number":   quote_number,
            "customer_name":  customer["name"],
            "customer_contact": customer.get("contact"),
            "sent_to":        customer.get("email"),
            "items_count":    len(items),
            "subtotal":       subtotal,
            "tax":            tax,
            "tax_rate":       tax_rate,
            "total":          total,
            "payment_terms":  payment_terms,
            "valid_until":    valid_until,
            "notes":          notes,
            "pdf_bytes":      pdf_bytes,
            "sent_at":        datetime.now(timezone.utc).isoformat(),
        }


quote_generator = Agent32QuoteGenerator()
