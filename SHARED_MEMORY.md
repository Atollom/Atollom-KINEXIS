# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-11T00:00:00Z
last_agent: CLAUDE
session_count: 8

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'Siguiente módulo: customer_support + account_manager + import_logistics'
in_progress: 'Handoff→GEMINI para scaffold Agentes #24, #25, #35'
last_completed: '[QA✓] lead_qualifier + inventory + procurement — hardened + 227 tests ✅'
next_task: 'GEMINI: Scaffold customer_support_agent.py (#24) + account_manager_agent.py (#25) + import_logistics_agent.py (#35)'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [13/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (PRODUCTION_READY ✅)
- [x] #17 WhatsApp Handler Agent (PRODUCTION_READY ✅)
- [x] #22 Sales B2B Agent (PRODUCTION_READY ✅)
- [x] #23 Lead Qualifier Agent (PRODUCTION_READY ✅)
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [x] #32 Inventory Agent (PRODUCTION_READY ✅)
- [x] #33 Procurement Agent (PRODUCTION_READY ✅)
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

## TESTS PASSING [227/227]
- S1-S5: 91 tests
- S6 Gemini (CFDI Module): 27 tests
- S6 Claude H2 (CFDI Hardening): 12 tests
- S7 Gemini (WhatsApp + B2B): 29 tests
- S7 Claude H2 (WA + B2B Hardening): 14 tests
- S8 Gemini (CRM/ERP Scaffold): 38 tests (lead_qualifier + inventory + procurement)
- S8 Claude H2 (CRM/ERP Hardening): 16 tests (5+6+5)
- Total: 227 ✅ (Gemini claimed 249 — cifra incorrecta, baseline real era 211)

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

## [HANDOFF→GEMINI] SIGUIENTE MÓDULO
### Agente #24: customer_support_agent.py
- Soporte post-venta: tracking de pedidos, cambios, devoluciones
- Escalación a humano si no puede resolver en 3 turnos
- Tabla: support_tickets (tenant_id, order_id, issue_type, status, resolved_at)
- Canal: WhatsApp (via WhatsAppHandlerAgent) + email

### Agente #25: account_manager_agent.py
- Seguimiento de cuentas B2B: renovaciones, upsell, NPS
- Alertas cuando cliente B2B lleva >30 días sin compra
- Tabla: b2b_accounts (tenant_id, lead_id, mrr, last_purchase_at, health_score)
- Integración: SalesB2BAgent para cotizaciones, CFDIBillingAgent para historial facturas

### Agente #35: import_logistics_agent.py
- Gestión de importaciones: pedido→aduana→almacén→inventario
- Integración con ProcurementAgent (OC aprobada → trigger import)
- Tabla: import_shipments (tenant_id, po_id, status, eta, customs_reference)
- Regla: alerta automática si ETA se retrasa > 3 días

## REGLAS FISCALES KAP TOOLS (REFERENCIA)
- RFC emisor: KTO2202178K8
- Régimen: 601 (General de Ley Personas Morales)
- CP expedición: 72973
- RFC público general: XAXX010101000 → siempre "PUBLICO EN GENERAL" + CP 72973 + régimen 616
