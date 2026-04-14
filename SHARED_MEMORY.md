agentes_implementados: 43/43
agent_contracts_done: 43/43
migraciones: 032/N
tests_totales: 104 passing ✅  (77 previos + 10 atollom-panel + 15 samantha-chat-tools + 12 facturapi-provision)

ESTADO: PRODUCTION_READY
claude_approved_date: 2026-04-13
hardening_sessions: BLOQUE1 + BLOQUE2 + BLOQUE3 + BLOQUE4 + BLOQUE5 + BLOQUE6 + BLOQUE7 (completo)

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

ATOLLOM PANEL H1 HARDENING — 2026-04-13:
  BUGS ENCONTRADOS Y CORREGIDOS:
  [BUG-CRITICAL] middleware.ts — /api/atollom/* sin RBAC. Cualquier usuario autenticado podía llamar endpoints de superadmin. Fix: guard atollom_admin only en sección API RBAC
  [BUG-CRITICAL] notifySuperadmin() — llamaba /api/meta/conversations (atollom_admin → 403). Fix: endpoint dedicado /api/atollom/notify que inserta en system_notifications queue
  [BUG-HIGH]    escalateTicket() — enviaba WhatsApp para TODOS los tickets. Fix: solo priority === "critical" dispara notifySuperadmin
  [BUG-HIGH]    config_change_log — vault.* campos se mostraban en claro en UI. Fix: l.field.startsWith("vault.") → "[REDACTED]" en ambas columnas
  [BUG-MEDIUM]  atollom/page.tsx — sin guard client-side de rol. Fix: useEffect verifica user_profiles.role === "atollom_admin"; si no → pantalla "Acceso Prohibido"

  NUEVO ENDPOINT:
  [API] /api/atollom/notify (POST) — atollom_admin only, inserta en system_notifications con recipient_phone, channel, severity, status:"pending"

  TESTS (vitest) 10/10:
  - unauthenticated → 401
  - owner/admin → 403
  - atollom_admin → 200
  - missing/empty message → 400
  - invalid severity → 400
  - default severity "info"
  - correct DB payload (recipient, channel, status, sent_by)
  - DB error → 500

SAMANTHA CHAT H1 HARDENING — 2026-04-13:
  BUGS ENCONTRADOS Y CORREGIDOS:
  [BUG-CRITICAL] chat/route.ts — los 4 tools devolvían datos hardcodeados (mocks). Fix: real Supabase queries en lib/samantha-tools.ts
  [BUG-CRITICAL] escalate_to_human — llamaba /api/meta/conversations con Bearer token server-to-server → 401 (middleware verifica cookies, no Bearer). Fix: supabase client directo para insert en support_tickets + system_notifications
  [BUG-HIGH]    escalate_to_human — enviaba WhatsApp para todos los priorities. Fix: solo high/critical queuen system_notifications
  [BUG-MEDIUM]  Memory inserts usaban .then() sin catch. Fix: .then(({ error }) => { if (error) console.error(...) })
  [BUG-LOW]     Artificial 10ms delay en streaming (setTimeout). Fix: removido; chunks más grandes (80 chars)

  NUEVO ARCHIVO:
  [LIB] lib/samantha-tools.ts — handlers extraídos y testeables:
    - getTodaySales: ordenes de hoy con CDMX timezone, top_platform aggregation
    - getOrderStatus: tenant-scoped lookup por order ID
    - getCriticalInventory: usa tenant_business_rules.stock_critical_days como umbral
    - generateWeeklyReport: inserta report_requests para worker background
    - escalateToHuman: ticket + WhatsApp solo para high/critical

  [OBSERVABILITY] Langfuse tracing por request (graceful con keys faltantes):
    - trace: samantha-chat con userId + tenant_id metadata
    - generation: span por llamada Gemini con input/output
    - tool spans: uno por tool call

  TESTS (vitest) 15/15:
  - getTodaySales: agrega, enforces tenant_id, maneja DB error
  - getOrderStatus: retorna orden, retorna error si no encontrada
  - getCriticalInventory: usa threshold correcto, maneja DB error
  - generateWeeklyReport: inserta con tenant_id/user correcto, maneja error
  - escalateToHuman: crea ticket con tenant_id, WhatsApp para critical/high, NO para low/medium, maneja error

FACTURAPI MULTI-ORG + H1 HARDENING — 2026-04-13:
  ARQUITECTURA:
  - Atollom tiene una cuenta FacturAPI (FACTURAPI_USER_KEY en env)
  - Cada tenant recibe su propia organización FacturAPI — Atollom la crea, el cliente NUNCA toca FacturAPI
  - live key por tenant guardada en vault_secrets["facturapi_live_key"], NUNCA en logs ni response body

  ENDPOINT NUEVO:
  [API] /api/onboarding/provision-facturapi (POST) — owner-only, idempotente
    - Sin FACTURAPI_USER_KEY → { status: "skipped" } HTTP 200 (no bloquea onboarding)
    - Tenant ya provisionado → { status: "already_provisioned", org_id } (idempotencia)
    - RFC vacío → 422
    - RFC formato inválido → 400 (FacturAPI NUNCA es llamada)
    - FacturAPI error → 502 (no bloquea onboarding)
    - Happy path → { status: "provisioned", org_id } — live_key NUNCA en response body
    - Audita config_change_log: field "facturapi.org_provisioned", new_value = org_id (no la key)

  BUGS H1 CORREGIDOS:
  [BUG-CRITICAL] provision-facturapi/route.ts — RFC solo verificaba truthy, no formato. Fix: RFC_REGEX /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/ validado ANTES de llamar FacturAPI → 400
  [BUG-HIGH]    facturapi_adapter.py create_organization() — sin check de idempotencia. Fix: try/except lee cfdi_config existente → already_provisioned si org_id existe; non-blocking si DB falla

  CAMBIO UI ONBOARDING (step 3):
  - Eliminado campo "FacturAPI API Key" del formulario
  - Auto-provision en background: spinner → checkmark/warning
  - Cliente nunca ve ni configura la live key

  TESTS (vitest) 12/12:
  - unauthenticated → 401, admin → 403, socia → 403
  - FACTURAPI_USER_KEY ausente → 200 status:skipped (FacturAPI no llamada)
  - Llamada doble → 200 status:already_provisioned con org_id (FacturAPI no llamada)
  - RFC vacío → 422 (FacturAPI no llamada)
  - RFC formato inválido → 400 (FacturAPI no llamada), error body contiene "RFC"
  - FacturAPI 400 → 502, error body no contiene user key
  - Happy path → 200 status:provisioned + org_id
  - live_key NUNCA en response body ("live" / "sk_live" ausentes)
  - live_key guardada en vault con tenant_id correcto (upsertSpy verificado)
  - config_change_log: field=facturapi.org_provisioned, new_value=org_id (sin live_key)

PROD DB VERIFICATION — 2026-04-13:
  run_remaining_prod.sql ejecutado en Supabase prod.

  TABLAS FALTANTES DETECTADAS Y CORREGIDAS (migration 033):
  Las siguientes tablas estaban referenciadas en el código pero NO tenían migración:
  1. tenant_profiles    — perfil empresa (business_name, rfc, plan, active_modules, onboarding_complete)
  2. config_change_log  — auditoría de cambios de configuración (vault, profile, onboarding)
  3. system_notifications — cola WhatsApp dispatch (recipient_phone, channel, severity, status:pending)
  4. samantha_memory    — memoria conversacional Samantha por tenant
  5. report_requests    — cola de generación de reportes PDF background
  6. tenant_agent_autonomy — niveles de autonomía por módulo (ecommerce/erp/crm)
  7. vault_secrets      — almacenamiento de API keys (encrypted_value NUNCA expuesta al cliente)
  8. agent_status       — VIEW sobre tenant_agent_config (meta/page.tsx usa module filter)

  PARCHES ADICIONALES:
  - user_profiles: constraint role ampliado → owner, viewer, contador, atollom_admin añadidos
  - user_profiles: columnas display_name, email, updated_at añadidas
  - tenant_agent_config: columnas last_run_at, success_rate añadidas (para agent_status VIEW)

  RLS STATUS POST-033:
  ✅ tenant_profiles      — isolation + service_role + atollom_read_all
  ✅ config_change_log    — isolation + service_role + atollom_read_all
  ✅ system_notifications — service_role + atollom_only
  ✅ samantha_memory      — isolation + service_role
  ✅ report_requests      — isolation + service_role
  ✅ tenant_agent_autonomy — isolation + service_role
  ✅ vault_secrets        — service_role (SELECT isolation para check existencia)
  ✅ agent_status         — view hereda RLS de tenant_agent_config

  TABLAS REFERENCIADAS EN CÓDIGO — TODAS CUBIERTAS ✅

  INSTRUCCIÓN PARA EJECUTAR:
  SQL Editor Supabase → pegar contenido de migrations/033_missing_tables.sql → Run
  Es idempotente (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS) — seguro ejecutar múltiples veces.

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

## [FASE] ESTABILIDAD DE TIPOS & SEEDING — 2026-04-14
[HUMAN DECISION: Carlos Hernán Cortés Ayala y Hiram Alexis Valencia Duarte ordenan el arreglo del sistema de tipos (UserRole) y la ejecución del Seeding de Datos para Ortho Cardio. Esta arquitectura de seguridad y datos es propiedad intelectual dirigida por los fundadores mencionados.]

CHECKPOINT_SAVE:
  agent: GEMINI (Type Stability & Data Seeding Phase)
  directors: Carlos Hernán Cortés Ayala, Hiram Alexis Valencia Duarte
  status: TYPES_FIXED ✅ | SEED_READY ✅ | UPLOADING_TO_PROD...
  infrastructure: META_WEBHOOKS_ENABLED ✅
