# KINEXIS - Memoria Compartida de Desarrollo

**Propósito**: Contexto compartido para Claude y Gemini  
**Uso**: Leer al inicio de cada sesión de desarrollo  
**Última actualización**: 2026-04-20

---

## 1. Información del Proyecto

**Nombre**: KINEXIS  
**Tipo**: Plataforma SaaS multi-tenant  
**Industria**: E-commerce + CRM + ERP unificado  
**Cliente piloto**: Orthocardio (productos médicos)  
**Timeline**: 21 días para MVP funcional (entrega: 11 mayo 2026)

**Stakeholders**:
- **Owner**: Carlos Cortés (Atollom Labs)
- **Cliente**: Kap Tools (compromiso 2-3 semanas)
- **Inversionista**: Potencial (presentación cuando esté funcional)

---

## 2. Arquitectura Técnica

**Stack**:
- Backend: Node.js 20 + Python 3.11 (Railway)
- Frontend: Next.js 14 App Router (Vercel)
- Base de Datos: PostgreSQL 15 (Supabase)
- Cache: Redis 7 (Railway)
- Auth: Supabase Auth + RLS

**Integraciones**:
- E-commerce: ML API, Amazon MWS, Shopify GraphQL
- Mensajería: WhatsApp Business, Instagram Graph, Facebook Graph
- Fiscal: FacturAPI (CFDI 4.0)
- Logística: Skydropx
- Pagos: Stripe

**IA**:
- Principal: Anthropic Claude Sonnet 4 (Samantha + agentes)
- Validación: Google Gemini 2.5 Flash Lite
- Vectores: OpenAI Embeddings

---

## 3. Principios de Diseño

### Samantha = Cerebro Ejecutor

- NO es solo interfaz conversacional
- SÍ es el orquestador que EJECUTA acciones reales
- Componentes:
  1. NLP Engine (comprensión)
  2. Context Manager (memoria Redis)
  3. Agent Orchestrator (decide qué agentes llamar)
  4. Permission Validator (RBAC + RLS)
  5. Response Generator (formato conversacional)

### 43 Agentes = Herramientas Especializadas

- Cada agente: UNA tarea específica
- Previene alucinaciones (23% → 3% error)
- Categorías:
  - E-commerce: 7 agentes
  - ERP: 7 agentes
  - CRM: 6 agentes
  - Meta: 5 agentes
  - Transversal: 2 agentes (Guardian #0, Validation #26)

### Multi-Tenant con RLS

- Tabla compartida + `tenant_id` FK
- Row Level Security (RLS) policies
- 5 roles RBAC: owner, admin, agente, almacenista, contador

---

## 4. Estructura del Proyecto

```
Atollom-KINEXIS/
├── backend/                    # Railway (API + agentes)
│   ├── src/
│   │   ├── agents/            # 43 agentes especializados
│   │   ├── routers/           # Guardian, Ecommerce, CRM, ERP, Meta
│   │   ├── integrations/      # ML, Amazon, Shopify, etc.
│   │   └── utils/
│   └── tests/
│
├── src/dashboard/             # Vercel (Frontend)
│   ├── app/
│   │   ├── (auth)/           # Login/Signup (sin layout)
│   │   └── (shell)/          # App (con sidebar)
│   │       ├── layout.tsx    # Shell persistente
│   │       ├── dashboard/
│   │       ├── ecommerce/
│   │       │   ├── page.tsx
│   │       │   ├── ml/
│   │       │   │   ├── products/
│   │       │   │   ├── orders/
│   │       │   │   ├── fulfillment/
│   │       │   │   ├── questions/
│   │       │   │   └── analytics/
│   │       │   ├── amazon/
│   │       │   │   ├── products/
│   │       │   │   ├── fba/
│   │       │   │   ├── inventory/
│   │       │   │   └── analytics/
│   │       │   ├── shopify/
│   │       │   │   ├── products/
│   │       │   │   ├── orders/
│   │       │   │   ├── fulfillment/
│   │       │   │   └── analytics/
│   │       │   └── management/
│   │       │       ├── pricing/
│   │       │       ├── inventory/
│   │       │       ├── returns/
│   │       │       └── shipping/
│   │       ├── crm/
│   │       │   ├── page.tsx
│   │       │   ├── inbox/
│   │       │   │   ├── whatsapp/
│   │       │   │   ├── instagram/
│   │       │   │   ├── facebook/
│   │       │   │   └── unified/
│   │       │   ├── pipeline/
│   │       │   │   ├── page.tsx (kanban)
│   │       │   │   ├── leads/
│   │       │   │   ├── scorer/
│   │       │   │   └── b2b/
│   │       │   ├── sales/
│   │       │   │   ├── quotes/
│   │       │   │   ├── opportunities/
│   │       │   │   ├── follow-ups/
│   │       │   │   └── deals/
│   │       │   └── support/
│   │       │       ├── tickets/
│   │       │       ├── nps/
│   │       │       └── kb/
│   │       └── erp/
│   │           ├── page.tsx
│   │           ├── cfdi/
│   │           │   ├── page.tsx
│   │           │   ├── invoices/
│   │           │   ├── billing/
│   │           │   ├── compliance/
│   │           │   └── print/
│   │           ├── accounting/
│   │           │   ├── page.tsx
│   │           │   ├── chart/
│   │           │   ├── journal/
│   │           │   └── reports/
│   │           ├── finance/
│   │           │   ├── page.tsx
│   │           │   ├── receivables/
│   │           │   ├── payables/
│   │           │   ├── banking/
│   │           │   └── cashflow/
│   │           ├── inventory/
│   │           │   ├── page.tsx
│   │           │   ├── products/
│   │           │   ├── warehouses/
│   │           │   ├── movements/
│   │           │   └── valuation/
│   │           ├── purchases/
│   │           │   ├── orders/
│   │           │   ├── suppliers/
│   │           │   └── receiving/
│   │           └── logistics/
│   │               ├── shipping/
│   │               ├── tracking/
│   │               └── carriers/
│   ├── components/
│   │   ├── shell/            # Sidebar, Header, Footer
│   │   ├── samantha/         # Panel Samantha
│   │   ├── ui/               # Componentes base (shadcn)
│   │   └── modules/          # Por módulo (E-commerce, CRM, ERP)
│   └── public/
│       └── branding/         # Logos
│
├── docs/
│   ├── ARCHITECTURE.md       # Arquitectura completa (1,073 líneas)
│   ├── SECURITY.md           # Seguridad nivel bancario (599 líneas)
│   ├── DECISIONS.md          # Log decisiones técnicas (497 líneas)
│   └── reference/
│       ├── biblia/           # Prompts maestros agentes
│       └── documentacion/    # Specs originales
│
├── migrations/               # Migraciones Supabase
├── scripts/                  # Utilidades
└── claude.md                 # Este archivo
```

**Total rutas a crear**: 45+ páginas

---

## 5. Convenciones de Código

**Naming**:
- Componentes: `PascalCase` (`PageHeader`, `SidebarNav`)
- Funciones: `camelCase` (`generateCFDI`, `validatePermissions`)
- Archivos: `kebab-case` (`page-header.tsx`, `sidebar-nav.tsx`)
- Variables: `camelCase` (`tenantId`, `userId`)
- Constantes: `SCREAMING_SNAKE_CASE` (`MAX_RETRIES`, `API_BASE_URL`)

**TypeScript**:
```typescript
// ✅ BIEN: Tipos explícitos
interface Order {
  id: string
  tenantId: string
  total: number
  createdAt: Date
}

// ❌ MAL: any
const data: any = await fetchOrders()
```

**React Components**:
```typescript
// ✅ BIEN: Server Component por default
export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductsList products={products} />
}

// ✅ BIEN: Client Component cuando necesario
'use client'
export function InteractiveChart({ data }: ChartProps) {
  const [selected, setSelected] = useState(null)
  // ...
}
```

**Tailwind**:
```typescript
// ✅ BIEN: Clases utility
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">

// ❌ MAL: Inline styles
<div style={{ display: 'flex', padding: '24px' }}>
```

---

## 6. Design System

**Paleta de colores (Glassmorphism)**:
```css
:root {
  /* Verdes principales */
  --green-50: #f0fdf4;
  --green-100: #dcfce7;
  --green-600: #16a34a;
  --green-700: #15803d;
  --green-900: #14532d;

  /* Grises */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-600: #4b5563;
  --gray-900: #111827;
}
```

**Componentes glass**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.gradient-bg {
  background: linear-gradient(135deg, var(--green-600), var(--green-900));
}
```

**Typography**:
- Títulos: `font-bold text-2xl text-gray-900`
- Subtítulos: `font-semibold text-lg text-gray-700`
- Body: `font-normal text-base text-gray-600`
- Labels: `font-medium text-sm text-gray-500`

---

## 7. Prompts Efectivos

**Para Crear Páginas**:
```
Crea la página {ruta} con estas características:
- Componente: Server Component (async)
- Layout: PageHeader + contenido + PageSkeleton (Suspense)
- Badge: "Agente #X" si aplica
- Placeholder elegante (no mock completo todavía)
- Metadata: title + description

No uses mocks complejos, solo estructura y diseño profesional.
```

**Para Componentes**:
```
Crea el componente {nombre} que:
- Props: {listar props con tipos}
- Estado: {si necesita useState}
- Styling: Tailwind + glassmorphism
- Responsive: Mobile-first
- Accesibilidad: aria-labels donde necesario
```

**Para Agentes Backend**:
```
Crea el agente #{numero} - {nombre} que:
- Input: {tipo de datos}
- Proceso: {qué debe hacer}
- Output: {qué retorna}
- Validación: {qué debe verificar}
- Error handling: {qué hacer si falla}

Incluir tests unitarios.
```

---

## 8. Checklist por Tarea

**Al crear una página**:
- [ ] Archivo `page.tsx` en ruta correcta
- [ ] Metadata (`title` + `description`)
- [ ] `PageHeader` component
- [ ] `Suspense` + `PageSkeleton`
- [ ] Badge "Agente #X" si aplica
- [ ] Responsive (mobile-first)
- [ ] TypeScript sin `any`
- [ ] Comentarios solo si lógica compleja

**Al crear un componente**:
- [ ] Props tipadas (`interface`)
- [ ] `'use client'` solo si necesario
- [ ] Tailwind (no inline styles)
- [ ] Accesibilidad (aria-labels)
- [ ] Mobile-responsive
- [ ] Error boundaries si aplica

**Al crear un agente**:
- [ ] Input validation
- [ ] Error handling
- [ ] Logging (actions para audit)
- [ ] Tests unitarios
- [ ] Documentación (JSDoc)

---

## 9. Estado Actual

**Completado (Día 1)**:
- ✅ Limpieza repositorio
- ✅ docs/ARCHITECTURE.md (1,073 líneas)
- ✅ docs/SECURITY.md (599 líneas)
- ✅ docs/DECISIONS.md (497 líneas)

**En Progreso (Día 2)**:
- ⏳ Crear 45+ rutas (páginas)
- ⏳ Sidebar completo
- ⏳ Breadcrumbs
- ⏳ PageHeader component
- ⏳ PageSkeleton component

**Pendiente (Día 3-21)**:
- ⏳ 43 agentes funcionales
- ⏳ Samantha conectado a BD real
- ⏳ APIs integradas (ML, Amazon, Shopify)
- ⏳ WhatsApp webhook
- ⏳ FacturAPI timbrado
- ⏳ Landing page

---

## 10. URLs Importantes

**Producción**:
- Dashboard: https://dashboard.atollom.com
- Backend: https://atollom-kinexis-production.up.railway.app

**Documentación Externa**:
- Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT
- Railway: https://railway.app/project/YOUR_PROJECT
- Vercel: https://vercel.com/atollom/dashboard

**Integraciones**:
- ML Developers: https://developers.mercadolibre.com.mx
- Amazon MWS: https://developer.amazonservices.com
- Shopify API: https://shopify.dev/docs/api/admin
- WhatsApp Business: https://developers.facebook.com/docs/whatsapp
- FacturAPI: https://www.facturapi.io/docs

---

## 11. Recordatorios Importantes

**Seguridad**:
- ⚠️ NUNCA exponer secrets en código
- ⚠️ SIEMPRE validar `tenant_id` en queries
- ⚠️ SIEMPRE usar RLS policies
- ⚠️ NUNCA confiar en input del cliente

**Performance**:
- ✅ Server Components por default
- ✅ Client Components solo cuando interactividad
- ✅ Lazy loading para módulos pesados
- ✅ Cache Redis para queries frecuentes

**Estilo**:
- ✅ Glassmorphism (blur + transparencia)
- ✅ Verde como color primario
- ✅ Mobile-first responsive
- ✅ Accesibilidad (WCAG 2.1 AA)

---

## 12. Comandos Útiles

**Development**:
```bash
# Frontend
cd src/dashboard
npm run dev              # http://localhost:3000

# Backend
cd backend
npm run dev              # http://localhost:5000
```

**Testing**:
```bash
npm run test             # Unit tests
npm run test:e2e         # E2E tests
npm run lint             # ESLint
npm run type-check       # TypeScript
```

**Deploy**:
```bash
git add .
git commit -m "feat: descripción"
git push origin main     # Auto-deploy Vercel + Railway
```

---

## 13. Glosario

| Término | Definición |
|---------|-----------|
| Tenant | Cliente de KINEXIS (ej: Orthocardio) |
| Samantha | Cerebro orquestador central |
| Agente | Herramienta especializada (ej: Agente #13 = CFDI) |
| Router | Orquestador de agentes por módulo |
| Guardian | Agente #0 (router principal) |
| RLS | Row Level Security (aislamiento BD) |
| RBAC | Role-Based Access Control (5 roles) |
| CFDI | Comprobante Fiscal Digital por Internet (SAT México) |

---

*Última actualización: 2026-04-20*  
*Para actualizar este archivo: Editar y commit manualmente*

---

**Mantenedores**:  
Carlos Cortés — contacto@atollom.com  
Atollom Labs S. de R.L. de C.V.  

*Copyright © 2026 Atollom Labs. Todos los derechos reservados.*
