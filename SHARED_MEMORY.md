# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T15:45:00Z
last_agent: GEMINI
session_count: 1

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'Finalización de Fase 1A Core'
current_file: 'src/agents/router_agent.py'
current_function: 'process()'
last_completed: 'BaseAgent, ValidationAgent #26, Router Agent #1, Migrations 001-004'
next_task: 'Fase 1B: ml_adapter.py y ml_question_handler_agent.py'

## ESTADO DE IMPLEMENTACIÓN
### Infraestructura
- [x] Estructura de carpetas src/ y migrations/ creada
- [x] Migraciones SQL 001-004 (Tenants, Vault, Logs, Core) generadas
- [ ] Railway project + Python backend deployado
- [ ] Vercel project + Next.js deployado
- [ ] Supabase Vault configurado (pgsodium habilitado en SQL)

### Agentes implementados [3/42]
- [ ] #0  Integration Agent (dashboard config)
- [x] #1  Router Agent + 4 sub-routers
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [ ] #2  ML Question Handler
- [ ] #3  ML Fulfillment + thermal printer
- [ ] #36 CFDI Billing Agent

### APIs conectadas
- [ ] Mercado Libre OAuth (App ID: PENDIENTE)
- [ ] Amazon SP-API
- [ ] Shopify Admin API
- [ ] Meta Business Platform (WA + IG + FB)
- [ ] Facturapi v2 (sandbox configurado: NO)
- [ ] SkyDrop (guías Shopify — pendiente integrar)

## BLOCKERS ACTIVOS
- ML App ID + Client Secret: PENDIENTE (en proceso de registro)
- Facturapi API key sandbox: PENDIENTE (crear cuenta)
- Modelo impresora térmica: PENDIENTE (Carlos)

## DECISIONES ARQUITECTÓNICAS TOMADAS
- RFC: KTO2202178K8 ✅ CONFIRMADO
- CP de expedición: 72973 ✅ CONFIRMADO
- Aislamiento de Tenants: Verificado mediante `tests/test_tenant_isolation.py`
- IA Fallback: Claude-3.5-Sonnet -> Gemini-2.0-Flash (implementado en `ai_client.py`)

## TESTS PASSING [2/2]
- unit: 2/2 (test_tenant_isolation.py)
- integration: 0/0

## NOTAS DE LA ÚLTIMA SESIÓN
- Se completó la Fase 1A. El sistema ya cuenta con la base para el multi-tenancy y la validación determinista de reglas de negocio.
- El Agente #26 bloquea correctamente el acceso entre tenants.
- Los datos fiscales de Kap Tools están integrados en las migraciones y validaciones.
