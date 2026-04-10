# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T16:34:00Z
last_agent: GEMINI
session_count: 6

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'facturapi_adapter.py — Fase 1B'
in_progress: 'Handoff to Claude (Hardening)'
last_completed: 'Facturapi Adapter Implementado (16 tests pass) ✅'
next_task: 'cfdi_billing_agent.py (Agente #36)'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [7/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (PRODUCTION_READY ✅)
- [x] #3  ML Fulfillment Agent (PRODUCTION_READY ✅)
- [x] #26 Validation Agent (CRÍTICO — LISTO)

### Adapters Completos
- [x] ml_adapter.py (PROD)
- [x] thermal_printer_adapter.py (PROD)
- [x] meta_adapter.py (Stub WA - mock mode)
- [x] facturapi_adapter.py (Mock mode ready ✅)

### Contratos de Agentes [3/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅
- [x] ml_fulfillment_agent.yaml ✅
- [x] facturapi_adapter.yaml ✅

## BLOCKERS CERRADOS
- ✅ Regla Fiscal Kits: Desglose automático de componentes para el SAT.
- ✅ Validación RFC Pre-API: Prevención de errores en timbrado.
- ✅ Mock Mode Facturapi: Estabilidad en entorno de tests sin API Keys.
- ✅ Timeouts SAT: Configuración de 45s para timbrado.

## BLOCKERS ABIERTOS
- ⏳ Facturapi Sandbox Key: Carlos debe pegarla en el Dashboard para activar modo real.
- ⏳ CFDI Records Table: Pendiente migración 007 para persistencia de facturas.
- ⏳ SkyDrop API: Investigar para envíos no-ML.

## TESTS PASSING [100/100] (Claude Session 4) + [16 Gemini Session 6 = 116 total pendiente verificar)
- core: 2/2
- ml_adapter: 18/18
- ml_question_handler: 29/29
- ml_fulfillment + printer + meta: 51/51
- facturapi_adapter: 16 (Gemini — pendiente hardening Claude)

PRODUCTION_READY: ml_adapter.py — Claude approved — 18 tests — 2026-04-10
PRODUCTION_READY: ml_question_handler_agent.py — Claude approved — 29 tests — 2026-04-10
PRODUCTION_READY: ml_fulfillment_agent.py — Claude approved — 100 tests — 2026-04-10
PRODUCTION_READY: thermal_printer_adapter.py — Claude approved — 100 tests — 2026-04-10
PRODUCTION_READY: meta_adapter.py — Claude approved (mock mode) — 100 tests — 2026-04-10

## NOTAS DE LA SESIÓN 4 CLAUDE — Hardening Agente #3 + Adaptadores
### SECURITY_FIX:
1. BLOQUEANTE: generate_zpl() sin escapar ^ en dirección del comprador → _escape_zpl_field()
2. BLOQUEANTE: meta_adapter retry inefectivo (exceptions capturadas dentro). FIJADO.
3. BLOQUEANTE: send_whatsapp() message no sanitizado. FIJADO: truncar 500 chars.
4. Puerto 9100 hardcodeado → viene de tenant_config (DEFAULT_PORT=9100 fallback).
5. 5x except Exception sin log en adapters. FIJADO.
6. execute() solo validaba peso, no alto/ancho/largo. FIJADO: 3 dimensiones > 0.
7. base_agent.py: print() → logging; except en run() loggea antes de retornar.
8. 2 tests pass vacíos → tests reales.

## NOTAS DE LA SESIÓN 6 GEMINI — Facturapi Adapter
- facturapi_adapter.py implementado (mock mode, 16 tests)
- Lógica de kits: desglose automático de componentes para el SAT
- asyncio.gather para descarga paralela XML + PDF
- Whitelists SAT (Forma de Pago, Uso CFDI) en el adaptador

## SIGUIENTE TAREA (Claude Session 5)
HARDENING facturapi_adapter.py + construir cfdi_billing_agent.py
Checklist crítico:
- NUNCA timbrar si total <= 0 (R7)
- Kits: desglosar SKU por SKU — R8
- RFC público XAXX010101000 si < $2,000 sin RFC
- XML en Storage PRIVADO antes de success
- Backoff: 2s → 5s → 15s, 3 reintentos
- Cancelación > $10,000 MXN → HUMAN_REQUIRED
