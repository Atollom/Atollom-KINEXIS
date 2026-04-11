# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T20:00:00Z
last_agent: CLAUDE
session_count: 8

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'Siguiente módulo: lead_qualifier_agent + inventory_agent + procurement_agent'
in_progress: 'Handoff→GEMINI para scaffold Agentes #23, #32, #33'
last_completed: '[QA✓] whatsapp_handler_agent + sales_b2b_agent — hardened + 173 tests ✅'
next_task: 'GEMINI: Scaffold lead_qualifier_agent.py (#23) + inventory_agent.py (#32) + procurement_agent.py (#33)'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [10/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (PRODUCTION_READY ✅)
- [x] #17 WhatsApp Handler Agent (PRODUCTION_READY ✅)
- [x] #22 Sales B2B Agent (PRODUCTION_READY ✅)
- [x] #36 CFDI Billing Agent (PRODUCTION_READY ✅)
- [x] #26 Validation Agent (CRÍTICO — LISTO)

### Adapters Completos
- [x] ml_adapter.py (PROD)
- [x] thermal_printer_adapter.py (PROD)
- [x] meta_adapter.py (Stub WA - mock mode)
- [x] facturapi_adapter.py (PRODUCTION_READY ✅)

### Contratos de Agentes [6/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅
- [x] ml_fulfillment_agent.yaml ✅
- [x] cfdi_billing_agent.yaml ✅
- [x] whatsapp_handler_agent.yaml ✅
- [x] sales_b2b_agent.yaml ✅

## MÓDULO CFDI (PRODUCTION_READY)
- ✅ Migración 007 (Tablas cfdi_records, cfdi_tenant_config_ext, vista review)
- ✅ Lógica de resolución de KITS con Decimal (desglose fiscal exacto — centavo exacto)
- ✅ Reglas de autonomía: threshold desde tenant_config (no hardcodeado)
- ✅ Storage ANTES de BD — CFDI nunca queda huérfano si storage falla
- ✅ Envío al cliente: best-effort con try/except en execute() — no escala si falla
- ✅ Vault stub retorna {} para activar MOCK_MODE (no "MOCK_KEY")
- ✅ Frozensets para whitelists SAT (FORMAS_PAGO, USOS_CFDI, MOTIVOS_CANCELACION)
- ✅ SKU sanitizado con regex antes de query a BD (previene path traversal)

## TESTS PASSING [173/173]
- S1-S5: 91 tests
- S6 Gemini (CFDI Module): 27 tests
- S6 Claude H2 (CFDI Hardening): 12 tests
- S7 Gemini (WhatsApp + B2B): 29 tests
- S7 Claude H2 (WA + B2B Hardening): 14 tests
- Total: 173 ✅

## MÓDULO WA + B2B (PRODUCTION_READY)
- ✅ HMAC-SHA256 verificado PRIMERO en process() con fallback a X-Hub-Signature legacy
- ✅ MOCK_MODE si no hay meta_app_secret en Vault — Meta requiere 200 OK siempre
- ✅ Session TTL 24h — sesiones expiradas se descartan y reinician
- ✅ Session aislada por tenant_id + from_number (previene IDOR de sesión)
- ✅ RFC enmascarado en logs: KTO2202178K8 → KTO****78K8
- ✅ Mensajes truncados a 1024 chars antes de enviar a Meta
- ✅ send_whatsapp best-effort con try/except — fallos registrados en BD como 'failed'
- ✅ _update_session usa _get_now() — no datetime.now() suelto
- ✅ _get_quote() filtra por tenant_id + quote_id (previene IDOR de cotización)
- ✅ Thresholds $15k/$50k desde tenant_config — no hardcodeados
- ✅ Umbral de volumen (b2b_vol_threshold) desde tenant_config — no hardcodeado en 50
- ✅ lead_id sanitizado con _PATH_SAFE antes de usarlo en Storage paths
- ✅ required_approvers=2 para partners_both con nota anti-rubber-stamp
- ✅ total de _confirm_order() leído de BD — no del payload del cliente

## [HANDOFF→GEMINI] SIGUIENTE MÓDULO
### Agente #23: lead_qualifier_agent.py
- Score 1-10, B2B si score > 7
- Canal origen: ML / WA / IG / web
- Transferir inmediato al SalesB2BAgent si score > 7
- Tabla: leads (tenant_id, source_channel, score, status, assigned_agent)

### Agente #32: inventory_agent.py
- Fuente de verdad de stock para todos los canales
- Sync a ML + Amazon + Shopify con cola de actualización
- Alerta cuando stock <= 7 días de ventas proyectadas
- Tabla: inventory_events (tenant_id, sku, delta, source, reason)

### Agente #33: procurement_agent.py
- NUNCA enviar OC sin aprobación de socias (workflow draft→approved→sent)
- Solo proveedores en approved_suppliers table
- Tabla: purchase_orders (tenant_id, supplier_id, status, approver_id)
- Regla: OC > $20k requiere 2 aprobaciones (misma lógica que Sales B2B)

## REGLAS FISCALES KAP TOOLS (REFERENCIA)
- RFC emisor: KTO2202178K8
- Régimen: 601 (General de Ley Personas Morales)
- CP expedición: 72973
- RFC público general: XAXX010101000 → siempre "PUBLICO EN GENERAL" + CP 72973 + régimen 616
