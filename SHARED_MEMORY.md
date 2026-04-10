# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T16:15:00Z
last_agent: GEMINI
session_count: 4

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'ml_question_handler_agent.py — Fase 1B'
in_progress: 'Handoff to Claude (Hardening)'
last_completed: 'MLQuestionHandlerAgent + 18 Tests Passing'
next_task: 'src/agents/ml_fulfillment_agent.py'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [5/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #2  ML Question Handler (LISTO — 18 tests passing)
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [x] base_agent.py (ACTUALIZADO: Supabase inyectado)
- [x] ai_client.py (LISTO)

### Contratos de Agentes [2/42]
- [x] validation_agent.yaml ✅
- [x] ml_question_handler_agent.yaml ✅

### APIs conectadas
- [x] Mercado Libre OAuth (HARDENED ✅)
- [x] Claude 3.5 Sonnet Integration (BaseAgent ✅)
- [ ] Amazon SP-API
- [ ] Shopify Admin API
- [ ] Meta Business Platform (WA + IG + FB)
- [ ] Facturapi v2

## BLOCKERS CERRADOS
- ✅ RFC: KTO2202178K8
- ✅ CP: 72973
- ✅ ML Credentials en Vault
- ✅ ML Adapter Security Hardening (Claude Code)
- ✅ BaseAgent con inyección de cliente Supabase compartido

## DECISIONES ARQUITECTÓNICAS TOMADAS
- Detección B2B: Regex -> LLM Tiebreaker (Optimización de tokens).
- Stock Realtime: Cache 15 min. Flag `stale=True` si el dato es viejo para respuesta conservadora.
- CRM: Registro mandatorio de interacciones Inbound/Outbound.
- Leads: Registro automático con score 7 si se detecta B2B.

## TESTS PASSING [49/49]
- core/tenant_isolation: 2/2
- ml_adapter: 18/18 (Claude hardened — session 2)
- ml_question_handler: 29/29 (18 Gemini + 11 Claude — session 3)

PRODUCTION_READY: ml_adapter.py — Claude approved — 18 tests — 2026-04-10
PRODUCTION_READY: ml_question_handler_agent.py — Claude approved — 29 tests — 2026-04-10

## NOTAS DE LA SESIÓN 3 (CLAUDE — Hardening Agente #2)
### SECURITY_FIX aplicados en ml_question_handler_agent.py:
1. BLOQUEANTE: _get_stock_realtime() aceptaba tenant_id del payload (caller-controlled).
   FIJADO: eliminado el param, usa self.tenant_id siempre. R3 cumplido.
2. BLOQUEANTE: question_text del comprador entraba crudo al LLM prompt (prompt injection).
   FIJADO: _sanitize_for_prompt() con truncate+regex de patrones de override.
3. LLM retornando vacío publicaba string vacío en ML.
   FIJADO: RuntimeError si response vacío → execute retorna answer_published=False.
4. answer_published check case-sensitive ("active" vs "ACTIVE").
   FIJADO: .lower() comparison.
5. Cero error handling en operaciones de DB — crash sin log.
   FIJADO: try/except con logger.error() en _get_stock_realtime, _register_interactions, _create_lead.
6. _create_lead sin check de duplicados.
   FIJADO: _lead_exists() check antes de INSERT.
7. CRM inserts secuenciales → paralelos con asyncio.gather().
8. get_item() faltaba en ml_adapter.py → AGREGADO.
9. 4 tests vacíos (pass) de Gemini → reemplazados con tests reales.
10. base_agent.py cambio de Gemini (supabase_client param): VERIFICADO — no rompe nada.

## SIGUIENTE TAREA
[HANDOFF→GEMINI] Construir Agente #3: ml_fulfillment_agent.py + thermal_printer_adapter.py
Contexto crítico para Gemini:
- Corte ML: 9AM | Carlos sale máx 10:30AM → procesar órdenes en esa ventana
- Impresora térmica: ZPL/EPL vía socket IP local (modelo: PENDIENTE confirmar Carlos)
- Etiqueta: código de barras, número orden, producto, dirección, logo Kap Tools
- Si impresora no responde: guardar job en cola (tabla print_jobs), NO bloquear flujo
- WhatsApp backup a Carlos si impresora offline (vía Meta Business Platform)
- Full ML se envía solo martes (R11)
- Guías ML FULL: ML Shipping API (no SkyDrop — ese es para Shopify)
- Guías Shopify: SkyDrop adapter (distinto — no mezclar)
- Agent Contract YAML en /specs/fulfillment/ ANTES de codificar
