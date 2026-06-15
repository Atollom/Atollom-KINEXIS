"""Agent #32 — Quote Generator (PDF via ReportLab + DB persistence)"""
import io
import logging
from datetime import datetime, timedelta

from src.utils.database import db

logger = logging.getLogger(__name__)


class QuoteGeneratorAgent:
    name = "Quote Generator #32"

    async def execute(self, data: dict) -> dict:
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib.units import inch

            tenant_id = data.get("tenant_id")
            customer = data.get("customer", {})
            items = data.get("items", [])
            tax_rate = float(data.get("tax_rate", 0.16))
            payment_terms = data.get("payment_terms", "30_days")

            quote_number = f"KNX-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            valid_until = data.get("valid_until") or (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

            subtotal = sum(float(i.get("qty", 1)) * float(i.get("unit_price", 0)) for i in items)
            tax = subtotal * tax_rate
            total = subtotal + tax

            buf = io.BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
            styles = getSampleStyleSheet()
            story = []

            story.append(Paragraph("<b>KINEXIS</b> — Cotización", styles["Title"]))
            story.append(Paragraph(f"Folio: {quote_number} | Vigencia: {valid_until}", styles["Normal"]))
            story.append(Spacer(1, 12))

            story.append(Paragraph(f"<b>Cliente:</b> {customer.get('name', 'N/A')}", styles["Normal"]))
            story.append(Paragraph(f"<b>RFC:</b> {customer.get('rfc', 'N/A')}", styles["Normal"]))
            story.append(Spacer(1, 12))

            table_data = [["Descripción", "Cant.", "P. Unit.", "Subtotal"]]
            for item in items:
                qty = float(item.get("qty", 1))
                price = float(item.get("unit_price", 0))
                table_data.append([
                    item.get("description", ""),
                    str(int(qty)),
                    f"${price:,.2f}",
                    f"${qty * price:,.2f}",
                ])
            table_data.append(["", "", "Subtotal:", f"${subtotal:,.2f}"])
            table_data.append(["", "", f"IVA ({int(tax_rate * 100)}%):", f"${tax:,.2f}"])
            table_data.append(["", "", "<b>Total:</b>", f"<b>${total:,.2f}</b>"])

            t = Table(table_data, colWidths=[3.5 * inch, 0.75 * inch, 1.25 * inch, 1.5 * inch])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#16a34a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -4), [colors.white, colors.HexColor("#f9fafb")]),
            ]))
            story.append(t)
            story.append(Spacer(1, 12))

            terms_map = {"30_days": "30 días", "15_days": "15 días", "immediate": "Contado", "60_days": "60 días"}
            story.append(Paragraph(f"<b>Condiciones de pago:</b> {terms_map.get(payment_terms, payment_terms)}", styles["Normal"]))
            if data.get("notes"):
                story.append(Paragraph(f"<b>Notas:</b> {data['notes']}", styles["Normal"]))

            doc.build(story)
            pdf_bytes = buf.getvalue()

            if tenant_id:
                try:
                    lead_id = customer.get("lead_id")
                    await db.execute(
                        """INSERT INTO quotes
                           (tenant_id, quote_number, customer_name, customer_rfc, lead_id,
                            subtotal, iva, total, payment_terms, valid_until, items, status, created_at)
                           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,'draft',NOW())""",
                        tenant_id,
                        quote_number,
                        customer.get("name", ""),
                        customer.get("rfc", ""),
                        str(lead_id) if lead_id else None,
                        subtotal,
                        tax,
                        total,
                        payment_terms,
                        valid_until,
                        __import__("json").dumps(items),
                    )
                except Exception as db_exc:
                    logger.warning("Quote DB save failed (PDF still generated): %s", db_exc)

            return {
                "success": True,
                "data": {
                    "quote_number": quote_number,
                    "pdf_bytes": pdf_bytes,
                    "subtotal": subtotal,
                    "tax": tax,
                    "total": total,
                    "valid_until": valid_until,
                },
            }
        except Exception as exc:
            logger.error("QuoteGenerator failed: %s", exc)
            return {"success": False, "error": str(exc), "data": {}}


quote_generator = QuoteGeneratorAgent()
