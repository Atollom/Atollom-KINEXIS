# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-11T01:00:00Z
last_agent: CLAUDE
session_count: 10

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'Siguiente módulo: amazon_adapter + amazon_orders_agent + shopify_adapter + shopify_orders_agent + skydrop_adapter'
in_progress: 'Handoff→GEMINI para scaffold Agentes #7, #11 + adapters'
last_completed: '[QA✓] customer_support + account_manager + import_logistics — hardened + 313 tests ✅'
next_task: 'GEMINI: Scaffold amazon_adapter.py + amazon_orders_agent.py (#7) + shopify_adapter.py + shopify_orders_agent.py (#11) + skydrop_adapter.py'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [16/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (PRODUCTION_READY ✅)
- [x] #17 WhatsApp Handler Agent (PRODUCTION_READY ✅)
- [x] #22 Sales B2B Agent (PRODUCTION_READY ✅)
- [x] #23 Lead Qualifier Agent (PRODUCTION_READY ✅)
- [x] #24 Customer Support Agent (PRODUCTION_READY ✅)
- [x] #25 Account Manager Agent (PRODUCTION_READY ✅)
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [x] #32 Inventory Agent (PRODUCTION_READY ✅)
- [x] #33 Procurement Agent (PRODUCTION_READY ✅)
- [x] #35 Import Logistics Agent (PRODUCTION_READY ✅)
- [x] #36 CFDI Billing Agent (PRODUCTION_READY ✅)

### Adapters Completos
- [x] ml_adapter.py (PROD)
- [x] thermal_printer_adapter.py (PROD)
- [x] meta_adapter.py (Stub WA - mock mode)
- [x] facturapi_adapter.py (PRODUCTION_READY ✅)

### Contratos de Agentes [9/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅
- [x] ml_fulfillment_agent.yaml ✅
- [x] cfdi_billing_agent.yaml ✅
- [x] whatsapp_handler_agent.yaml ✅
- [x] sales_b2b_agent.yaml ✅
- [x] lead_qualifier_agent.yaml ✅
- [x] inventory_agent.yaml ✅
- [x] procurement_agent.yaml ✅

## MÓDULO CFDI (PRODUCTION_READY)
- ✅ Migración 007 (Tablas cfdi_records, cfdi_tenant_config_ext, vista review)
- ✅ Lógica de resolución de KITS con Decimal (desglose fiscal exacto — centavo exacto)
- ✅ Reglas de autonomía: threshold desde tenant_config (no hardcodeado)
- ✅ Storage ANTES de BD — CFDI nunca queda huérfano si storage falla
- ✅ Envío al cliente: best-effort con try/except en execute() — no escala si falla
- ✅ Vault stub retorna {} para activar MOCK_MODE (no "MOCK_KEY")
- ✅ Frozensets para whitelists SAT (FORMAS_PAGO, USOS_CFDI, MOTIVOS_CANCELACION)
- ✅ SKU sanitizado con regex antes de query a BD (previene path traversal)

## TESTS PASSING [313/313]
- S1-S5: 91 tests
- S6 Gemini (CFDI Module): 27 tests
- S6 Claude H2 (CFDI Hardening): 12 tests
- S7 Gemini (WhatsApp + B2B): 29 tests
- S7 Claude H2 (WA + B2B Hardening): 14 tests
- S8 Gemini (CRM/ERP Scaffold): 38 tests (lead_qualifier + inventory + procurement)
- S8 Claude H2 (CRM/ERP Hardening): 16 tests (5+6+5)
- S9 Gemini (Support/AM/Logistics): 83 tests (customer_support + account_manager + import_logistics)
  NOTA: incluía 24 tests vacíos (15 extra_* + 8 extra_log_* + 1 pass) — reemplazados
- S10 Claude H2 (Support/AM/Logistics Hardening): 3 tests netos (rest replaced empty)
- Total: 313 ✅

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

## MÓDULO CRM/ERP — S8 (PRODUCTION_READY)

### Lead Qualifier Agent #23
- ✅ _sanitize_for_prompt() PRIMERO antes de regex o LLM
- ✅ LLM tiebreaker SOLO en zona gris (score 4-6) — no consume tokens en casos claros
- ✅ Score clampado: max(1, min(10, score)) — nunca 0 ni negativo ni >10
- ✅ Duplicado: lead_id existente devuelto — NO se crea nuevo lead (previene fragmentación CRM)
- ✅ _check_duplicate() filtra por self.tenant_id — historial SOLO del tenant actual
- ✅ logger.error() antes de cada swallow — visibilidad en fallos LLM y BD
- ✅ b2b activo con previous_purchases → score forzado ≥7

### Inventory Agent #32
- ✅ CRÍTICO: eliminado data.get("tenant_id", self.tenant_id) — payload externo NO puede sobreescribir tenant
- ✅ asyncio.gather() para sync paralelo ML+Amazon+Shopify — fallo de uno no bloquea otros
- ✅ velocity=0 usa fallback 1.0 — previene división por cero en _check_alerts()
- ✅ _check_alerts() retorna [] nunca None — downstream no lanza TypeError
- ✅ _trigger_procurement() loggea ANTES de fire-and-forget — visibilidad garantizada
- ✅ qty_before + qty_after en inventory_movements — trazabilidad fiscal completa
- ✅ alert_critical_days / alert_warning_days desde tenant_config (no hardcodeado 7/15)

### Procurement Agent #33
- ✅ approve_po() — único gateway a status=APPROVED (DRAFT nunca → SENT directo)
- ✅ approval_expires_at verificado vs _get_now() — links viejos rechazados
- ✅ Anti-rubber-stamp: approver_1_id ≠ approver_id para segunda aprobación
- ✅ SKU no influye en selección de proveedor — filtro solo tenant_id + active + incumplimientos
- ✅ procurement_approval_both ($30k) y procurement_safety_days (15d) desde tenant_config
- ✅ Campos approver_1_id + approver_2_id en DRAFT desde creación

## MÓDULO SUPPORT/AM/LOGISTICS — S10 (PRODUCTION_READY)

### Customer Support Agent #24
- ✅ turn_count SIEMPRE de BD — payload externo no puede evitar escalación forzando turn_count
- ✅ order_id filtrado por tenant_id en tracking (IDOR prevention)
- ✅ _notify_partners() ticket select con tenant_id (IDOR fix S10)
- ✅ Devolución: solo abre ticket + notifica — NO autoriza (autorización en Returns Agent #20)
- ✅ Escalación best-effort en try/except — fallo de WA no rompe flujo
- ✅ Respuesta truncada a 1024 chars antes de enviar a Meta
- ✅ Videos ácidos: plata=9nINypdi-6w, oro=pV_I49L6J2o
- ✅ Keywords de escalación: demanda, legal, profeco, abogado, pendejo, inútil, estafa, chinga

### Account Manager Agent #25
- ✅ health_score calculado internamente — nunca aceptado del payload
- ✅ _calculate_health() bare except → logger.error() antes de return 50 (fix S10)
- ✅ MRR nunca negativo: max(Decimal("0.00"), current + amount) (fix S10)
- ✅ Rangos de decay: 0-30d=100, 31-60d=70, 61-90d=40, >90d=10
- ✅ NPS cooldown desde tenant_config (default 90 días)
- ✅ nps_last_sent_at con _get_now() — no datetime.now()
- ✅ Alerta churn si health_score < 40

### Import Logistics Agent #35
- ✅ CRÍTICO: qty de BD en received — payload qty NUNCA usado para actualizar inventario
- ✅ Discrepancia qty_received vs BD → escala a socias (fix S10)
- ✅ alert_sent UPDATE con tenant_id filter (IDOR fix S10)
- ✅ routing_logs insert en cada alerta de ETA (fix S10)
- ✅ eta_original preservado al crear — nunca sobreescrito
- ✅ InventoryAgent instanciado con self.tenant_id siempre
- ✅ import_eta_alert_days desde tenant_config (default 3)

## [HANDOFF→GEMINI] SIGUIENTE MÓDULO
### Adapter + Agente #7: amazon_adapter.py + amazon_orders_agent.py
- amazon_adapter.py: wrapper de Amazon SP-API
  - Auth: LWA tokens (client_id + client_secret + refresh_token) desde Vault
  - Métodos: get_orders(), get_order_items(), confirm_shipment(), update_inventory()
  - Rate limits: SP-API burst/restore — tenacity wait_exponential
  - Timeout: httpx 30s
- amazon_orders_agent.py (#7):
  - Recibe webhook Amazon → crea orden en Supabase → dispara MLFulfillmentAgent
  - Sincroniza tracking de vuelta a Amazon via confirm_shipment()
  - REGLA CRÍTICA: NUNCA marcar shipped sin tracking real (penalización de cuenta)
  - Tabla: amazon_orders (tenant_id, amazon_order_id, status, items_json, tracking_number)
  - Verificación HMAC de webhook Amazon (similar a Meta)

### Adapter + Agente #11: shopify_adapter.py + shopify_orders_agent.py
- shopify_adapter.py: wrapper de Shopify Admin REST API
  - Auth: Private App token desde Vault (header X-Shopify-Access-Token)
  - Métodos: get_orders(), fulfill_order(), update_inventory_level(), verify_webhook()
  - Webhook verification: HMAC-SHA256 con shopify_webhook_secret de Vault
  - Tabla: shopify_orders (tenant_id, shopify_order_id, status, fulfillment_id)
- shopify_orders_agent.py (#11):
  - Recibe webhook Shopify orders/paid → dispara skydrop para guía
  - Actualiza inventory_level en Shopify después de cada fulfillment
  - REGLA: guía de Skydrop ANTES de marcar fulfillment en Shopify

### Adapter: skydrop_adapter.py
- Genera guías de envío para pedidos Shopify
- Auth: API key desde Vault (header Authorization: Bearer)
- Métodos: create_shipment(), get_label_url(), track_shipment()
- Signed URL para PDF de guía: token + expires (mismo patrón que facturapi)
- Tabla: skydrop_labels (tenant_id, shopify_order_id, tracking_number, label_url, expires_at)
- Timeout: httpx 30s; retry 3x con backoff

## REGLAS FISCALES KAP TOOLS (REFERENCIA)
- RFC emisor: KTO2202178K8
- Régimen: 601 (General de Ley Personas Morales)
- CP expedición: 72973
- RFC público general: XAXX010101000 → siempre "PUBLICO EN GENERAL" + CP 72973 + régimen 616
