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

## TESTS PASSING [36/36+]
- ml_adapter: 18/18 (Claude Hardened)
- ml_question_handler: 18/18 (GEMINI Implemented)

## NOTAS DE LA SESIÓN 4
- Se implementó exitosamente el Agente #2 con todas las reglas de negocio de Kap Tools.
- Se configuró el sistema de prompts para manejar videos de YouTube en productos de ácidos joyeros.
- El sistema está listo para que Claude aplique el mismo nivel de "hardening" al código del nuevo agente.
