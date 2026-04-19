# KINEXIS - Log de Decisiones Técnicas

**Propósito**: Registro cronológico de decisiones arquitectónicas y técnicas  
**Autor**: Carlos Cortés (Atollom Labs)  
**Uso**: Evidencia de propiedad intelectual + referencia histórica

---

## Formato de Registro

Cada decisión incluye:
- **Fecha**: Cuándo se tomó la decisión
- **Decisor**: Quién tomó la decisión (siempre Carlos Cortés hasta ahora)
- **Contexto**: Por qué se necesitaba decidir
- **Opciones**: Alternativas evaluadas
- **Decisión**: Qué se eligió y por qué
- **Consecuencias**: Impacto esperado

---

## 2026-04-08: Inicio del Proyecto KINEXIS

**Decisor**: Carlos Cortés  
**Contexto**: Orthocardio necesita sistema unificado que reemplace herramientas dispersas (ML manual, WhatsApp sin CRM, Excel para inventario).

**Decisión**: Crear plataforma SaaS multi-tenant llamada KINEXIS que unifique E-commerce + CRM + ERP.

**Razón**:
- Mercado objetivo: PyMEs mexicanas con mismo problema
- SaaS multi-tenant: 1 infraestructura sirve N clientes (escalable)
- Nombre "KINEXIS": Fusión de "kinetic" (movimiento) + "nexus" (conexión)

**Consecuencias**:
- ✅ Orthocardio será cliente piloto
- ✅ Modelo de negocio SaaS recurrente
- ✅ Posible expansión a otros países (Colombia, Chile)

---

## 2026-04-08: Stack Tecnológico Base

**Decisor**: Carlos Cortés  
**Contexto**: Definir tecnologías antes de escribir primera línea de código.

**Opciones evaluadas**:

| Componente | Opción A | Opción B | Opción C | Elegida |
|------------|----------|----------|----------|---------|
| Backend | Node.js | Python Django | Ruby on Rails | Node.js |
| Frontend | React SPA | Next.js | Vue.js | Next.js |
| Base de Datos | MongoDB | PostgreSQL | MySQL | PostgreSQL |
| Auth | Custom JWT | Supabase Auth | Auth0 | Supabase Auth |
| Deploy Backend | AWS EC2 | Railway | Heroku | Railway |
| Deploy Frontend | Netlify | Vercel | AWS Amplify | Vercel |

**Decisión**:
- **Backend**: Node.js 20 + Express.js
- **Frontend**: Next.js 14 App Router
- **Base de Datos**: PostgreSQL 15 (Supabase)
- **Auth**: Supabase Auth
- **Deploy**: Railway (backend) + Vercel (frontend)

**Razones**:
1. **Node.js**: Equipo domina JavaScript, ecosystem maduro
2. **Next.js**: SEO para landing, Server Components (-40% JS), API Routes integradas
3. **PostgreSQL**: ACID compliance (crítico para finanzas), RLS nativo (multi-tenant)
4. **Supabase**: Auth + BD + Storage todo-en-uno, menos código custom
5. **Railway**: Simplicidad vs AWS (git push → deploy), pricing predecible
6. **Vercel**: Edge functions, CI/CD automático, Next.js creators

**Consecuencias**:
- ✅ Desarrollo rápido (menos boilerplate)
- ✅ Deploy automatizado
- ⚠️ Vendor lock-in moderado (mitigar con abstraction layers)

---

## 2026-04-10: Modelo de Datos Multi-Tenant

**Decisor**: Carlos Cortés  
**Contexto**: ¿Cómo aislar datos de clientes en 1 BD compartida?

**Opciones**:
1. **BD separada por cliente**: 1 PostgreSQL por tenant (máximo aislamiento)
2. **Schema separado**: 1 schema por tenant (isolation medio)
3. **Tabla compartida + tenant_id**: RLS policies (isolation mínimo pero eficiente)

**Decisión**: Opción 3 (tenant_id + RLS)

**Razones**:
- ✅ Costo: 1 BD vs N BDs (ahorro significativo)
- ✅ Mantenimiento: 1 migration vs N migrations
- ✅ RLS nativo en PostgreSQL (seguridad a nivel BD)
- ✅ Supabase optimizado para multi-tenant
- ⚠️ Requiere disciplina: NUNCA olvidar WHERE tenant_id=X

**Schema base**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Tenant isolation"
ON orders FOR ALL
USING (tenant_id = current_setting('app.tenant_id')::text);
```

**Consecuencias**:
- ✅ Escalable hasta 100+ clientes sin cambios
- ✅ Backups únicos (simplicidad)
- ⚠️ Requiere tests exhaustivos de RLS

---

## 2026-04-13: Arquitectura de Agentes Especializados

**Decisor**: Carlos Cortés  
**Contexto**: LLMs generalistas tienden a "alucinar" en tareas complejas multi-dominio.

**Problema observado**:
```
Test: "Genera factura de pedido #123"
LLM Monolítico:
- 30% falla (inventa datos)
- 15% confunde ML con Amazon
- 5% genera CFDI inválido
Total error: 50%
```

**Opciones**:
1. 1 agente monolítico: Prompt gigante con todas las instrucciones
2. 3 agentes macro: E-commerce, CRM, ERP
3. 43 agentes micro: 1 agente = 1 tarea específica

**Decisión**: Opción 3 (43 agentes especializados)

**Validación experimental**:
```
Test: "Genera factura de pedido #123 y envía por WhatsApp"

1 agente monolítico:
- 30 tests
- 23% tasa de error
- Problemas: Confunde canales, inventa UUIDs, olvida pasos

43 agentes especializados:
- 30 tests
- 3% tasa de error
- Agentes llamados: #13 (CFDI) → #26 (Validation) → WA Agent
- Errores: Solo cuando datos de entrada inválidos
```

**Agentes definidos**:
- **E-commerce**: 7 agentes (#1-ML, #2-Amazon, #3-Shopify, #6-Pricing, #14-Returns, #27-ML Q&A)
- **ERP**: 7 agentes (#5-Inventory, #13-CFDI, #16-Suppliers, #18-Finance, #24-Printer, #25-Shipping, #30-PO)
- **CRM**: 6 agentes (#4-B2B, #19-NPS, #31-Scorer, #32-Quotes, #33-Follow-up, #37-Support)
- **Meta**: 5 agentes (WA, IG, FB, #12-Ads, Content)
- **Transversal**: 2 agentes (#0-Guardian, #26-Validation)
- **Total**: 27 principales + 16 especializados = 43 agentes

**Razones**:
- ✅ 23% → 3% error (mejora 7.6x)
- ✅ Fácil debuggear: Aislar agente problemático
- ✅ Escalable: Agregar agente sin romper existentes
- ✅ Especialización previene alucinaciones

**Consecuencias**:
- ✅ Sistema más confiable
- ⚠️ Mayor complejidad de orquestación (solucionado con Samantha)

---

## 2026-04-15: Samantha como Cerebro Orquestador

**Decisor**: Carlos Cortés  
**Contexto**: 43 agentes especializados necesitan coordinación inteligente.

**Problema**: ¿Quién decide qué agentes llamar y en qué orden?

**Opciones**:
1. Hardcoded workflows: If/else gigantes en código
2. Router simple: Regex + routing table
3. Samantha (LLM orquestador): Cerebro central que decide dinámicamente

**Decisión**: Opción 3 (Samantha)

**Definición de Samantha**:
- NO es solo interfaz conversacional
- SÍ es el cerebro ejecutor central
- Responsabilidades:
  - Comprende intención (NLP con Claude Sonnet 4)
  - Decide qué agentes llamar
  - Orquesta workflows multi-agente
  - Valida permisos (RBAC + RLS)
  - Mantiene contexto conversacional (Redis)
  - Aprende preferencias del usuario
  - Sugiere acciones proactivas

**Componentes de Samantha**:
1. NLP Engine (Claude Sonnet 4)
2. Context Manager (Redis)
3. Agent Orchestrator
4. Permission Validator
5. Response Generator

**Ejemplo workflow**:
```
Usuario: "Procesa pedido #456"

Samantha decide:
1. Llamar #5 (Inventory)  → verificar stock
2. Llamar #25 (Shipping)  → generar guía
3. Llamar #13 (CFDI)      → generar factura
4. Llamar #3 (Shopify)    → marcar despachado
5. Llamar WA Agent        → notificar cliente

Todo en paralelo (threads) donde sea posible.
```

**Razones**:
- ✅ Flexibilidad: Se adapta a casos no previstos
- ✅ UX superior: Lenguaje natural vs comandos
- ✅ Contexto: Recuerda conversaciones previas
- ✅ Aprendizaje: Mejora con cada interacción

**Consecuencias**:
- ✅ Sistema "inteligente" de verdad
- ✅ Diferenciador clave vs competencia
- ⚠️ Dependencia de API Claude (mitigar con fallback a Gemini)

---

## 2026-04-16: RBAC con 5 Roles

**Decisor**: Carlos Cortés  
**Contexto**: Diferentes usuarios necesitan diferentes permisos.

**Roles definidos**:

| Rol | Caso de Uso | Permisos |
|-----|-------------|----------|
| owner | Dueño empresa | Todo (incluye billing, usuarios, config) |
| admin | Gerente general | Todo excepto billing |
| agente | Vendedor | CRM completo, E-commerce readonly, ERP denegado |
| almacenista | Encargado bodega | E-commerce completo, ERP Inventario, CRM readonly |
| contador | Contador externo | ERP completo, E-commerce readonly, CRM readonly |

**Decisión**: 5 roles (no más, no menos)

**Razones**:
- ✅ Cubre 95% de casos PyME
- ✅ Simple de entender (vs 20 roles complejos)
- ✅ Fácil onboarding nuevos usuarios

**Implementación**:
```sql
CREATE TYPE user_role AS ENUM (
  'owner',
  'admin',
  'agente',
  'almacenista',
  'contador'
);

-- RLS policy ejemplo
CREATE POLICY "Only owner/admin can manage users"
ON user_profiles FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM user_profiles
    WHERE tenant_id = current_setting('app.tenant_id')::text
    AND role IN ('owner', 'admin')
  )
);
```

**Consecuencias**:
- ✅ Seguridad granular
- ✅ Compliance (separación de responsabilidades)

---

## 2026-04-17: Integración CFDI 4.0 con FacturAPI

**Decisor**: Carlos Cortés  
**Contexto**: Facturación electrónica obligatoria en México (SAT).

**Opciones**:
1. FacturAPI ($0.80 MXN/timbre + API REST)
2. Facturama ($1.00 MXN/timbre + API SOAP)
3. Custom SAT Integration (gratis pero complejísimo)

**Decisión**: FacturAPI

**Razones**:
- ✅ API REST moderna (vs SOAP)
- ✅ Documentación excelente
- ✅ Sandbox gratis para testing
- ✅ Precio competitivo ($0.80 vs $1.00)
- ✅ Soporte técnico rápido

**Implementación**:
```javascript
// Agente #13: CFDI Billing
async function generateCFDI(orderData) {
  const invoice = await facturapi.invoices.create({
    customer: orderData.customer,
    items: orderData.items,
    payment_form: '03', // Transferencia
    use: 'G03' // Gastos en general
  })

  return {
    uuid: invoice.uuid,
    pdf_url: invoice.pdf_url,
    xml_url: invoice.xml_url
  }
}
```

**Consecuencias**:
- ✅ Compliance SAT 100%
- ✅ Clientes pueden deducir impuestos
- 💰 Costo: $0.80/factura (pasar a cliente en pricing)

---

## 2026-04-18: Deploy Multi-Dominio

**Decisor**: Carlos Cortés  
**Contexto**: Necesitamos múltiples dominios para branding.

**Dominios configurados**:
- `dashboard.atollom.com` — Dashboard principal
- `dashboard.atollom.com.mx` — Variante México
- `kinexis.atollom.com` — Landing page producto
- `app.kinexis.mx` — App alternativa (futuro)

**Decisión**: Vercel maneja todos con SSL automático

**Configuración DNS**:
```
dashboard.atollom.com     → CNAME → cname.vercel-dns.com
dashboard.atollom.com.mx  → CNAME → cname.vercel-dns.com
kinexis.atollom.com       → CNAME → cname.vercel-dns.com
```

**Razones**:
- ✅ SSL gratis (Let's Encrypt vía Vercel)
- ✅ Auto-renovación certificados
- ✅ CDN global incluido
- ✅ Deploy único sirve todos los dominios

**Consecuencias**:
- ✅ Profesionalismo (no subdominios raros)
- ✅ SEO mejorado (múltiples entry points)

---

## 2026-04-19: Estructura de Carpetas App Router

**Decisor**: Carlos Cortés  
**Contexto**: Next.js 14 App Router requiere estructura específica.

**Decisión**: Route groups con `(shell)` para layout persistente

**Estructura**:
```
app/
├── (auth)/              # Sin layout (login/signup)
│   ├── login/
│   └── signup/
└── (shell)/             # Con layout (sidebar + header)
    ├── layout.tsx       # Shell persistente
    ├── dashboard/
    ├── ecommerce/
    ├── crm/
    └── erp/
```

**Razones**:
- ✅ Sidebar persiste entre navegaciones
- ✅ No re-render innecesario
- ✅ Separación clara auth vs app

**Consecuencias**:
- ✅ UX fluida (no parpadeos)
- ✅ Performance mejorada

---

## 2026-04-20: Glassmorphism como Design System

**Decisor**: Carlos Cortés  
**Contexto**: Necesitamos identidad visual profesional y moderna.

**Decisión**: Glassmorphism + Gradientes verdes

**Paleta de colores**:
```css
:root {
  --green-50: #f0fdf4;
  --green-100: #dcfce7;
  --green-600: #16a34a;
  --green-700: #15803d;
  --green-900: #14532d;
}
```

**Componentes clave**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.gradient-bg {
  background: linear-gradient(
    135deg,
    var(--green-600),
    var(--green-900)
  );
}
```

**Razones**:
- ✅ Moderno (trending design 2024-2026)
- ✅ Profesional (vs Material Design genérico)
- ✅ Verde = crecimiento, dinero (apropiado para ERP/E-commerce)

**Consecuencias**:
- ✅ Diferenciación visual
- ✅ Branding coherente

---

## 2026-04-20: Pricing Modular (Suite)

**Decisor**: Carlos Cortés  
**Contexto**: Clientes no necesitan los 3 módulos siempre.

**Decisión**: Modelo Suite (cliente elige 1, 2 o 3 módulos)

**Planes**:

| Plan | Módulos | Precio/mes | Margen |
|------|---------|-----------|--------|
| Starter | 1 módulo | $6,500 | $3,050 (47%) |
| Growth | 2 módulos | $10,500 | $5,750 (55%) |
| Pro | 3 módulos | $16,500 | $9,900 (60%) |

**Costos infraestructura**:
- Starter: $3,300/mes
- Growth: $4,750/mes
- Pro: $6,600/mes

**Razones**:
- ✅ Flexibilidad (cliente paga solo lo que usa)
- ✅ Upsell fácil (activar módulo adicional)
- ✅ Competitivo vs mercado ($16,500 vs $25,000+)

**Consecuencias**:
- ✅ Barrera entrada baja ($6,500)
- ✅ LTV alto (upsell a Pro)

---

## Próximas Decisiones Pendientes

**Q2 2026**
- ⬜ ¿Lanzar API pública o mantener privada?
- ⬜ ¿Mobile app nativa o PWA?
- ⬜ ¿Expandir a Colombia/Chile o consolidar México?

**Q3 2026**
- ⬜ ¿Marketplace de integraciones o mantener cerrado?
- ⬜ ¿White-label o solo branded?
- ⬜ ¿On-premise option para enterprise?

---

*Última actualización: 20 abril 2026*  
*Total decisiones registradas: 12*

---

**Firmado digitalmente**:  
Autor:   Carlos Cortés  
Email:   contacto@atollom.com  
Empresa: Atollom Labs S. de R.L. de C.V.  

*Copyright © 2026 Atollom Labs. Todos los derechos reservados.*
