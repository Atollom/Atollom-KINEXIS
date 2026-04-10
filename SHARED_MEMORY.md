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

## TESTS PASSING [20/20]
- core: 2/2 (test_tenant_isolation.py)
- ml_adapter: 18/18 (test_ml_adapter.py)

PRODUCTION_READY: ml_adapter.py — Claude approved — 18 tests passing — 2026-04-10

## NOTAS DE LA ÚLTIMA SESIÓN (Session 2 — CLAUDE — Hardening)
### SECURITY_FIX aplicados en ml_adapter.py:
1. BLOQUEANTE: client_secret hardcodeado como default de os.getenv() → ELIMINADO.
   Credenciales ahora solo desde Vault via load_credentials(db_client). R4 cumplido.
2. BLOQUEANTE: refresh_token() usaba httpx.AsyncClient() sin timeout → FIJADO a timeout=30s.
3. print() reemplazado por logging con niveles correctos (INFO/WARNING/ERROR).
4. Miércoles 403: seguía llamando raise_for_status() después del print → FIJADO.
   Ahora retorna {"status":"paused"} sin excepción.
5. handle_webhook(): sin validación de firma → AGREGADO verify_webhook_signature() HMAC-SHA256.
6. post_answer(): sin validación de 800 chars → AGREGADO ValueError si supera límite ML.
7. update_stock(): función nueva con validación qty >= 0.
8. Webhook topic desconocido: retornaba string "Unknown Domain" → FIJADO, ahora log WARNING + status=ignored.
9. wait_exponential: era (0.1, 0.1, 1.0) efectivamente instantáneo → FIJADO a (2s→4s→8s).

### Nuevos tests agregados (13 nuevos sobre 5 de Gemini):
- test_no_token_en_logs (security)
- test_vault_falla_gracefully
- test_vault_get_secret_falla_propaga_error
- test_webhook_firma_invalida_rechazada
- test_webhook_firma_valida_aceptada
- test_webhook_unknown_topic_ignorado
- test_token_expirado_refresh_falla_tres_veces_escala
- test_credentials_no_cargadas_bloquean_refresh
- test_rate_limit_ml_429_agota_reintentos
- test_post_answer_supera_800_chars_bloqueado
- test_post_answer_exactamente_800_chars_permitido
- test_update_stock_qty_negativo_bloqueado
- test_update_stock_qty_cero_permitido

## SIGUIENTE TAREA
[HANDOFF→GEMINI] Construir ml_question_handler_agent.py (Agente #2)
Contexto para Gemini:
- Hereda de BaseAgent
- Recibe payload de EcommerceRouter con pregunta de ML
- Usa MLAdapter.get_questions() y MLAdapter.post_answer()
- Manejo especial de reclamos de ácidos (ver KB: youtu.be/9nINypdi-6w / youtu.be/pV_I49L6J2o)
- Respuesta máx 800 chars (ya validada en MLAdapter)
- Agent Contract YAML requerido en /specs/ antes de codificar
