# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T16:27:00Z
last_agent: GEMINI
session_count: 5

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'ml_fulfillment_agent.py — Fase 1B'
in_progress: 'Handoff to Claude (Hardening)'
last_completed: 'Fulfillment Agent + Thermal Printer + Meta Adapter ✅'
next_task: 'src/agents/ml_fulfillment_agent.py (Post-Hardening)'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [7/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (LISTO — 75 tests passing)
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [x] base_agent.py (ACTUALIZADO: Sanitización de Prompts ✅)
- [x] thermal_printer_adapter.py (ZPL + Queue ✅)
- [x] meta_adapter.py (WhatsApp Mock mode ✅)

### Contratos de Agentes [3/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅
- [x] ml_fulfillment_agent.yaml ✅

### APIs conectadas
- [x] Mercado Libre Shipping API (Simulada v1 ✅)
- [x] WhatsApp via Meta Graph API (Stub listo ✅)
- [x] Zebra ZPL via Socket TCP (Puerto 9100 ✅)
- [x] Supabase Storage (Bucket 'shipping-labels' ✅)

## BLOCKERS CERRADOS
- ✅ Sanitize for prompt (Securidad inyecciones)
- ✅ Print Queue (Trazabilidad física)
- ✅ Meta Adapter Stub (WhatsApp ready)
- ✅ Signed URLs para etiquetas (Seguridad storage)

## BLOCKERS ABIERTOS
- ⏳ Meta API Keys: pending (mock activo)
- ⏳ Modelo impresora Carlos: pending (ZPL default)
- ⏳ Facturapi sandbox: pending
- ⏳ SkyDrop API: investigar

## TESTS PASSING [75/75]
- Global: 75/75 (Fulfillment + Printer + Meta included)

## NOTAS DE LA SESIÓN 5
- Se implementó la orquestación de surtido: Generación de guía -> Almacenamiento -> Impresión -> Notificación.
- La impresión térmica falla con gracia: si la impresora está offline, el job se encola automáticamente en BD.
- Se añadió la sanitización obligatoria de prompts en la clase BaseAgent para todos los agentes.
