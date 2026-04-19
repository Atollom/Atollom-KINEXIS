# KINEXIS — Arquitectura del Sistema

**Versión**: 1.0  
**Fecha**: 2026-04-20  
**Autor**: Carlos Cortés (Atollom Labs)  
**Decisión Humana**: Arquitectura de 43 agentes especializados orquestados por Samantha (cerebro ejecutor)

---

## 1. Visión General

KINEXIS es una plataforma empresarial SaaS multi-tenant que unifica tres sistemas críticos:

- **E-commerce Omnicanal**: Mercado Libre + Amazon + Shopify
- **CRM Omnicanal**: WhatsApp + Instagram + Facebook + Pipeline de Ventas
- **ERP Fiscal**: CFDI 4.0 + Contabilidad + Finanzas + Inventario + Compras

Potenciado por **Samantha** (cerebro ejecutor central) que orquesta **43 agentes de IA especializados**.

---

## 2. Principio de Diseño: Cerebro + Herramientas Especializadas

### Decisión Arquitectónica (Carlos Cortés — 13 abril 2026)

**Problema**: LLMs monolíticos tienden a "alucinar" cuando manejan múltiples dominios complejos.

**Solución**:
- **Samantha** = Cerebro central (comprende, decide, ejecuta, aprende)
- **43 Agentes** = Herramientas especializadas (cada uno experto en UNA tarea)

**Analogía**: Samantha es el director de orquesta, los 43 agentes son los músicos especializados.

**Ejemplo**:
- ❌ **Mal**: 1 agente "E-commerce" maneja ML + Amazon + Shopify + Precios + Devoluciones
- ✅ **Bien**: Samantha coordina:
  - Agente #1: Solo Mercado Libre Fulfillment
  - Agente #2: Solo Amazon FBA
  - Agente #3: Solo Shopify Fulfillment
  - Agente #6: Solo Price Management
  - Agente #14: Solo Returns

**Beneficios**:
- ✅ Menos alucinaciones (contexto reducido por agente)
- ✅ Respuestas más precisas (agente experto)
- ✅ Fácil debuggear (aislar agente problemático)
- ✅ Escalable (agregar agente sin romper existentes)
- ✅ Samantha aprende patrones del usuario

---

## 3. Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                 ENTRADA (Multi-canal)                       │
│  WhatsApp • Instagram • Facebook • Dashboard • API          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      SAMANTHA                               │
│              (Cerebro Ejecutor Central)                     │
│                                                             │
│  • Comprende intención (NLP — Claude Sonnet 4)             │
│  • Mantiene contexto conversacional (Redis)                │
│  • Decide qué agentes llamar y en qué orden                │
│  • Orquesta workflows multi-agente                         │
│  • Valida permisos RBAC + RLS                              │
│  • Ejecuta acciones complejas                              │
│  • Aprende preferencias del usuario                        │
│  • Sugiere acciones proactivas                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
          ┌──────────────────┐  ┌──────────────────┐
          │  Guardian #0     │  │ Validation #26   │
          │  (Router)        │  │ (Verificador)    │
          │                  │  │                  │
          │ • Clasifica      │  │ • Anti-          │
          │   intención      │  │   alucinación    │
          │ • Valida tenant  │  │ • Fact-checking  │
          │ • Enruta         │  │ • Compliance     │
          └──────────────────┘  └──────────────────┘
                    ↓
        ┌───────────┼───────────┬──────────┐
        ↓           ↓           ↓          ↓
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  E-commerce  │ │   ERP    │ │   CRM    │ │   Meta   │
│   Router     │ │  Router  │ │  Router  │ │  Router  │
│              │ │          │ │          │ │          │
│  7 agentes   │ │7 agentes │ │5 agentes │ │4 agentes │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘
        ↓           ↓           ↓          ↓

┌──────────────────────────────────────────────────────┐
│              AGENTES ESPECIALIZADOS                  │
├──────────────────────────────────────────────────────┤
│ E-commerce: #1 ML Fulfill, #2 AMZ FBA, #3 Shopify,  │
│             #6 Price Mgr, #14 Returns, #27 ML Q&A   │
│                                                      │
│ ERP: #5 Inventory, #13 CFDI, #16 Suppliers,         │
│      #18 Finance, #24 Printer, #25 Shipping,        │
│      #30 Purchase Orders                             │
│                                                      │
│ CRM: #4 B2B Leads, #19 NPS, #31 Scorer,             │
│      #32 Quotes, #33 Follow-up, #37 Support         │
│                                                      │
│ Meta: WA, IG, FB, Content, #12 Ads                  │
└──────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SALIDA (Multi-canal)                     │
│  WhatsApp • Dashboard • Email • Webhooks • API              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Samantha: Cerebro Central Ejecutor

### 4.1 Definición

Samantha **NO** es solo una interfaz conversacional — es el cerebro orquestador que ejecuta acciones reales en el sistema.

**Diferencia clave**:

| Sistema | Capacidad |
|---|---|
| ChatGPT / Copilot | Sugieren qué hacer, no lo ejecutan |
| Samantha KINEXIS | Comprende, decide **Y** ejecuta acciones reales |

### 4.2 Componentes de Samantha

```
┌─────────────────────────────────────────┐
│         SAMANTHA — Arquitectura         │
├─────────────────────────────────────────┤
│ 1. NLP Engine (Claude Sonnet 4)        │
│    - Comprensión de intención           │
│    - Extracción de entidades            │
│    - Análisis de sentimiento            │
├─────────────────────────────────────────┤
│ 2. Context Manager (Redis)              │
│    - Memoria de conversación            │
│    - Historial por usuario              │
│    - Preferencias aprendidas            │
├─────────────────────────────────────────┤
│ 3. Agent Orchestrator                   │
│    - Decide qué agentes llamar          │
│    - Ejecuta secuencias paralelas       │
│    - Maneja errores y rollbacks         │
├─────────────────────────────────────────┤
│ 4. Permission Validator                 │
│    - RBAC por usuario                   │
│    - RLS por tenant                     │
│    - Audit logging                      │
├─────────────────────────────────────────┤
│ 5. Response Generator                   │
│    - Formato conversacional             │
│    - Sugerencias proactivas             │
│    - Quick actions inline               │
└─────────────────────────────────────────┘
```

### 4.3 Capacidades de Samantha

#### Nivel 1: Consultas Simples

```
Usuario: "¿Cuánto vendí hoy?"

Samantha:
1. Identifica módulo: E-commerce
2. Ejecuta query: SELECT SUM(total) FROM orders WHERE date=today AND tenant_id=X
3. Responde: "$45,280 MXN en todos los canales"
```

#### Nivel 2: Acciones Complejas

```
Usuario: "Genera factura del pedido #123"

Samantha:
1. Valida: ¿Pedido existe? ✅
2. Valida: ¿Usuario tiene permiso (owner/contador)? ✅
3. Llama Agente #13 (CFDI Billing) → genera XML timbrado
4. Llama Agente #24 (Thermal Printer) → genera PDF
5. Envía PDF por email al cliente
6. Actualiza status pedido a "facturado"
7. Registra en audit log
8. Responde: "✅ Factura F-2026-042 enviada a cliente@empresa.com"
```

#### Nivel 3: Workflows Multi-Agente

```
Usuario: "Procesa la devolución del cliente Juan"

Samantha:
1. Llama CRM → busca cliente "Juan"
2. Encuentra: Juan Pérez (3 órdenes recientes)
3. Pregunta: "¿Cuál producto quieres devolver?
   - Taladro Black+Decker ($890) — 5 días
   - Sierra circular ($1,240) — 12 días
   - Compresor ($2,100) — 3 días"
4. Usuario: "El taladro"
5. Llama #14 (Returns Manager) → valida política (dentro de 15 días ✅)
6. Llama #5 (Inventory Monitor) → suma 1 unidad a stock
7. Llama #18 (Finance Snapshot) → genera nota de crédito $890
8. Llama WA Agent → envía mensaje: "Devolución aprobada. Reembolso en 3-5 días"
9. Responde: "✅ Devolución procesada. NC-2026-015 generada ($890)"
```

#### Nivel 4: Proactividad (Sin que pregunten)

Samantha monitorea constantemente:

```
⚠️ Stock bajo detectado:
"SKU-001 tiene 5 unidades (mínimo: 20).
¿Genero orden de compra automática?"

⚠️ Factura vencida:
"Cliente Distribuidora XYZ debe $10,000 desde hace 15 días.
¿Le envío recordatorio de pago?"

💡 Oportunidad perdida:
"Lead 'Ferretería Central' no ha respondido en 7 días.
¿Le hago follow-up automático?"

🚨 Patrón anormal:
"Ventas en Mercado Libre bajaron 40% vs semana pasada.
Posible causa: 3 productos sin stock."
```

#### Nivel 5: Aprendizaje Continuo

Samantha aprende de cada interacción:

```
Usuario siempre pide reportes en Excel (no PDF)
→ Samantha: Próxima vez ofrece Excel por default

Usuario genera facturas viernes 4pm
→ Samantha: Viernes 3:30pm pregunta: "¿Genero facturas de la semana?"

Cliente específico siempre paga a 30 días
→ Samantha: Al crear cotización, sugiere "Pago: 30 días" automático

Pedidos >$50,000 requieren aprobación del dueño
→ Samantha: Si agente intenta facturar, bloquea y notifica al dueño
```

### 4.4 Ejemplo Completo: Flujo de Decisión

**Comando**: `"Samantha, crea orden de compra para 100 unidades de SKU-001"`

```
┌─ FASE 1: COMPRENSIÓN ─────────────────────────────┐
│ NLP Engine analiza:                               │
│ - Acción: crear_orden_compra                      │
│ - Cantidad: 100 unidades                          │
│ - Producto: SKU-001                               │
│ - Módulo: ERP > Compras                           │
│ - Urgencia: No especificada                       │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 2: VALIDACIÓN ──────────────────────────────┐
│ Permission Validator verifica:                    │
│ ✅ Usuario tiene rol 'owner' o 'contador'         │
│ ✅ Producto SKU-001 existe en catálogo            │
│ ✅ No hay orden de compra pendiente del mismo SKU │
│ ✅ Tenant activo (no suspendido)                  │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 3: CONTEXTO ────────────────────────────────┐
│ Context Manager revisa:                           │
│ - Stock actual: 23 unidades                       │
│ - Stock mínimo: 20 unidades                       │
│ - Ventas promedio: 15 u/semana                    │
│ - Última OC: Hace 3 semanas (Proveedor B)        │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 4: DECISIÓN ────────────────────────────────┐
│ Agent Orchestrator planea:                        │
│ 1. Llamar #5 (Inventory) → stock actual           │
│ 2. Llamar #16 (Supplier Eval) → mejor proveedor   │
│ 3. Evaluar urgencia                               │
│ 4. Llamar #30 (Purchase Orders) → generar OC      │
│ 5. Llamar #26 (Validation) → verificar            │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 5: EJECUCIÓN ───────────────────────────────┐
│ Step 1 — Agente #5 (Inventory Monitor):          │
│   → Stock actual: 23 unidades                     │
│   → Stock mínimo: 20 unidades                     │
│   → Conclusión: No urgente (sobre el mínimo)      │
│                                                   │
│ Step 2 — Agente #16 (Supplier Evaluator):        │
│   → Proveedor A:                                  │
│     • Precio: $45/unidad                          │
│     • Entrega: 5 días                             │
│     • Rating: 4.8/5                               │
│   → Proveedor B:                                  │
│     • Precio: $42/unidad                          │
│     • Entrega: 15 días                            │
│     • Rating: 4.2/5                               │
│                                                   │
│ Step 3 — Samantha DECIDE:                         │
│   - No urgente (stock 23 > mínimo 20)            │
│   - Ahorro: $300 (100 u × $3 diferencia)         │
│   - 15 días OK (stock dura 4 semanas)            │
│   → Decisión: Proveedor B (mejor costo-beneficio)│
│                                                   │
│ Step 4 — Agente #30 (Purchase Orders):           │
│   → OC-2026-042 generada:                         │
│     • 100 unidades SKU-001                        │
│     • Proveedor: Distribuidora B                  │
│     • Precio unitario: $42 MXN                    │
│     • Total: $4,200 MXN                           │
│     • Entrega estimada: 5 mayo 2026              │
│                                                   │
│ Step 5 — Agente #26 (Validation):                │
│   ✅ OC válida (formato correcto)                 │
│   ✅ Precio dentro de rango histórico ($40-$48)  │
│   ✅ Proveedor en lista aprobados                 │
│   ✅ Cantidad razonable vs histórico              │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 6: RESPUESTA ───────────────────────────────┐
│ Response Generator formatea:                      │
│                                                   │
│ "✅ Orden de compra OC-2026-042 creada            │
│                                                   │
│  📦 100 unidades SKU-001 (Taladro Inalámbrico)   │
│  💰 $4,200 MXN total                              │
│  🏭 Proveedor: Distribuidora B                    │
│  📅 Entrega estimada: 5 mayo 2026                │
│                                                   │
│  ℹ️ Elegí Proveedor B (ahorro $300 vs A)          │
│     Tienes stock suficiente para esperar 15 días  │
│                                                   │
│  ¿Quieres que envíe la OC al proveedor ahora?"   │
└───────────────────────────────────────────────────┘
                    ↓
┌─ FASE 7: APRENDIZAJE ─────────────────────────────┐
│ Context Manager guarda:                           │
│ - Usuario prefiere ahorro vs rapidez              │
│ - Para SKU-001 siempre usar Proveedor B          │
│ - Órdenes de compra: confirmar antes de enviar   │
└───────────────────────────────────────────────────┘
```

### 4.5 Diferencia con Otros Asistentes IA

| Característica | ChatGPT / Copilot | Samantha KINEXIS |
|---|---|---|
| Contexto | Conversación actual únicamente | Historial completo empresa + usuario |
| Acciones | Sugiere qué hacer | EJECUTA acciones reales en el sistema |
| Datos | Conocimiento genérico | Datos reales de TU empresa (multi-tenant) |
| Permisos | No valida | RBAC + RLS estricto por usuario/tenant |
| Aprendizaje | Modelo general | Personalizado por usuario y empresa |
| Proactividad | Solo responde | Alertas y sugerencias automáticas |
| Integraciones | No ejecuta | 43 agentes + ML/Amazon/Shopify/SAT/WhatsApp |
| Memoria | Resetea cada sesión | Persistente (Redis + PostgreSQL) |
| Ejecución | Código sugerido | Transacciones reales en BD + APIs externas |

**Ejemplo comparativo**:

```
Usuario: "Genera factura del pedido #123"

ChatGPT:
"Para generar una factura en KINEXIS:
 1. Ve al módulo ERP
 2. Click en CFDI / SAT
 3. Click en 'Generar Factura'
 4. Ingresa número de pedido: 123
 ..."

Samantha KINEXIS:
[Ejecuta inmediatamente]
"✅ Factura F-2026-042 generada y enviada a cliente@empresa.com
 UUID: A1B2C3D4-E5F6-7890-ABCD-1234567890AB
 PDF adjunto ⬇️"
```

---

## 5. Inventario de 43 Agentes Especializados

### 5.1 Agentes E-commerce (7)

| ID | Nombre | Responsabilidad Específica | Entrada | Salida | Llamado por |
|---|---|---|---|---|---|
| #1 | ML Fulfillment | Cumplir órdenes Mercado Libre | Orden ML JSON | Status envío + tracking | Samantha, Cron |
| #2 | Amazon FBA Manager | Gestionar Amazon FBA | Orden Amazon XML | Tracking FBA | Samantha, Cron |
| #3 | Shopify Fulfillment | Despachar órdenes Shopify | Orden Shopify JSON | Confirmación + label | Samantha, Cron |
| #6 | Price Manager ×3 | Actualizar precios en 3 canales | SKU + precio base | Precio ML/AMZ/Shopify | Samantha, Scheduler |
| #14 | Returns Manager | Gestionar devoluciones multicanal | Solicitud devolución | Autorización + RMA | Samantha, Webhook |
| #27 | ML Questions Handler | Responder preguntas ML automático | Pregunta ML | Respuesta automática | Webhook ML |

### 5.2 Agentes ERP (7)

| ID | Nombre | Responsabilidad Específica | Entrada | Salida | Llamado por |
|---|---|---|---|---|---|
| #5 | Inventory Monitor | Alertar stock bajo + sugerir reorden | Movimientos inventario | Alerta + sugerencia OC | Samantha, Cron |
| #13 | CFDI Billing | Generar facturas CFDI 4.0 SAT-compliant | Datos venta + RFC | XML timbrado + PDF | Samantha |
| #16 | Supplier Evaluator | Evaluar proveedores (precio/tiempo/calidad) | Historial compras | Score calidad + recomendación | Samantha, #30 |
| #18 | Finance Snapshot | Reporte financiero (CxC, CxP, cashflow) | Período + filtros | Dashboard financiero | Samantha, Scheduler |
| #24 | Thermal Printer | Imprimir etiquetas/tickets (ZPL/PDF) | Orden + formato | PDF/ZPL para impresora | Samantha, #1, #3 |
| #25 | Skydrop Shipping | Generar guías Skydropx | Dirección + paquetería | Guía PDF + tracking | Samantha, #1 |
| #30 | Purchase Orders | Crear órdenes de compra automáticas | Necesidad + proveedor | OC generada + envío email | Samantha, #5 |

### 5.3 Agentes CRM (6)

| ID | Nombre | Responsabilidad Específica | Entrada | Salida | Llamado por |
|---|---|---|---|---|---|
| #4 | B2B Collector | Captar y calificar leads B2B | Interacción web/chat | Lead calificado + score | Samantha, Form webhook |
| #19 | NPS Collector | Medir satisfacción (NPS) post-venta | Encuesta + respuesta | Score NPS + insights | Samantha, Cron |
| #31 | Lead Scorer | Puntuar leads automático (ML model) | Lead data + behavior | Score 0-100 + prioridad | Samantha, #4 |
| #32 | Quote Generator | Generar cotizaciones profesionales PDF | Productos + cliente | PDF cotización branded | Samantha |
| #33 | Follow-up | Seguimiento automático leads inactivos | Lead + días inactivo | Mensaje follow-up | Cron, Samantha |
| #37 | Support Tickets | Atender tickets soporte (clasificar + responder) | Ticket | Respuesta + clasificación | Samantha, Email webhook |

### 5.4 Agentes Meta (5)

| ID | Nombre | Responsabilidad Específica | Entrada | Salida | Llamado por |
|---|---|---|---|---|---|
| WA | WhatsApp Agent | Gestionar mensajes WhatsApp Business | Mensaje WA | Respuesta WA | Webhook Meta |
| IG | Instagram Agent | Gestionar DMs Instagram | DM IG | Respuesta IG | Webhook Meta |
| FB | Facebook Agent | Gestionar Messenger | Mensaje FB | Respuesta FB | Webhook Meta |
| #12 | Ads Manager | Gestionar anuncios Meta (crear/pausar/optimizar) | Campaña + objetivo | Status ads + métricas | Samantha |
| Content | Content Publisher | Publicar contenido programado (posts/stories) | Post + horario | Publicado + analytics | Scheduler |

### 5.5 Agentes Transversales (2)

| ID | Nombre | Responsabilidad Específica | Entrada | Salida | Llamado por |
|---|---|---|---|---|---|
| #0 | Guardian Router | Enrutar cada request al agente/router correcto | Query + contexto | Agente target + params | Samantha (siempre) |
| #26 | Validation | Validar respuestas (anti-alucinación + compliance) | Respuesta agente | Validada ✅ / Rechazada ❌ | Samantha (siempre) |

**Total: 7 + 7 + 6 + 5 + 2 = 27 definidos arriba + 16 especializados adicionales = 43 agentes**

---

## 6. Flujo de Datos: Casos de Uso Reales

### Caso 1: Consulta Simple

```
Usuario (WhatsApp): "¿Cuánto vendí hoy en Mercado Libre?"

1. ENTRADA → Samantha recibe vía WA Agent
2. Samantha → NLP Engine analiza:
   - Módulo: E-commerce
   - Canal: Mercado Libre
   - Métrica: Ventas total
   - Período: Hoy
3. Samantha → Guardian #0 → E-commerce Router
4. E-commerce Router → Query directo a BD:
   SELECT SUM(total) FROM orders
   WHERE channel='ML' AND date='2026-04-20' AND tenant_id='orthocardio'
5. Resultado: $45,280 MXN
6. Validation #26 → Verifica rango razonable ✅
7. Samantha → Response Generator:
   "Hoy has vendido $45,280 MXN en Mercado Libre 🎉
    26% más que ayer ($35,890)"
8. SALIDA → WhatsApp mensaje formateado
```

### Caso 2: Acción Compleja Multi-Agente

```
Usuario (Dashboard): "Samantha, procesa el pedido #456"

1. Samantha → Comprende "procesar" = fulfillment completo
2. Samantha → Query BD: SELECT * FROM orders WHERE id=456
   Resultado:
   - Cliente: Ferretería Central
   - Productos: 3 SKUs (taladro, sierra, compresor)
   - Canal: Shopify
   - Pago: Confirmado ✅
   - Dirección: Completa ✅
3. Samantha → Decide workflow:
   a) Verificar stock (Agente #5)
   b) Generar guía envío (Agente #25)
   c) Generar factura (Agente #13)
   d) Marcar como despachado (Agente #3)
   e) Notificar cliente (WA Agent)

4. EJECUCIÓN PARALELA:

   Thread 1 — Agente #5 (Inventory):
   → Stock taladro: 15 ✅
   → Stock sierra: 8 ✅
   → Stock compresor: 2 ⚠️ (bajo, sugiere reorden)
   → Descuenta stock de almacén principal

   Thread 2 — Agente #25 (Shipping):
   → Calcula peso total: 12.5 kg
   → Selecciona paquetería: Estafeta (entrega 2 días)
   → Genera guía PDF + tracking: EST-2026-042

   Thread 3 — Agente #13 (CFDI):
   → Obtiene RFC cliente
   → Genera CFDI 4.0
   → Timbra en FacturAPI
   → UUID: A1B2C3D4-E5F6-7890-ABCD-1234567890AB
   → PDF generado

5. Validation #26 → Verifica:
   ✅ Stock descontado correctamente
   ✅ Guía válida
   ✅ CFDI timbrado sin errores

6. Samantha → Agente #3 (Shopify Fulfillment):
   → Actualiza status Shopify: "Despachado"
   → Agrega tracking number

7. Samantha → WA Agent:
   → Envía mensaje a cliente:
   "✅ Tu pedido #456 ha sido despachado
    🚚 Tracking: EST-2026-042
    📦 Entrega estimada: 22 abril
    📄 Factura adjunta"

8. Samantha → Response Generator:
   "✅ Pedido #456 procesado completamente

    📦 3 productos despachados
    🚚 Guía: EST-2026-042 (Estafeta)
    📄 Factura: F-2026-089 timbrada
    📱 Cliente notificado vía WhatsApp

    ⚠️ Nota: Compresor tiene stock bajo (2 unidades)
    ¿Generar orden de compra automática?"

9. SALIDA → Dashboard muestra resumen completo
```

### Caso 3: Workflow Proactivo (Sin intervención humana)

```
TRIGGER: Cron job diario 8:00 AM

Samantha ejecuta rutina matutina:

1. Agente #5 (Inventory Monitor):
   → Detecta: 5 SKUs bajo stock mínimo
   → Lista: SKU-001 (5/20), SKU-045 (3/15), ...

2. Samantha DECIDE por cada SKU:

   SKU-001 (crítico — solo 5 unidades):
   → Llama #16 (Supplier Eval) → Mejor proveedor: Distribuidor A
   → Llama #30 (Purchase Orders) → Genera OC-2026-043
   → Notifica dueño: "⚠️ Stock crítico SKU-001. OC creada automáticamente"

   SKU-045 (medio — 3/15):
   → Solo alerta al almacenista
   → No crea OC (todavía hay margen)

3. Agente #19 (NPS Collector):
   → Identifica 12 ventas completadas hace 7 días
   → Envía encuestas NPS automáticas vía WhatsApp

4. Agente #33 (Follow-up):
   → Detecta 3 leads sin contacto hace >5 días
   → Envía mensajes follow-up personalizados

5. Agente #18 (Finance Snapshot):
   → Genera reporte diario:
     • Ventas ayer: $87,450
     • CxC vencidas: $23,100 (3 clientes)
     • CxP próximas: $45,000 (vence en 5 días)
   → Envía email al contador

6. Samantha → Notificación al dueño:
   "☀️ Buenos días. Resumen de la noche:

    ✅ 1 orden de compra creada (stock crítico)
    📊 12 encuestas NPS enviadas
    💬 3 leads con follow-up automático
    💰 Reporte financiero enviado al contador

    ⚠️ 3 clientes con CxC vencidas (total: $23,100)
    ¿Quieres que les envíe recordatorio de pago?"
```

---

## 7. Stack Tecnológico

### 7.1 Backend (API + Agentes)

**Runtime**:
- Node.js 20.x (API Gateway, routers)
- Python 3.11 (agentes especializados)

**Frameworks**:
- Express.js (routing HTTP)
- FastAPI (agentes Python)

**IA / ML**:
- Anthropic Claude Sonnet 4 (Samantha brain + agentes principales)
- Google Gemini 2.5 Flash Lite (validación rápida, clasificación)
- OpenAI Embeddings (búsqueda semántica, vectores)

**Deploy**:
- Railway (`https://atollom-kinexis-production.up.railway.app`)
- Auto-scaling: 1–8 instancias según carga
- Region: US East (latencia óptima México)

### 7.2 Frontend (Dashboard)

**Framework**:
- Next.js 14 App Router
- React 18 Server Components

**Styling**:
- Tailwind CSS 3.4
- Glassmorphism custom (blur + gradients)
- Framer Motion (animaciones)

**Auth**:
- Supabase Auth (JWT tokens)
- Row Level Security (RLS)
- Refresh tokens automáticos

**Deploy**:
- Vercel (`https://dashboard.atollom.com`)
- Edge Functions (middleware)
- CDN global (Cloudflare)

### 7.3 Base de Datos

**Primaria**:
- PostgreSQL 15 (Supabase)
- Schema: Multi-tenant (`tenant_id` en todas las tablas)
- RLS policies por tenant
- Connection pooling (Supavisor)

**Cache**:
- Redis 7 (Railway)
- Sesiones Samantha
- Rate limiting
- TTL: 1 hora (conversaciones), 5 min (queries)

**Storage**:
- Supabase Storage (S3-compatible)
- Buckets por tenant
- PDFs, imágenes, archivos adjuntos

### 7.4 Integraciones Externas

**E-commerce**:
- Mercado Libre API v2 (OAuth 2.0)
- Amazon MWS (Marketplace Web Service)
- Shopify Admin API (GraphQL)

**Mensajería**:
- WhatsApp Business API (Meta Cloud)
- Instagram Graph API
- Facebook Graph API

**Fiscal (México)**:
- FacturAPI (CFDI 4.0 timbrado)
- SAT Web Services (validación)
- Banxico API (tipo de cambio)

**Logística**:
- Skydropx API (guías envío)
- Estafeta, DHL, FedEx (tracking)

**Pagos**:
- Stripe (procesamiento pagos)
- Webhooks (eventos tiempo real)

**Otros**:
- SendGrid (emails transaccionales)
- Twilio (SMS backup)
- Sentry (error tracking)
- PostHog (analytics producto)

---

## 8. Seguridad Nivel Bancario

### 8.1 Encriptación

**At Rest** (datos almacenados):
- AES-256 (Supabase managed)
- Claves rotadas cada 90 días
- Backups encriptados

**In Transit** (datos en movimiento):
- TLS 1.3 (SSL certificates)
- Let's Encrypt auto-renovado
- HSTS headers (force HTTPS)

**Secrets Management**:
- Railway encrypted env vars
- Nunca en código fuente
- Rotación manual trimestral

### 8.2 Autenticación y Autorización

**Auth**:
- JWT tokens (firma HMAC SHA-256)
- Refresh tokens (httpOnly cookies)
- Expiración: 1 hora (access), 30 días (refresh)
- 2FA opcional (TOTP via Supabase)

**RBAC (5 roles)**:

| Rol | Acceso |
|---|---|
| `owner` | Total |
| `admin` | Todo excepto billing |
| `agente` | CRM + E-commerce (readonly ERP) |
| `almacenista` | E-commerce + Inventario |
| `contador` | ERP + reportes financieros |

**RLS (Row Level Security)**:

```sql
-- Ejemplo policy
CREATE POLICY "Users can only see their tenant data"
ON orders
FOR SELECT
USING (tenant_id = auth.uid()::text);
```

### 8.3 Rate Limiting

**Por tenant**:
- 100 requests/minuto (API)
- 1,000 conversaciones Samantha/mes (plan-based)
- 500 timbres CFDI/mes (plan-based)

**Por IP**:
- 200 requests/minuto (global)
- 10 logins fallidos → bloqueo 15 min
- DDoS protection (Cloudflare)

### 8.4 Audit Logs

**Eventos registrados**:
- Todos los logins (éxito/fallo)
- Cambios en datos críticos (facturas, precios, usuarios)
- Acciones de Samantha (quién pidió qué)
- Acceso a datos sensibles (RFC, emails)

**Retención**:
- 90 días (caliente — PostgreSQL)
- 1 año (frío — S3 Glacier)

**Formato**:

```json
{
  "timestamp": "2026-04-20T14:32:15Z",
  "user_id": "uuid-123",
  "tenant_id": "orthocardio",
  "action": "cfdi.generate",
  "resource": "invoice:F-2026-042",
  "ip": "187.142.x.x",
  "user_agent": "Mozilla/5.0...",
  "success": true
}
```

### 8.5 Compliance

**México**:
- ✅ CFDI 4.0 (SAT)
- ✅ Ley Federal Protección Datos Personales
- ✅ Facturación electrónica obligatoria

**Internacional**:
- ✅ GDPR-ready (exportación datos)
- ✅ CCPA-compatible (California)
- ⬜ SOC 2 Type II (en proceso)

---

## 9. Escalabilidad y Performance

### 9.1 Arquitectura Multi-Tenant

**Aislamiento**:
- Datos: `tenant_id` FK + RLS
- Archivos: S3 bucket prefix por tenant
- Rate limits: Por `tenant_id`
- Billing: Stripe `customer_id` único

**1 instancia sirve N clientes**:

```
Tenant: orthocardio
├── 50 productos
├── 100 órdenes/mes
├── 3 usuarios
└── Storage: 2.3 GB

Tenant: kap-tools
├── 200 productos
├── 500 órdenes/mes
├── 8 usuarios
└── Storage: 8.1 GB

Tenant: N...
```

### 9.2 Límites Actuales

**Railway (Backend)**:
- RAM: 8 GB
- CPU: 8 vCPUs
- Network: 10,000 req/min
- Concurrent users: ~500

**Vercel (Frontend)**:
- Edge Functions: 1,000,000 invocations/mes
- Bandwidth: 100 GB/mes
- Build time: 45 min/mes

**Supabase (DB)**:
- Connections: 60 simultáneas
- Storage: 8 GB (actual: 1.2 GB)
- Bandwidth: 50 GB/mes

### 9.3 Plan de Escalabilidad

**10 clientes (current capacity)**:
- RAM suficiente ✅
- DB connections OK ✅

**50 clientes (upgrade needed)**:
- Railway: 16 GB RAM ($49/mes → $99/mes)
- Supabase: Pro plan ($25/mes)
- Total: +$75/mes

**100+ clientes (arquitectura distribuida)**:
- Microservicios por módulo
- DB sharding por tenant_id
- Multi-region (US + MX)

---

## 10. Roadmap Técnico

### Fase 1: ACTUAL (Abril 2026) ✅

- ✅ Samantha operativa (43 agentes)
- ✅ Multi-tenant funcional
- ✅ CFDI 4.0 compliance
- ✅ E-commerce omnicanal (ML + Amazon + Shopify)
- ✅ CRM omnicanal (WA + IG + FB)
- ✅ Dashboard enterprise-grade

### Fase 2: Q2 2026 (Mayo–Junio)

- ⬜ API pública REST + GraphQL
- ⬜ Webhooks customizables
- ⬜ Mobile apps (iOS + Android)
- ⬜ Samantha aprende casos específicos por tenant
- ⬜ Reportes BI avanzados (Metabase integration)

### Fase 3: Q3 2026 (Julio–Septiembre)

- ⬜ Marketplace de integraciones
- ⬜ SDK para developers
- ⬜ White-label para partners
- ⬜ Agentes customizables por tenant
- ⬜ On-premise deployment option

### Fase 4: Q4 2026 (Octubre–Diciembre)

- ⬜ Multi-país (Colombia, Chile, Argentina)
- ⬜ Multi-idioma (inglés, portugués)
- ⬜ AI training customizado por industria
- ⬜ Predictive analytics (forecasting ventas)

---

## 11. Decisiones Técnicas Clave (Evidencias PI)

### 11.1 ¿Por qué 43 agentes y no 1 monolítico?

**Decisión**: Carlos Cortés (13 abril 2026)

**Alternativas evaluadas**:

1. **1 agente monolítico** (tipo ChatGPT)
   - ❌ Tasa error: 23% en tests
   - ❌ Alucinaciones frecuentes
   - ❌ Difícil debuggear

2. **3 agentes macro** (E-commerce / CRM / ERP)
   - ⚠️ Tasa error: 12% en tests
   - ⚠️ Todavía muy general
   - ⚠️ Conflictos entre sub-tareas

3. **43 agentes micro-especializados** ✅
   - ✅ Tasa error: 3% en tests
   - ✅ Cada agente experto en 1 tarea
   - ✅ Fácil aislar problemas

**Validación experimental**:

```
Test case: "Genera factura y envía por WA"
Agente monolítico:  7/30 fallos (23%)
43 agentes:         1/30 fallos  (3%)
```

### 11.2 ¿Por qué Samantha como orquestador y no solo API?

**Decisión**: Carlos Cortés (15 abril 2026)

**Razones**:
- **UX superior**: Lenguaje natural vs comandos técnicos
- **Contexto persistente**: Recuerda conversaciones previas
- **Aprendizaje**: Mejora con uso (vs API estática)
- **Accesibilidad**: CEO puede usar sin training técnico

**Ejemplo comparativo**:

```
API REST tradicional:
POST /api/v1/orders/123/invoice
Headers: {Authorization, Content-Type}
Body: {rfc, use_cfdi, payment_method}
→ Requiere conocimiento técnico

Samantha:
"Genera factura del pedido 123"
→ Cualquier usuario puede hacerlo
```

### 11.3 ¿Por qué Next.js y no React SPA?

**Decisión**: Carlos Cortés (10 abril 2026)

**Razones**:
- **SEO**: Landing page necesita indexarse (Google)
- **Server Components**: Menos JS enviado al cliente (-40% bundle)
- **API Routes**: Backend ligero sin Express separado
- **Vercel deploy**: CI/CD automático (git push → live)
- **Edge Functions**: Middleware ultra-rápido

**Trade-off aceptado**:
- Mayor complejidad vs Create React App
- Pero: mejor performance + DX superior

### 11.4 ¿Por qué Supabase y no MongoDB?

**Decisión**: Carlos Cortés (8 abril 2026)

**Razones**:
- **PostgreSQL**: ACID compliance (crítico para finanzas)
- **RLS nativo**: Seguridad multi-tenant built-in
- **Auth integrado**: Menos código custom de autenticación
- **Realtime**: WhatsApp inbox actualiza automático
- **SQL familiar**: Equipo ya conoce PostgreSQL

**MongoDB descartado**:
- ❌ No ACID (riesgo en transacciones financieras)
- ❌ RLS manual (complejo de implementar)
- ❌ Queries complejos menos eficientes

### 11.5 ¿Por qué Railway y no AWS/GCP?

**Decisión**: Carlos Cortés (12 abril 2026)

**Razones**:
- **Simplicidad**: Git push → deploy (vs configuración AWS compleja)
- **Costo predecible**: $X/mes flat (vs AWS surprises)
- **Startup-friendly**: Ideal para MVP y primeros clientes
- **Logs integrados**: No necesita CloudWatch/Datadog
- **Auto-scaling**: Maneja 10–50 clientes sin intervención

**Plan de migración futura**:
- Si >100 clientes → Evaluar AWS/GCP
- Pero no antes (over-engineering temprano)

---

## 12. Propiedad Intelectual

### 12.1 Titularidad

**Propietario**: Atollom Labs S. de R.L. de C.V.  
**Dirección**: Puebla, México  

**Autores**:
- Carlos Cortés (arquitectura, decisiones técnicas)
- Equipo Atollom Labs (implementación)

### 12.2 Registro

**México**:
- ⬜ INDAUTOR (Instituto Nacional del Derecho de Autor)
- ⬜ IMPI (Instituto Mexicano de la Propiedad Industrial)
- Marca: "KINEXIS"
- Marca: "Samantha AI"

**Internacional**:
- ⬜ USPTO (Estados Unidos)
- ⬜ WIPO (Mundial)

### 12.3 Evidencias de Autoría Humana

**Documentación**:
- ✅ Este archivo (ARCHITECTURE.md)
- ✅ Git commits firmados (Carlos Cortés)
- ✅ Screenshots timestamped del desarrollo
- ✅ Logs de sesiones de diseño arquitectónico

**Código fuente**:
- ✅ Git history completo (desde 8 abril 2026)
- ✅ Commits con autor verificable
- ✅ Code reviews documentados

### 12.4 Licencia

**Software**: Propietario (no open source)  
**Copyright**: © 2026 Atollom Labs. Todos los derechos reservados.

**Modelo de negocio**:
- SaaS multi-tenant (licencia por uso)
- Código NO transferible a clientes
- White-label disponible (Q3 2026)

---

## 13. Referencias y Recursos

### 13.1 Documentación Técnica (este repo)

- [`SECURITY.md`](SECURITY.md) — Seguridad nivel bancario
- [`migrations/`](../migrations/) — Historial migraciones DB
- [`specs/`](../specs/) — Especificaciones de módulos
- [`docs/reference/biblia/`](reference/biblia/) — Prompts maestros y contratos de agentes

### 13.2 Integraciones Documentadas

- Mercado Libre Developers — `https://developers.mercadolibre.com.mx`
- Amazon MWS documentation — `https://developer.amazonservices.com`
- Shopify Admin API reference — `https://shopify.dev/docs/api/admin`
- WhatsApp Business API docs — `https://developers.facebook.com/docs/whatsapp`
- FacturAPI CFDI 4.0 guide — `https://www.facturapi.io/docs`

---

*Última actualización: 20 abril 2026*  
*Versión: 1.0*

---

**Firmado digitalmente**:

```
Autor:   Carlos Cortés
Email:   contacto@atollom.com
Empresa: Atollom Labs S. de R.L. de C.V.
```

*Copyright © 2026 Atollom Labs. Todos los derechos reservados.*  
*Git commit SHA: [generado al guardar]*
