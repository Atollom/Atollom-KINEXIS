# KINEXIS — SHARED_MEMORY.md
# FUENTE DE VERDAD DEL PROYECTO — LEER ANTES DE CUALQUIER ACCIÓN
# Actualizar al TERMINAR cada sesión de trabajo

## META
last_updated: 2026-04-10T16:00:00Z
last_agent: GEMINI
session_count: 2

## CHECKPOINT ACTIVO
phase: 1
week: 1
current_task: 'ml_adapter.py — Fase 1B'
in_progress: 'QA & Hardening'
last_completed: 'MLAdapter + OAuth + Webhook Dispatcher'
next_task: 'src/agents/ml_question_handler_agent.py'

## ESTADO DE IMPLEMENTACIÓN
### Agentes implementados [4/42]
- [x] #1  Router Agent + 4 sub-routers
- [x] #26 Validation Agent (CRÍTICO — LISTO)
- [x] base_agent.py (LISTO)
- [x] ai_client.py (LISTO)

### APIs conectadas
- [x] Mercado Libre OAuth (App ID: 2563941731044265 ✅ en Vault)
- [ ] Amazon SP-API
- [ ] Shopify Admin API
- [ ] Meta Business Platform (WA + IG + FB)
- [ ] Facturapi v2 (sandbox configurado: NO)

## BLOCKERS CERRADOS HOY
- ✅ RFC: KTO2202178K8
- ✅ CP expedición: 72973
- ✅ ML App ID + Client Secret → Integrados en Vault
- ✅ Fase 1A arquitectura core: COMPLETA

## BLOCKERS QUE SIGUEN ABIERTOS
- Facturapi API key sandbox: PENDIENTE (crear cuenta)
- Modelo impresora térmica: PENDIENTE (Carlos pendiente confirmar)
- TikTok Shop / Tendly: evaluar si integrar
- SkyDrop API: investigar si tiene API pública

## DECISIONES ARQUITECTÓNICAS TOMADAS
- MLAuthenticator: Integrado en MLAdapter para Fase 1.
- Webhooks: Despacho asíncrono hacia Routers específicos.
- Reintentos: 3 intentos con backoff exponencial y reraise=True.

## TESTS PASSING [7/7]
- core: 2/2 (test_tenant_isolation.py)
- ml_adapter: 5/5 (test_ml_adapter.py)

## NOTAS DE LA ÚLTIMA SESIÓN
- Se completó la integración de Mercado Libre.
- El adaptador maneja correctamente el flujo de OAuth y la lógica de negocio (corte 9 AM, miércoles de pausa).
- Sistema listo para el Handoff a Claude para auditoría de seguridad.
