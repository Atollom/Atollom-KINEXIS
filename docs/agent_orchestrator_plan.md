# Samantha Agent Orchestrator — Plan Día 2

**Fecha**: 2026-04-28  
**Autor**: Carlos Cortés (Atollom Labs)  
**Estado**: Plan aprobado, listo para implementar

---

## 1. Situación Actual (Día 1 ✅)

```
Usuario → Samantha (LLM) → Respuesta conversacional
                ↓
         Memoria persistente (psycopg2)
```

Samantha responde bien conversacionalmente y recuerda contexto, pero **no ejecuta acciones reales**. Si el usuario dice "genera una cotización", Samantha explica cómo hacerlo en lugar de hacerlo.

---

## 2. Objetivo Día 2

```
Usuario → Samantha → Intent Classifier → Agent.execute() → Respuesta accionable
                ↓                               ↓
         Memoria persistente          Validación (Agent 26)
```

Samantha debe detectar cuándo el usuario quiere una **acción** (no solo información) y delegar al agente correcto, retornando el resultado formateado.

---

## 3. Catálogo de Agentes

**Total**: 26 agentes  
**Ver**: `backend/src/agents/manifest.json`

| Dominio    | Agentes | IDs                                      |
|------------|---------|------------------------------------------|
| Core       | 2       | 00 Guardian, 26 Validation               |
| E-commerce | 6       | 01 ML, 02 Amazon FBA, 03 Shopify, 06 Pricing, 14 Returns, 27 ML Questions |
| ERP        | 7       | 05 Inventory, 13 CFDI, 16 Suppliers, 18 Finance, 24 Thermal, 25 Shipping, 30 POs |
| CRM        | 6       | 04 B2B, 19 NPS, 31 Lead Scorer, 32 Quotes, 33 Follow-up, 37 Tickets |
| Meta       | 5       | 12 Ads, Content Publisher, WhatsApp, Instagram, Facebook |

---

## 4. Análisis de Patrones de Supervisor

### Opción A: LangGraph Supervisor (oficial)

```
LangGraph → SupervisorNode → [AgentNode1, AgentNode2, ...]
```

**Pros**: Patrón oficial, bien documentado, composable, soporte para parallel agents  
**Contras**: Nueva dependencia (~50MB), curva de aprendizaje, overkill para routing simple, requiere refactor de todos los agentes al formato LangGraph  
**Tiempo**: 16-20 horas de implementación

### Opción B: Custom Router con Gemini (LLM puro)

```
Gemini → JSON {intent, agent_id, args} → agent.execute(args)
```

**Pros**: Sin nuevas dependencias, total control, ya tenemos Gemini  
**Contras**: Más frágil si el LLM malinterpreta; sin retry automático  
**Tiempo**: 6-8 horas

### Opción C: Hybrid — Regex fast-path + Gemini fallback ✅ RECOMENDADO

```
Query → Regex patterns (Guardian logic) → known intent → agent.execute()
              ↓ (no match)
         Gemini structured extraction → JSON intent → agent.execute()
              ↓ (ambiguous / conversational)
         Samantha LLM normal (respuesta conversacional)
```

**Pros**:
- Regex es O(1), sin latencia extra para intents obvios ("stock bajo", "genera factura")
- Gemini entra solo cuando regex no alcanza
- Sin dependencias nuevas
- Reutiliza Guardian's patterns ya probados
- Fácil de agregar agentes nuevos (solo agregar triggers al manifest)
- Fallo gracioso: si el agente falla, Samantha responde conversacionalmente

**Contras**:
- Regex needs maintenance as triggers evolve (mitigado por manifest.json centralizado)

**Tiempo estimado**: 8-10 horas  
**Complejidad**: Media

---

## 5. Arquitectura Detallada (Opción C)

### 5.1 Flujo completo

```
1. Request llega a /api/samantha/chat
2. Router carga memoria (existente ✅)
3. IntentClassifier.classify(query, context) → IntentResult
   a. Regex scan del manifest triggers → fast match
   b. Si no match → Gemini con structured_output=True → JSON {agent_id, args}
   c. Si score < threshold → "conversational" (no agent)
4. Si intent.agent_id:
   a. Cargar AgentClass desde módulo
   b. agent.execute({...args, tenant_id})
   c. Agent26Validation.execute(agent_response)
   d. Formatear resultado como respuesta conversacional de Samantha
5. Si conversational: llamar SamanthaCore.query() (existente ✅)
6. Guardar memoria si acción ejecutada
```

### 5.2 Módulo nuevo: `IntentClassifier`

```python
# backend/src/agents/samantha/intent_classifier.py

@dataclass
class IntentResult:
    agent_id: str | None      # None = conversational
    confidence: float          # 0.0 - 1.0
    args: dict                 # extracted args for agent.execute()
    method: str                # "regex" | "llm" | "conversational"

class IntentClassifier:
    def __init__(self, manifest: dict):
        self._triggers = self._build_trigger_index(manifest)

    def classify(self, query: str, context: dict) -> IntentResult:
        # 1. Regex fast-path
        result = self._regex_match(query)
        if result.confidence >= 0.85:
            return result

        # 2. Gemini structured extraction
        return await self._llm_classify(query, context)
```

### 5.3 Módulo nuevo: `AgentDispatcher`

```python
# backend/src/agents/samantha/dispatcher.py

class AgentDispatcher:
    def __init__(self, manifest: dict):
        self._registry = self._load_agents(manifest)

    async def dispatch(
        self,
        intent: IntentResult,
        tenant_id: str,
    ) -> dict:
        agent = self._registry[intent.agent_id]
        raw = await agent.execute({**intent.args, "tenant_id": tenant_id})
        validated = await self._validator.execute({"agent_response": raw})
        return validated

    def format_as_samantha_response(self, agent_result: dict, query: str) -> str:
        # Gemini convierte result dict → texto conversacional natural
        ...
```

### 5.4 Modificación a `SamanthaCore.query()`

```python
async def query(self, message, tenant_id, context, history) -> str:
    # 1. Classify intent
    intent = self._classifier.classify(message, context)

    # 2. If agent intent → dispatch
    if intent.agent_id:
        result = await self._dispatcher.dispatch(intent, tenant_id)
        return self._dispatcher.format_as_samantha_response(result, message)

    # 3. Else → LLM conversational (existing path)
    system = _build_system_prompt(context)
    return await self._provider.generate(system, history, message)
```

---

## 6. Agentes Prioritarios Día 2 (Top 7)

Criterio: frecuencia de uso esperada × complejidad de args × valor para el cliente piloto.

| Prioridad | Agente | Ejemplo de query |
|-----------|--------|-----------------|
| 1 | `agent_05_inventory_monitor` | "¿Cuánto stock tiene TAL-003?" |
| 2 | `agent_18_finance_snapshot` | "Dame el reporte financiero del mes" |
| 3 | `agent_32_quote_generator` | "Cotización para ABC: 50 taladros a $450" |
| 4 | `agent_13_cfdi_billing` | "Factura para RFC ABC010101AAA por $5,000" |
| 5 | `agent_33_follow_up` | "¿Qué leads necesitan seguimiento?" |
| 6 | `agent_27_ml_questions` | "Responde las preguntas de ML pendientes" |
| 7 | `agent_06_price_manager` | "Actualiza precio TAL-003 a $450 en todos los canales" |

---

## 7. Archivos a Crear

```
backend/src/agents/samantha/
├── intent_classifier.py   # Regex + LLM intent extraction
├── dispatcher.py          # Agent loader + executor + formatter
└── manifest.json          # Ya existe en src/agents/manifest.json (symlink o import)

backend/tests/
└── test_intent_classifier.py  # Unit tests sin red
```

**Archivos a modificar**:
- `backend/src/agents/samantha/core.py` — integrar classifier + dispatcher en `query()`
- `backend/src/routers/samantha_router.py` — pasar `tenant_id` correctamente (ya está)

---

## 8. Estimación de Tiempo

| Tarea | Horas |
|-------|-------|
| `intent_classifier.py` (regex + Gemini structured) | 2h |
| `dispatcher.py` (agent loader + formatter) | 2h |
| Integrar en `core.py` | 1h |
| Tests unitarios | 1h |
| QA: probar top 7 agentes con Samantha | 2h |
| **Total** | **8 horas** |

---

## 9. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Gemini extrae args incorrectos | Validación de schema antes de execute(); fallback a conversacional |
| Agente falla (excepción) | try/except → Samantha responde "No pude completar esa acción, intenta de nuevo" |
| Intent ambiguo (stock vs inventario ERP vs ecommerce) | Classifier pide aclaración vía `IntentResult(agent_id=None, clarification="¿Te refieres a inventario de almacén o stock en ML?")` |
| Demasiados agentes para un solo query | Dispatcher soporta `agent_ids: list` para parallel dispatch (Fase 3) |

---

## 10. Decisión Final

**Patrón**: Hybrid (Opción C)  
**Dependencias nuevas**: Ninguna  
**Tiempo**: 8 horas  
**Complejidad**: Media  
**Primer agente a integrar**: `agent_05_inventory_monitor` (args simples, alta frecuencia)

```bash
# Comando de inicio Día 2
git checkout -b feat/agent-orchestrator
# Crear intent_classifier.py → dispatcher.py → integrar en core.py → tests → merge
```
