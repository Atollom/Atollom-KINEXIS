# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T18:30:00Z
last_agent: CLAUDE
session_count: 7

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'Siguiente módulo: whatsapp_handler_agent + sales_b2b_agent'
in_progress: 'Handoff→GEMINI para scaffold de Agente #17 y #22'
last_completed: '[QA✓] facturapi_adapter + cfdi_billing_agent — hardened + 130 tests ✅'
next_task: 'GEMINI: Scaffold whatsapp_handler_agent.py (Agente #17) + sales_b2b_agent.py (Agente #22)'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [8/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (PRODUCTION_READY ✅)
- [x] #36 CFDI Billing Agent (PRODUCTION_READY ✅)
- [x] #26 Validation Agent (CRÍTICO — LISTO)

### Adapters Completos
- [x] ml_adapter.py (PROD)
- [x] thermal_printer_adapter.py (PROD)
- [x] meta_adapter.py (Stub WA - mock mode)
- [x] facturapi_adapter.py (PRODUCTION_READY ✅)

### Contratos de Agentes [4/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅
- [x] ml_fulfillment_agent.yaml ✅
- [x] cfdi_billing_agent.yaml ✅

## MÓDULO CFDI (PRODUCTION_READY)
- ✅ Migración 007 (Tablas cfdi_records, cfdi_tenant_config_ext, vista review)
- ✅ Lógica de resolución de KITS con Decimal (desglose fiscal exacto — centavo exacto)
- ✅ Reglas de autonomía: threshold desde tenant_config (no hardcodeado)
- ✅ Storage ANTES de BD — CFDI nunca queda huérfano si storage falla
- ✅ Envío al cliente: best-effort con try/except en execute() — no escala si falla
- ✅ Vault stub retorna {} para activar MOCK_MODE (no "MOCK_KEY")
- ✅ Frozensets para whitelists SAT (FORMAS_PAGO, USOS_CFDI, MOTIVOS_CANCELACION)
- ✅ SKU sanitizado con regex antes de query a BD (previene path traversal)

## TESTS PASSING [130/130]
- S1-S5: 91 tests
- S6 Gemini (CFDI Module): 27 tests
- S6 Claude H2 (CFDI Hardening): 12 tests
- Total: 130 ✅

## [HANDOFF→GEMINI] SIGUIENTE MÓDULO
### Agente #17: whatsapp_handler_agent.py
- Recibe webhooks Meta (verificados con HMAC-SHA256 X-Hub-Signature-256)
- Enruta mensajes entrantes al agente correcto según intención detectada
- Responde vía MetaAdapter.send_whatsapp()
- Tabla: whatsapp_messages (tenant_id, from_number, message, direction, agent_handled)

### Agente #22: sales_b2b_agent.py
- Detecta si comprador es B2B (ya implementado en ml_question_handler)
- Genera propuesta PDF + envío por email (Resend Fase 2) o WhatsApp
- Tabla: b2b_leads (tenant_id, company_name, rfc, contact_email, status)
- Regla: cotización > $50,000 MXN requiere aprobación manual (misma lógica autonomy que CFDI)

## REGLAS FISCALES KAP TOOLS (REFERENCIA)
- RFC emisor: KTO2202178K8
- Régimen: 601 (General de Ley Personas Morales)
- CP expedición: 72973
- RFC público general: XAXX010101000 → siempre "PUBLICO EN GENERAL" + CP 72973 + régimen 616
