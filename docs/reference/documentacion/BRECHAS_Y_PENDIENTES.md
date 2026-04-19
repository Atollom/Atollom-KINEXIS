# ANÁLISIS DE BRECHAS Y PENDIENTES — KINEXIS v3.1
> Actualizado: 09 Abril 2026 | CFDI integrado como módulo core

---

## ✅ RESUELTO EN ESTA ACTUALIZACIÓN

### ✅ BRECHA 8: CFDI / Facturación Electrónica — IMPLEMENTADO

El módulo CFDI está completo con los siguientes archivos:

| Archivo | Descripción |
|---|---|
| `specs/cfdi_billing_agent_contract.yaml` | Agent Contract completo con reglas de negocio SAT |
| `src/agents/cfdi_billing_agent.py` | Agente principal: genera, cancela, envía CFDIs |
| `src/adapters/facturapi_adapter.py` | Adapter para Facturapi v2 (PAC) con retry y validación RFC |
| `src/utils/cfdi_migration.sql` | Tablas Supabase con RLS: cfdi_records, cfdi_tenant_config, product_sat_keys |
| `src/utils/cfdi_api_route.ts` | API Route Next.js: POST/GET/DELETE /api/cfdi/generate |

**PAC elegido: Facturapi** — https://www.facturapi.io
- API REST moderna, SDK Python + Node.js
- Sandbox gratuito para pruebas completas
- CFDI 4.0 completo (ComplementoPago 2.0, Comercio Exterior)
- Costo: ~$0.35 MXN por CFDI timbrado
- Costo estimado Kap Tools: ~$35–70 MXN/mes (~$2–4 USD)

**Tipos de CFDI soportados:**
- ✅ Tipo I (Ingreso) — Facturas de venta B2C y B2B
- ✅ Tipo E (Egreso) — Notas de crédito por devoluciones
- ✅ Tipo P (Pago) — Complementos de pago para ventas PPD
- ⏳ Complemento Comercio Exterior — Para exportaciones futuras

**Flujos implementados:**
1. Auto-factura B2B: Sales Agent B2B → cierra venta → CFDI automático
2. Auto-factura órdenes ML/Amazon/Shopify → CFDI si está configurado
3. Manual desde dashboard: operador selecciona orden → genera con un clic
4. Nota de crédito: devolución → CFDI Egreso relacionado al original

**Pasos de configuración pendientes:**
- [ ] Crear cuenta en Facturapi (sandbox gratis)
- [ ] Configurar datos fiscales de Kap Tools en Facturapi
- [ ] Agregar claves SAT a tabla `product_sat_keys` por SKU del catálogo
- [ ] Configurar `cfdi_tenant_config` con RFC, régimen y CP de expedición
- [ ] Crear bucket `cfdi-documents` en Supabase Storage (privado)
- [ ] Agregar variable `CFDI_SERVICE_URL` al .env

---

## 🚨 BRECHAS ACTIVAS

### 🔴 BRECHA 1: AGENT CONTRACTS INCOMPLETOS — CRÍTICO
Solo ~30% de los 42 agentes tienen Specs YAML formales.
Sin Spec, el Validation Agent no puede funcionar.

Prioridad MVP — escribir contracts para:
- [ ] Router Agent
- [ ] Validation Agent #26
- [ ] ML Question Handler
- [ ] WhatsApp Handler
- [ ] Sales Agent B2B
- [ ] Instagram DM Handler
- [ ] Inventory Agent

Template en: `/specs/cfdi_billing_agent_contract.yaml`

---

### 🔴 BRECHA 2: REGISTRO INDAUTOR — CRÍTICO (hacer antes de compartir código)
- [ ] Registrar arquitectura SSO como Obra Literaria
- [ ] Registrar diagramas de 42 agentes como Obra Gráfica
- [ ] Registrar Business Rules YAML como Código Fuente
- [ ] Solicitar marca "Atollom Nexus" ante IMPI (Clase 42)

Estimado: 2–3 semanas. Iniciar esta semana.

---

### 🔴 BRECHA 3: VALIDATION AGENT #26 SIN IMPLEMENTAR — CRÍTICO
El agente más importante no tiene código. Sin él, cualquier bug llega al cliente.

Implementación mínima necesaria:
```python
class ValidationAgent:
    """Lógica DETERMINISTA — No usa LLM para validación core."""
    async def validate(self, agent_output: dict, agent_id: str) -> ValidationResult:
        checks = [
            self.check_price_above_cost(agent_output),
            self.check_json_schema(agent_output, agent_id),
            self.check_rate_limits(agent_id),
            self.check_tenant_isolation(agent_output, self.tenant_id),
        ]
        if any(not c.passed for c in checks):
            return ValidationResult(approved=False, reason=...)
        return ValidationResult(approved=True)
```

---

### 🟠 BRECHA 4: ROUTER SIN ORQUESTACIÓN JERÁRQUICA — ALTO
Router único = cuello de botella con 42 agentes.

Diseño de 4 sub-routers:
```
Router Central
├── EcommerceRouter → ML, Amazon, Shopify
├── MetaRouter → Instagram, WhatsApp, Facebook
├── ERPRouter → Inventory, Procurement, Logistics
└── CRMRouter → Sales, Leads, Accounts
```
Reducción de latencia esperada: 38–46%.
Evaluar: LangGraph vs implementación custom.

---

### 🟠 BRECHA 5: SIN BACKUPS OFF-PLATFORM — ALTO
Supabase tuvo incidente en Feb 2026. Sin backup externo = riesgo real.

Script pendiente (ejecutar semanalmente):
```bash
pg_dump $SUPABASE_DB_URL | gzip | \
  aws s3 cp - s3://kinexis-backups-ext/$(date +%Y%m%d).sql.gz
```

Regla 3-2-1: Supabase + S3 externo + Backblaze B2.

---

### 🟠 BRECHA 6: SIN LLMOPS — ALTO
No hay métricas de calidad de IA. Un agente puede fallar silenciosamente semanas.

Stack: Langfuse (open source) + Sentry + Logtail

Métricas mínimas:
| Métrica | Umbral alerta |
|---|---|
| Rechazos Validation Agent | > 5% en 1h |
| Token hemorrhaging | > 3x promedio |
| Escalamiento rate | > 30% |
| Latencia P95 | > 5 segundos |
| API Error Rate | > 2% |

---

### 🟠 BRECHA 7: FALLBACK DE IA NO IMPLEMENTADO — ALTO
Si Claude API cae, el sistema completo se detiene.

```python
class AIClientWithFallback:
    async def complete(self, messages, system_prompt):
        try:
            return await self.claude.complete(messages, system_prompt)
        except (RateLimitError, APIError):
            return await self.gemini.complete(messages, system_prompt)
        except Exception:
            return self.safe_fallback_response()
```

---

### 🟡 BRECHA 8: SIN MEMORIA PERSISTENTE ENTRE AGENTES — MEDIO
Clientes B2B repiten contexto en cada conversación.

Tabla pendiente:
```sql
CREATE TABLE customer_context (
    tenant_id UUID, customer_id TEXT, platform TEXT,
    summary TEXT, b2b_profile JSONB,
    last_purchases TEXT[], risk_signals TEXT[],
    last_interaction_at TIMESTAMPTZ,
    UNIQUE (tenant_id, customer_id, platform)
);
```

---

### 🟡 BRECHA 9: ONBOARDING AGENT SIN DEFINIR — MEDIO
Objetivo: nuevo cliente configurado en < 30 minutos.

Flujo a codificar:
1. Crear tenant → Conectar APIs (ML, Amazon, Meta) → Importar catálogo
2. Configurar reglas de negocio + **configurar CFDI (RFC, Facturapi)**
3. Test de integración automático → Activar agentes en modo SUPERVISED

---

### 🟡 BRECHA 10: SIN PROTOCOLO DE CRISIS — MEDIO
Sin respuesta automática a crisis de reputación en redes.

| Nivel | Trigger | Acción IA |
|---|---|---|
| 1 | 1 comentario negativo aislado | Responde con empatía < 5 min |
| 2 | 3+ negativos en 1 hora | Notifica humano + pausa ADS |
| 3 | Viral / prensa / queja legal | Desactiva IA completamente |

---

### 🟢 BRECHA 11: SIN PRICE SYNC AGENT — BAJO
Precios diferentes en ML, Amazon, Shopify = chargebacks.

Agente nuevo: `PriceSyncAgent`
- Trigger: cambio en `inventory_cost` → recalcular en todas las plataformas
- Aprobación humana si cambio > 15%
- Fórmulas por plataforma: precio_base × (1 + comision + margen)

---

### 🟢 BRECHA 12: SIN CONTENT STRATEGY INSTAGRAM — BAJO
Instagram Publisher existe pero no hay calendario editorial ni voz de marca.

Reunión pendiente con Felipe Gascón para definir:
- Frecuencia sugerida: 1 Reel/semana + 3 posts + Stories diarias
- Temas por día, voz de marca, hashtags por categoría

---

## 📊 ESTADO GENERAL

| Área | Completitud | Estado |
|---|---|---|
| Arquitectura 42 agentes | 90% | ✅ Diseñado, faltan Specs YAML |
| CFDI / Facturación | 85% | ✅ Código listo, falta configuración |
| E-commerce Core (ML, Amazon) | 70% | 🔄 En progreso |
| CRM (Sales B2B) | 60% | 🔄 En progreso |
| ERP (Inventory, Procurement) | 50% | ⏳ Fase 3 |
| Validation Agent #26 | 15% | 🚨 Urgente |
| LLMOps / Observabilidad | 10% | 🚨 Urgente |
| Backups off-platform | 5% | 🚨 Urgente |
| Registro IP (INDAUTOR) | 0% | 🚨 HACER HOY |
| Onboarding Agent | 20% | ⏳ Pendiente |

---

## 🎯 PRIORIDADES PRÓXIMAS 2 SEMANAS

| # | Acción | Urgencia |
|---|---|---|
| 1 | Iniciar trámite INDAUTOR | 🔴 HOY |
| 2 | Crear cuenta Facturapi sandbox + configurar Kap Tools | 🔴 Esta semana |
| 3 | Cargar claves SAT del catálogo a BD | 🔴 Esta semana |
| 4 | Implementar Validation Agent #26 básico | 🔴 Semana 1 |
| 5 | Escribir Agent Contracts YAML para 7 agentes MVP | 🟠 Semana 1–2 |
| 6 | Setup Langfuse LLMOps | 🟠 Semana 2 |
| 7 | Script pg_dump → S3 automatizado | 🟠 Semana 2 |
| 8 | Orquestación jerárquica del Router | 🟠 Semana 2 |
| 9 | Fallback Gemini implementado | 🟡 Semana 3 |
| 10 | Tabla customer_context + memoria entre agentes | 🟡 Semana 3–4 |
