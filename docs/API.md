# KINEXIS API Reference

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://atollom-kinexis-production.up.railway.app` |
| Development | `http://localhost:8000` |

All endpoints are also accessible through the Next.js proxy layer at `/api/*`, which handles Supabase auth and resolves `tenant_id` automatically — client code should call the proxy, not the backend directly.

---

## Authentication

Backend endpoints are called **server-side only** (from Next.js API routes). Client requests go through `/api/*` routes that verify the Supabase JWT and resolve `tenant_id` via service role.

```
Client → Next.js /api/* (JWT verify + tenant lookup) → Python backend
```

---

## Health

### `GET /health`

```json
{ "status": "ok", "service": "KINEXIS" }
```

---

## Samantha AI — `/api/samantha`

### `POST /api/samantha/chat`

Main conversational endpoint. Orchestrates: context analysis → intent classification → agent dispatch → proactive greeting → LLM fallback.

**Request body:**

```json
{
  "query": "¿Cuánto stock tiene TAL-003?",
  "supabase_user_id": "uuid",
  "tenant_id": "uuid",
  "session_id": "string | null",
  "history": [
    { "role": "user",      "content": "hola" },
    { "role": "assistant", "content": "Hola. Todo bajo control..." }
  ]
}
```

**Response:**

```json
{
  "response": "El TAL-003 tiene 32 unidades en stock...",
  "agent_used": "agent_05_inventory_monitor",
  "credits_remaining": 847,
  "session_id": "sess_abc123"
}
```

**Proactive greeting** (triggered when query matches greeting regex + urgencies exist):

```json
{
  "response": "Hola. Detecté 2 situaciones críticas que requieren atención:\n\n🔴 **Stock bajo: TAL-003**..."
}
```

---

### `GET /api/samantha/credits/{tenant_id}`

Returns remaining AI credits for the tenant's plan.

```json
{ "credits_remaining": 847, "plan": "growth", "reset_date": "2026-06-01" }
```

---

### `GET /api/samantha/debug/memory`

Debug endpoint — returns boot memories for a user.

**Query params:** `supabase_user_id`, `tenant_id`

```json
{
  "boot_memories_count": 5,
  "boot_memories": [
    { "content": "Usuario prefiere reportes en formato tabla.", "importance": 8 }
  ],
  "memory_service_initialized": true
}
```

---

### `POST /api/samantha/memory/save`

Explicitly save a memory entry.

```json
{
  "supabase_user_id": "uuid",
  "tenant_id": "uuid",
  "content": "Preferencia recordada",
  "importance": 7
}
```

---

### `GET /api/samantha/memory/boot`

Returns the memory context injected into Samantha's system prompt on startup.

**Query params:** `supabase_user_id`, `tenant_id`

---

## Dashboard — `/api/dashboard`

### `GET /api/dashboard/stats/{tenant_id}`

KPIs for the main dashboard.

```json
{
  "products":    142,
  "orders":       38,
  "invoices":     21,
  "revenue_30d": 87450.00,
  "customers":   203,
  "tenant_id":   "uuid"
}
```

---

### `GET /api/dashboard/urgencies/{tenant_id}`

Proactive urgencies from `ContextAnalyzer`. Runs four fault-tolerant DB queries.

```json
{
  "urgencies": [
    {
      "type":             "inventory",
      "severity":         "critical",
      "title":            "Stock bajo: TAL-003",
      "description":      "Solo 2 unidades (SKU: TAL-003)",
      "suggested_action": "Crear orden de compra para TAL-003",
      "agent_id":         "agent_30_purchase_orders",
      "data":             { "sku": "TAL-003", "stock": 2 }
    },
    {
      "type":             "operations",
      "severity":         "high",
      "title":            "5 órdenes sin facturar",
      "description":      "Órdenes completadas pendientes de CFDI",
      "suggested_action": "Generar facturas CFDI para órdenes completadas",
      "agent_id":         "agent_13_cfdi_billing",
      "data":             { "count": 5 }
    }
  ],
  "total_issues": 2,
  "analyzed_at":  "2026-05-02T14:30:00Z"
}
```

**Severity levels:** `critical` → `high` → `medium`. Results sorted by severity, capped at 10.

---

### `GET /api/dashboard/recent-orders/{tenant_id}`

**Query params:** `limit` (default: 5)

```json
{
  "orders": [
    {
      "id":            "uuid",
      "order_number":  "ORD-2026-0042",
      "total":         "3450.00",
      "status":        "completed",
      "channel":       "mercadolibre",
      "created_at":    "2026-05-01T10:22:00Z",
      "customer_name": "Empresa XYZ"
    }
  ]
}
```

---

## CFDI — `/api/cfdi`

### `GET /api/cfdi/usage/{tenant_id}`

FacturAPI usage and quota for the tenant's billing period.

### `GET /api/cfdi/invoices/{tenant_id}`

List CFDI invoices with status filter.

### `POST /api/cfdi/invoices/{tenant_id}`

Generate a new CFDI 4.0 via FacturAPI.

### `DELETE /api/cfdi/invoices/{tenant_id}/{invoice_id}`

Cancel a CFDI invoice (SAT cancellation flow).

---

## Agents — `/api/agents`

### `GET /api/agents/health`

Returns status of all registered agents.

### `POST /api/agents/{domain}/route`

Internal endpoint — routes a request to the appropriate agent within a domain (`erp`, `crm`, `ecommerce`, `meta`).

---

## Onboarding — `/api/onboarding`

### `POST /api/onboarding`

Complete tenant onboarding: provision FacturAPI org, seed database, set default settings.

---

## Stripe — `/api/stripe`

### `GET /api/stripe/subscription/{tenant_id}`

Active subscription details and plan limits.

### `POST /api/stripe/webhook`

Stripe webhook receiver (signature verified via `STRIPE_WEBHOOK_SECRET`).

---

## Error Responses

All errors follow this shape:

```json
{
  "detail": "Human-readable description of the error"
}
```

| Code | Meaning |
|------|---------|
| `400` | Invalid request body or parameters |
| `401` | Missing or invalid JWT |
| `403` | Valid auth but insufficient permissions |
| `404` | Resource not found |
| `503` | `DATABASE_URL` not configured |
| `500` | Unexpected server error |

---

## LLM Provider Selection

Set `LLM_PROVIDER` environment variable on Railway:

| Value | Model | Notes |
|-------|-------|-------|
| `gemini` (default) | Gemini 2.5 Flash | Free tier, fast |
| `anthropic` | Claude Sonnet 4.6 | Requires `ANTHROPIC_API_KEY` |

Override model names via `GEMINI_MODEL` or `ANTHROPIC_MODEL` env vars.

---

## Intent Classification

The classifier uses a two-stage approach:

1. **Regex fast-path** — 24 compiled patterns, sub-millisecond
2. **LLM structured extraction** — Gemini fallback when regex is ambiguous

Classified intents map to specific `agent_id` values. If `confidence < 0.6`, Samantha requests clarification instead of dispatching.
