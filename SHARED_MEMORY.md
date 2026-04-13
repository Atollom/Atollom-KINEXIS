agentes_implementados: 43/43
agent_contracts_done: 43/43
migraciones: 032/N
tests_totales: 836 passing ✅  (769 previos + 67 Dashboard H1: Settings+Notifications+Pages+Onboarding)

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

REALTIME NOTIFICATIONS — 2026-04-13:
  [REALTIME] lib/realtime.ts → subscribeToTable con reconexión exponential backoff (1s→2s→4s→…→30s, max 8 intentos)
  [REALTIME] lib/realtime.ts → subscribeToNotificationSources() — suscripción a 5 tablas fuente en una llamada
  [HOOK]     useNotifications.ts → SIN polling (refreshInterval:0) — solo Realtime dispara revalidación
  [HOOK]     useNotifications.ts → read state en localStorage (key: kinexis-read-notifs-{tenantId}, max 500 IDs)
  [HOOK]     useNotifications.ts → markRead(id), markAllAsRead() exportados
  [HOOK]     useNotifications.ts → sonido crítico via Web Audio API (beep A5→A4, 0.3s) cuando llega nueva notif high/critical
  [HOOK]     useNotifications.ts → computeUnreadCount, markOneRead, markAllRead exportados como funciones puras para tests
  [UI]       NotificationPanel.tsx → slide-over desde la derecha, agrupado por módulo (Sistema>ERP>Ecommerce>CRM)
  [UI]       NotificationPanel.tsx → icono por tipo, color por prioridad, tiempo relativo
  [UI]       NotificationPanel.tsx → marcar leída al clic, "Leer todo" button, badge de unread en header del panel
  [UI]       NotificationPanel.tsx → cierra con Escape, foco automático al abrir (accesibilidad)
  [UI]       Header.tsx → badge muestra unreadCount (no solo criticalCount), pulsa solo si hay críticas
  [API]      /api/notifications/route.ts → campo module añadido (erp/ecommerce/crm/sistema), derivado por type
  [API]      /api/notifications/route.ts → tenant_id siempre de getAuthenticatedTenant(), nunca de query params
  [TYPES]    types/index.ts → NotificationModule = 'ecommerce'|'erp'|'crm'|'sistema' añadido a Notification
  [TESTS]    __tests__/notifications.test.ts → 15 tests vitest (puro, sin DOM): computeUnreadCount, markOneRead, markAllRead, realtime badge increment/decrement
  [TEST_FW]  vitest@1.6.1 instalado + vitest.config.ts configurado

SETTINGS MODULE H1 — 2026-04-13:
  BUGS ENCONTRADOS Y CORREGIDOS:
  [BUG-CRITICAL] autonomy/route.ts — z.record(z.string(),...) aceptaba cualquier moduleId arbitrario → inyección de claves en tenant_agent_autonomy. Fix: z.object({ecommerce,erp,crm}).strict() — solo módulos conocidos, claves desconocidas → 400
  [BUG-CRITICAL] settings/page.tsx — userRole hardcodeado a "owner". Cualquier sesión veía UI de owner. Fix: useState("viewer") + useEffect con createClientComponentClient → user_profiles
  [BUG-HIGH]     middleware.ts — /settings page sin RBAC. Viewer podía cargar la página. Fix: si role no es owner/admin/socia → redirect a /

  H1 CHECKLIST RESULTS:
  [OK] vault/route.ts   — GET retorna solo { key_name: boolean }, nunca valores reales ✅
  [OK] users/route.ts   — PATCH: solo owner puede cambiar roles, tenant isolation en update ✅
  [OK] profile/route.ts — RFC regex /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/ correcto para SAT ✅
  [OK] autonomy/route.ts — tenant_id siempre de auth, nunca del body ✅ (+ fix module whitelist)
  [OK] settings/page.tsx — inputs API keys nunca mandan valor al cliente (vaultStatus es bool) ✅

  TESTS (vitest) 22/22:
  - admin/socia/viewer PATCH /users → 403 (3 tests)
  - unauthenticated → 401
  - 6 RFC inválidos → 400 (longitud, minúsculas, solo números, vacío)
  - 3 RFC válidos → !400
  - vault GET: todos los valores son boolean, true para configuradas, false para no (2 tests)
  - viewer → 403 en vault GET
  - vault PATCH loguea [REDACTED], nunca el valor real
  - profile PATCH loguea campo y valores correctos en config_change_log
  - autonomy PATCH loguea cambio de nivel
  - body con clave desconocida → 400
  - módulos conocidos aceptados → 200
  - nivel inválido → 400

DASHBOARD PAGES H1 HARDENING — 2026-04-13:
  BUGS ENCONTRADOS Y CORREGIDOS:
  [BUG-CRITICAL] crm/page.tsx — handleApproveQuote sin .eq("tenant_id") — IDOR. Cualquier usuario autenticado podía aprobar quotes de otros tenants con UUID. Fix: añadir estado tenantId + .eq("tenant_id", tenantId) en UPDATE
  [BUG-CRITICAL] crm/page.tsx — handleApproveQuote sin RBAC. Cualquier rol podía aprobar cotizaciones. Fix: guard if (role !== "owner" && role !== "socia") return
  [BUG-HIGH]    crm/page.tsx — canApprove incluía "admin". Solo owner/socia aprueban cotizaciones (igual que OCs). Fix: remover "admin"
  [BUG-HIGH]    meta/page.tsx — role descartado con [, setRole]. No había guard en handleReply. Fix: restaurar [role, setRole] + guard de rol
  [BUG-HIGH]    purchase-orders/route.ts — GET y PATCH excluían "socia". Fix: añadir "socia" a MANAGE_ROLES
  [BUG-HIGH]    purchase-orders/route.ts — PATCH solo aceptaba action "approve". submit/reject/mark_sent → 400. Fix: tabla de transiciones ACTION_TRANSITIONS con RBAC por acción
  [BUG-HIGH]    purchase-orders/route.ts — Sin POST handler. restock_request del inventario iba a 404. Fix: POST handler que crea OC en DRAFT (nunca APPROVED)
  [BUG-MEDIUM]  purchase-orders/route.ts — PATCH no validaba que el status actual coincidiera con la transición → bypass de flujo DRAFT→APPROVED. Fix: leer status actual + validar before→after; errores 409 si no coincide
  [BUG-MEDIUM]  meta/conversations/route.ts — Sin POST handler. Replies silenciosamente fallaban. Fix: POST handler con RBAC (owner/admin/socia/agente) + tenant isolation

  H1 CHECKLIST RESULTS:
  [OK] crm/page.tsx — handleApproveQuote: RBAC owner/socia + tenant_id en UPDATE ✅
  [OK] crm/page.tsx — canApprove: owner/socia solo (admin excluido) ✅
  [OK] meta/page.tsx — role restaurado; handleReply guard por rol ✅
  [OK] erp/inventory/page.tsx — Crear OC → restock_request → POST → DRAFT (no bypass) ✅
  [OK] erp/procurement/page.tsx — canApprove=owner/socia; canManage=owner/admin/socia ✅
  [OK] purchase-orders/route.ts — socia incluida en GET/PATCH; transiciones con RBAC ✅
  [OK] purchase-orders/route.ts — tenant_id filter doble en PATCH UPDATE ✅
  [OK] meta/conversations/route.ts — POST con RBAC y tenant isolation ✅

  TESTS (vitest) 18/18 — 0 regressions (55 total = 15+22+18):
  - almacenista/viewer → 403 GET purchase-orders
  - socia puede ver OCs → 200
  - admin intenta aprobar OC → 403 (rol insuficiente para approve)
  - socia puede aprobar OC → 200
  - admin puede submit DRAFT → 200
  - flujo bypass DRAFT→APPROVED → 409
  - viewer/contador → 403 POST meta/conversations
  - agente puede responder → 200
  - canal inválido → 400
  - tenant isolation: OC de otro tenant → 404
  - body sin po_id → 400
  - acción desconocida → 400
  - unauthenticated → 401
  - restock_request crea OC con status DRAFT (no APPROVED) → 201
  - almacenista → 403 en POST purchase-orders

ONBOARDING H1 HARDENING — 2026-04-13:
  BUGS ENCONTRADOS Y CORREGIDOS:
  [BUG-CRITICAL] middleware.ts — /onboarding sin RBAC server-side. Non-owner podía acceder durante loadingUser=true (timing window). Fix: RBAC middleware solo owner puede acceder a /onboarding
  [BUG-CRITICAL] onboarding/page.tsx — finishOnboarding() solo hacía router.push("/"), nunca marcaba onboarding_complete=true. Fix: llama POST /api/onboarding/complete antes de navegar
  [BUG-HIGH]    onboarding/page.tsx — "Omitir Todo" llamaba router.push("/") sin guardar datos del paso actual. Fix: skipAll() guarda paso actual en best-effort antes de salir
  [BUG-HIGH]    onboarding/page.tsx — saveStep3() ignoraba response de API de perfil. RFC inválido → API retorna 400 pero usuario avanzaba igual. Fix: saveStep3 retorna boolean, nextStep bloquea avance si !ok
  [BUG-HIGH]    middleware.ts — /api/onboarding sin RBAC. Fix: solo role === "owner" puede acceder

  NUEVO ENDPOINT:
  [API] /api/onboarding/complete (POST) — owner-only, upserta onboarding_complete=true + onboarding_completed_at + config_change_log

  H1 CHECKLIST RESULTS:
  [OK] API keys nunca en console.log ni en config_change_log con valor real ✅ (vault PATCH loggea [REDACTED])
  [OK] "Saltar Todo" → skipAll() guarda paso actual antes de salir ✅
  [OK] Solo owner puede acceder: middleware server-side redirect + API route guard ✅
  [OK] RFC validado server-side en ProfileSchema (z.string().regex) + error bloqueante en client ✅
  [OK] finishOnboarding → llama API → onboarding_complete=true en DB ✅
  [OK] Interrupción a mitad: cada saveStep es independiente, falla en saveStep3 → no avanza ✅

  TESTS (vitest) 12/12:
  - admin/socia/viewer → 403 POST /api/onboarding/complete
  - unauthenticated → 401
  - owner → 200, upsert con onboarding_complete: true
  - config_change_log registra field "onboarding.complete"
  - 4 RFC inválidos → 400 server-side
  - RFC válido → !400
  - vault PATCH: config_change_log nunca contiene valor real ([REDACTED])

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
