agentes_implementados: 43/43
agent_contracts_done: 43/43
migraciones: 032/N
tests_totales: 728 passing ✅  (710 previos + 18 nuevos SECURITY_FIX)

ESTADO: PRODUCTION_READY
claude_approved_date: 2026-04-13
hardening_sessions: BLOQUE1 + BLOQUE2 + BLOQUE3 + BLOQUE4 + BLOQUE5 + BLOQUE6 (completo)

SECURITY_FIX — 2026-04-13:
  [HMAC] instagram_dm_handler_agent.py — payload_bytes sin signature ahora RECHAZADO (antes bypasseaba)
  [HMAC] Eliminado "status: error" interno del return para consistencia con BaseAgent wrapper
  [API]  main.py — Bearer auth con hmac.compare_digest() (constant-time, anti timing-attack)
  [API]  main.py — supabase_client inyectado desde env, nunca del request
  [API]  main.py — errores internos NO expuestos al caller (stack trace queda en logger)
  [API]  main.py — 404 no enumera agentes disponibles (anti information-disclosure)
  [API]  main.py — 503 cuando AGENT_SECRET no está configurado (fail-closed)
  [TESTS] test_instagram_hmac.py — 7 tests HMAC (inválido, faltante, bytes vacíos, interno, válido)
  [TESTS] test_main.py — 11 tests API (401, 503, 404, 400, happy path, error leak, health, registry)

BLOCKER DOCUMENTADO:
  amazon_reviews_api: 'Amazon SP-API get_reviews() pendiente de implementar — stub activo en amazon_adapter'

DECISION LOG:
  [HUMAN DECISION: arquitectura 43 agentes aprobada por Carlos Hernán Cortés Ayala y Alexis Hiram Valencia Duarte — evidencia INDAUTOR de autoría humana]

DASHBOARD H1 HARDENING — 2026-04-13:
  [AUTH]   layout.tsx → async server component, fetches real user from user_profiles, conditional DashboardShell (login page excluded)
  [RBAC]   middleware.ts → matcher fixed (was /dashboard/:path*, now covers /, /ecommerce/*, /erp/*, /crm/*, /meta/*, /warehouse/*)
  [RBAC]   middleware.ts → added socia/almacenista/agente roles to all RBAC guards
  [RBAC]   middleware.ts → /api/crm/* and /api/meta/* now require agente role minimum
  [RBAC]   middleware.ts → redirects authenticated users away from /login
  [DATA]   page.tsx → ALL mock data removed: useKPIs, useInventory, useLeads, usePurchaseOrders wired up
  [DATA]   page.tsx → Ecommerce section uses real orders aggregated by platform via /api/ecommerce/orders?date=today
  [DATA]   page.tsx → CFDI section shows kpis.cfdi_pending (real) instead of hardcoded "24"
  [DATA]   page.tsx → loading skeletons + empty states for all sections
  [FIX]    DashboardShell.tsx → removed unused usePathname import + variable
  [RBAC]   DashboardShell.tsx → userRole default changed to "viewer" (was "owner")
  [RBAC]   ModuleNav.tsx → ROLE_VISIBLE_MODULES covers all 8 roles including socia/almacenista/agente
  [TYPES]  types/index.ts → UserRole now includes socia | almacenista | agente

NEXT PHASE: Dashboard Session 3 — Analytics + Finance
  Prioridad: analytics_reports, finance_snapshots, NPS dashboard
  Estado: Session 2 completa ✅ — 4 módulos UI entregados

REGLAS CRITICAS IMPLEMENTADAS:
  R1 — IDOR: tenant_id filter en todos los queries DB
  R2 — logger.error() en todos los except blocks
  R3 — _get_now() para todos los datetime (no datetime.now())
  R4 — Decimal para montos/ROAS/ACoS (no float)
  R5 — Crisis nivel 3 → ai_active=False obligatorio
  R6 — NPS cooldown desde tenant_config (nps_cooldown_days)
  R7 — FBA: bloquear shipment si no hay FNSKU
  R8 — Instagram: requires_approval=True SIEMPRE
  R9 — Márgenes: ML>=1.20, AMZ>=1.25, Shopify>=1.30, B2B>=1.18
  R10 — HMAC-SHA256 verificado PRIMERO en todos los webhooks

## FASE DASHBOARD
status: DEPLOYED_PRODUCTION ✅
deploy_status: LIVE & CONNECTED
vercel: configured (zero-config, Next.js 14.2 downgrade applied for auth compatibility)
railway: configured (Rootless setup con railway.json en raíz)
last_update: 2026-04-11
pendiente: ejecutar migraciones en Supabase prod

Claude construye:
  - globals.css (design system)
  - layout.tsx (sidebar + header)
  - Sidebar.tsx
  - page.tsx (dashboard principal)
  - Componentes UI

Gemini construye:
  - API routes (8 iniciales + 7 adicionales = 15 endpoints) ✅
  - middleware.ts (auth + tenant + RBAC) ✅
  - types/index.ts (tipos globales) ✅
  - hooks/ (5 hooks de datos swr) ✅
  - lib/auth.ts (helper de tenant) ✅
  - assets (ícono Atollom AI en /public) ✅
  - Autenticación: /login (page + layout + LoginForm) ✅

SESSION 2 PARALELO (Gemini): COMPLETO ✅
  - 7 API routes (ML Questions, CRM, ERP, Meta)
  - Login Neural Command Center

SESSION 3 PARALELO (Gemini): COMPLETO ✅
  - Módulos UI Scaffolding:
    - /crm (Pipeline 6 columnas)
    - /meta (WhatsApp + IG Unified Feed)
    - /erp/inventory (SKU Health Table + Visual Bars)
    - /erp/procurement (OC Approval + Expiry Timers)
  - Data Hooks: useLeads, useConversations, useInventory, usePurchaseOrders
  - Types: Lead, ConversationSummary, LeadStage

CHECKPOINT_SAVE:
  agent: GEMINI (Deployment Vercel & Railway Fixes)
  date: 2026-04-12
  status: FULLY DEPLOYED ✅ — READY FOR META WEBHOOKS & CLAUDE HARDENING

PENDIENTE SESSION 3:
  - Settings Module (Task 3)
  - Realtime Notifications (Task 4)
  - /crm (Leads + Soporte + NPS)
  - /erp/inventory (Inventario + Alertas)
  - /meta (WhatsApp + Instagram)
  - /erp/procurement (OCs pendientes)
