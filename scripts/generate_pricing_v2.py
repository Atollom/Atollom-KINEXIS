import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# CONFIGURACIÓN DE COLORES (EXACTOS)
BG_PRINCIPAL = colors.HexColor("#0f1729")
BG_CARDS = colors.HexColor("#202938")
BG_HOVER = colors.HexColor("#2a3441")
VERDE_PRIMARY = colors.HexColor("#b8e74a")
VERDE_SECONDARY = colors.HexColor("#7fb518")
TEXTO_PRIMARY = colors.HexColor("#ffffff")
TEXTO_SECONDARY = colors.Color(1, 1, 1, alpha=0.7)
GLOW_COLOR = colors.Color(184/255, 231/255, 74/255, alpha=0.2)

# ESTILOS
styles = getSampleStyleSheet()
style_h1 = ParagraphStyle(
    'H1Custom',
    parent=styles['Heading1'],
    fontSize=28,
    textColor=VERDE_PRIMARY,
    alignment=TA_CENTER,
    spaceAfter=20,
    fontName='Helvetica-Bold'
)
style_h2 = ParagraphStyle(
    'H2Custom',
    parent=styles['Heading2'],
    fontSize=18,
    textColor=TEXTO_PRIMARY,
    alignment=TA_LEFT,
    spaceAfter=15,
    fontName='Helvetica-Bold'
)
style_body = ParagraphStyle(
    'BodyCustom',
    parent=styles['Normal'],
    fontSize=11,
    textColor=TEXTO_SECONDARY,
    alignment=TA_LEFT,
    leading=14,
    fontName='Helvetica'
)
style_card_title = ParagraphStyle(
    'CardTitle',
    fontSize=14,
    textColor=VERDE_PRIMARY,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold',
    spaceAfter=10
)
style_price = ParagraphStyle(
    'PriceStyle',
    fontSize=24,
    textColor=TEXTO_PRIMARY,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold',
    spaceAfter=5
)

class KinexisPDF(SimpleDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4, **kw)
        self.filename = filename

    def draw_background(self, canv, doc):
        canv.saveState()
        canv.setFillColor(BG_PRINCIPAL)
        canv.rect(0, 0, A4[0], A4[1], fill=1)
        # Decoración sutil superior
        canv.setStrokeColor(VERDE_PRIMARY)
        canv.setLineWidth(0.5)
        canv.line(50, A4[1]-50, A4[0]-50, A4[1]-50)
        canv.restoreState()

def create_pricing_pdf():
    output_path = "Adminsitrativo/Kinexis_Pricing_2026_v2.pdf"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = KinexisPDF(output_path, leftMargin=50, rightMargin=50, topMargin=60, bottomMargin=50)
    elements = []

    # ==========================================
    # PÁGINA 1: COSTOS DE INFRAESTRUCTURA
    # ==========================================
    elements.append(Paragraph("COSTOS MENSUALES DE INFRAESTRUCTURA", style_h1))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("Desglose técnico de recursos por cliente/mes para la operación de KINEXIS.", style_body))
    elements.append(Spacer(1, 30))

    def create_cost_table(title, items, total):
        data = [[Paragraph(title, style_h2), "", Paragraph(f"${total} MXN/mes", style_h2)]]
        data += [["", Paragraph(item, style_body), Paragraph(cost, style_body)] for item, cost in items]
        
        t = Table(data, colWidths=[150, 250, 100])
        t.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('ALIGN', (2,0), (2,-1), 'RIGHT'),
            ('LINEBELOW', (0,0), (-1,0), 1, VERDE_PRIMARY),
            ('BOTTOMPADDING', (0,0), (0,0), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        return t

    starter_items = [
        ("Anthropic API (Claude)", "$1,200"), ("Supabase (DB + Auth)", "$400"),
        ("Railway (Backend 43 agentes)", "$300"), ("Vercel (Frontend)", "$200"),
        ("FacturAPI (CFDI)", "$400"), ("Meta WhatsApp Business", "$500"),
        ("APIs externas (ML/Amazon/Shopify)", "$300")
    ]
    elements.append(create_cost_table("Starter", starter_items, "3,300"))
    elements.append(Spacer(1, 30))

    growth_items = [
        ("Anthropic API", "$2,000"), ("Supabase", "$600"),
        ("Railway", "$450"), ("Vercel", "$200"),
        ("FacturAPI", "$400"), ("Meta WhatsApp", "$500"),
        ("APIs externas", "$600")
    ]
    elements.append(create_cost_table("Growth", growth_items, "4,750"))
    elements.append(Spacer(1, 30))

    pro_items = [
        ("Anthropic API", "$3,200"), ("Supabase", "$800"),
        ("Railway", "$600"), ("Vercel", "$200"),
        ("FacturAPI", "$400"), ("Meta WhatsApp", "$500"),
        ("APIs externas", "$900")
    ]
    elements.append(create_cost_table("Pro", pro_items, "6,600"))
    
    elements.append(PageBreak())

    # ==========================================
    # PÁGINA 2: PLANES KINEXIS
    # ==========================================
    elements.append(Paragraph("PLANES KINEXIS 2026", style_h1))
    elements.append(Spacer(1, 20))

    # Diseño de Cards (Simuladas con Tablas para control de 3 columnas)
    def create_plan_card(title, price, setup_annual, setup_monthly, margin, badge=None, border_width=3):
        card_content = [
            [Paragraph(f"<b>{title}</b>", style_card_title)],
            [Paragraph(f"<b>{price}</b>", style_price)],
            [Paragraph("<b>MXN / mes</b>", style_body)],
            [Spacer(1, 10)],
            [Paragraph(f"Setup Fee:<br/>Anual: <b>{setup_annual}</b><br/>Mensual: <b>{setup_monthly}</b>", style_body)],
            [Spacer(1, 10)],
            [Paragraph(f"<font color='#b8e74a'><b>{margin}</b></font>", style_body)]
        ]
        
        t = Table(card_content, colWidths=[160])
        bgcolor = BG_CARDS
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bgcolor),
            ('BOX', (0,0), (-1,-1), 0.5, colors.white),
            ('LINEABOVE', (0,0), (-1,0), border_width, VERDE_PRIMARY),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 20),
        ]))
        return t

    card_starter = create_plan_card("STARTER", "$6,500", "$4,000", "$7,500", "Margen: ~$3,050/mes (47%)", border_width=3)
    card_growth = create_plan_card("GROWTH ⭐", "$10,500", "$5,500", "$9,000", "Margen: ~$5,750/mes (55%)", border_width=4)
    card_pro = create_plan_card("PRO", "$16,500", "$7,500", "$12,000", "Margen: ~$9,900/mes (60%)", border_width=3)

    plans_table = Table([[card_starter, card_growth, card_pro]], colWidths=[175, 175, 175])
    plans_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(plans_table)
    elements.append(Spacer(1, 40))

    # Tabla de características
    elements.append(Paragraph("INCLUIDO EN CADA PLAN", style_h2))
    elements.append(Spacer(1, 10))
    feature_data = [
        [Paragraph(f"<b>{c}</b>", style_body) for c in ["Característica", "Starter", "Growth", "Pro"]],
        [Paragraph(c, style_body) for c in ["Módulos", "1 a elegir", "2 a elegir", "3 completos"]],
        [Paragraph(c, style_body) for c in ["Conversaciones Samantha", "500/mes", "750/mes", "1,000/mes"]],
        [Paragraph(c, style_body) for c in ["Timbres CFDI", "100/mes", "150/mes", "200/mes"]],
        [Paragraph(c, style_body) for c in ["Usuarios", "3 (hasta 10)*", "5 (hasta 20)*", "Ilimitados"]],
        [Paragraph(c, style_body) for c in ["Storage", "50 GB", "100 GB", "200 GB"]],
        [Paragraph(c, style_body) for c in ["Soporte", "Email 48h", "Chat 24h", "WhatsApp 12h"]],
        [Paragraph(c, style_body) for c in ["Onboarding", "Samantha", "Samantha + 1 sesión", "Sesión intensiva 90 min**"]],
        [Paragraph(c, style_body) for c in ["Reportes", "Mensuales", "Quincenales", "Semanales"]]
    ]
    t_features = Table(feature_data, colWidths=[180, 100, 100, 100])
    t_features.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),
        ('BACKGROUND', (0,0), (-1,0), BG_HOVER),
        ('GRID', (0,0), (-1,-1), 0.5, colors.Color(1,1,1, alpha=0.1)),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_features)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<font size='8'>* Usuarios ilimitados hasta límite indicado (upgrade automático si excede)<br/>** Onboarding Pro: 1 sesión de 90 min con ingeniero. Cliente operativo al finalizar.</font>", style_body))

    elements.append(PageBreak())

    # ==========================================
    # PÁGINA 3: ADD-ONS
    # ==========================================
    elements.append(Paragraph("KINEXIS ADD-ONS", style_h1))
    
    def create_addon_section(title, data, headers):
        elements.append(Paragraph(title, style_h2))
        t = Table([headers] + data, colWidths=[120, 120, 120, 120])
        t.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),
            ('BACKGROUND', (0,0), (-1,0), BG_HOVER),
            ('GRID', (0,0), (-1,-1), 0.5, colors.Color(1,1,1, alpha=0.1)),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ]))
        return t

    # Sección 1
    elements.append(Paragraph("SECCIÓN 1: Conversaciones Samantha Extra", style_h2))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("Contador visible en dashboard. Alerta al 80% del límite. Cliente puede agregar bloques o pagar por uso según necesidad.", style_body))
    elements.append(Spacer(1, 10))
    data1 = [[Paragraph(c, style_body) for c in r] for r in [["Bloque 1", "+500", "$1,500", "$750 (50%)"], ["Bloque 2", "+1,000", "$2,500", "$1,000 (40%)"], ["Bloque 3", "+2,000", "$4,000", "$1,000 (25%)"], ["Pay-per-use", "1 conv.", "$5 MXN", "$2 MXN (40%)"]]]
    elements.append(Table([[Paragraph(f"<b>{c}</b>", style_body) for c in ["Bloque", "Conversaciones", "Precio/mes", "Margen"]]] + data1, colWidths=[120, 120, 120, 120], style=TableStyle([('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),('BACKGROUND', (0,0), (-1,0), BG_HOVER),('GRID', (0,0), (-1,-1), 0.5, colors.Color(1,1,1, alpha=0.1)), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])))

    # Sección 2
    elements.append(Spacer(1, 25))
    elements.append(Paragraph("SECCIÓN 2: Timbres CFDI Extra", style_h2))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("Facturación electrónica ilimitada con negociación de volumen. Costo FacturAPI: $1.50/timbre. Negociable con 10+ clientes.", style_body))
    elements.append(Spacer(1, 10))
    data2 = [[Paragraph(c, style_body) for c in r] for r in [["101-500 timbres", "$1,500 paquete", "$750 (50%)"], ["501-1,000 timbres", "$2,500 paquete", "$1,000 (40%)"], ["1,000+", "$3 MXN/timbre", "$1.50 (50%)"]]]
    elements.append(Table([[Paragraph(f"<b>{c}</b>", style_body) for c in ["Rango", "Precio", "Margen"]]] + data2, colWidths=[160, 160, 160], style=TableStyle([('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),('BACKGROUND', (0,0), (-1,0), BG_HOVER),('GRID', (0,0), (-1,-1), 0.5, colors.Color(1,1,1, alpha=0.1)), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])))

    # Sección 3
    elements.append(Spacer(1, 25))
    elements.append(Paragraph("SECCIÓN 3: Usuarios Extra", style_h2))
    elements.append(Spacer(1, 5))
    data3 = [[Paragraph(c, style_body) for c in r] for r in [["+1 usuario", "$500/mes", "$450 (90%)"], ["+5 usuarios (paquete)", "$2,000/mes", "$1,750 (87%)"]]]
    elements.append(Table([[Paragraph(f"<b>{c}</b>", style_body) for c in ["Concepto", "Precio", "Margen"]]] + data3, colWidths=[160, 160, 160], style=TableStyle([('TEXTCOLOR', (0,0), (-1,-1), TEXTO_PRIMARY),('BACKGROUND', (0,0), (-1,0), BG_HOVER),('GRID', (0,0), (-1,-1), 0.5, colors.Color(1,1,1, alpha=0.1)), ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold')])))
    
    elements.append(PageBreak())

    # ==========================================
    # PÁGINA 4: GUÍAS DE ENVÍO
    # ==========================================
    elements.append(Paragraph("GUÍAS DE ENVÍO Y LOGÍSTICA", style_h1))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<b>Modelo Sin Riesgo de Capital (Stripe Integrated)</b>", style_h2))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph("""
    Cliente paga guía directamente vía Stripe integrado en KINEXIS. KINEXIS calcula: Costo Skydropx + 15% comisión.<br/><br/>
    <b>Ejemplo de Operación:</b><br/>
    • Guía nacional $80 MXN → Cliente paga $92 MXN → <b>KINEXIS retiene $12 MXN</b><br/>
    • Guía express $150 MXN → Cliente paga $175 MXN → <b>KINEXIS retiene $25 MXN</b><br/><br/>
    <b>Ventajas Competitivas:</b><br/>
    • 0 capital de KINEXIS invertido.<br/>
    • 100% profit en la comisión.<br/>
    • El cliente tiene la comodidad de pagar todo en una sola plataforma unificada.<br/>
    • <b>Revenue proyectado:</b> $600 - $1,000 MXN mensuales por cliente e-commerce activo.<br/><br/>
    <i>Alternativa: El cliente siempre tiene la opción de conectar su propia cuenta de Skydropx/Carrier (en este caso no genera revenue adicional).</i>
    """, style_body))

    elements.append(PageBreak())

    # ==========================================
    # PÁGINA 5: NOTAS Y FILOSOFÍA
    # ==========================================
    elements.append(Paragraph("NOTAS TÉCNICAS Y FILOSOFÍA", style_h1))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("<b>2. Setup Fee & Onboarding Diferenciado</b>", style_h2))
    elements.append(Paragraph("""
    <b>Pago Anual:</b><br/>
    - Setup reducido (40-50% descuento).<br/>
    - Incentiva compromiso a largo plazo y mejora la retención.<br/>
    - Mejor cashflow inicial para Atollom.<br/><br/>
    <b>Pago Mensual:</b><br/>
    - Setup estándar (cubre el costo real de configuración).<br/>
    - Máxima flexibilidad para el cliente.<br/>
    - Sin penalizaciones por cancelación anticipada.<br/><br/>
    <b>Plan Pro:</b><br/>
    - Incluye sesión intensiva de 90 min con un ingeniero senior de Atollom.<br/>
    - Migración completa de datos históricos.<br/>
    - Capacitación personalizada al equipo del cliente.<br/>
    - Garantía: El cliente queda 100% operativo al finalizar la sesión.
    """, style_body))

    elements.append(Spacer(1, 30))
    elements.append(Paragraph("<b>7. Modelo de Usuarios Generoso</b>", style_h2))
    elements.append(Paragraph("""
    - <b>Filosofía:</b> El cliente no debe sentirse "estafado" por cada asiento adicional en etapas tempranas.<br/>
    - <b>Experiencia:</b> Buscamos una integración integral sin fricciones artificiales.<br/>
    - <b>Upgrade:</b> La transición a planes superiores ocurre de forma natural cuando la empresa crece orgánicamente.<br/>
    - <b>Competitividad:</b> Mientras la competencia cobra entre $200 y $500 MXN por asiento desde el usuario 1, Kinexis permite el despliegue inicial completo.
    """, style_body))

    # Footer en última página
    elements.append(Spacer(1, 100))
    elements.append(Paragraph("<font color='#b8e74a' size='14'><b>ATOLLOM KINEXIS — 2026 v2.0</b></font>", ParagraphStyle('Footer', alignment=TA_CENTER)))
    elements.append(Paragraph("<font color='#ffffff' size='8'>Propiedad Intelectual de Atollom Labs. Confidencial.</font>", ParagraphStyle('FooterSub', alignment=TA_CENTER)))

    doc.build(elements, onFirstPage=doc.draw_background, onLaterPages=doc.draw_background)
    print(f"PDF generado exitosamente en: {output_path}")

if __name__ == "__main__":
    create_pricing_pdf()
