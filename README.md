# KINEXIS — AI-Native ERP Platform

**Multi-tenant SaaS** for Mexican e-commerce operators. Unified E-commerce + CRM + ERP orchestrated by Samantha, an autonomous AI concierge powered by 43 specialized agents.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115 + Python 3.12 (Railway) |
| Frontend | Next.js 14 App Router + TypeScript (Vercel) |
| Database | PostgreSQL 15 + pgvector (Supabase) |
| Auth | Supabase Auth + Row Level Security |
| AI / LLM | Google Gemini 2.5 Flash · Anthropic Claude Sonnet 4.6 |
| Cache | Redis 7 (Railway) |

---

## Samantha AI — Agent Orchestration

```
User Query
    │
    ▼
ContextAnalyzer (parallel — proactive urgency detection)
    │
    ▼
IntentClassifier (regex fast-path → Gemini structured extraction)
    │
    ▼
AgentDispatcher (lazy-load → execute → format with LLM)
    │
    ├── agent_05_inventory_monitor   ← ERP: stock levels
    ├── agent_06_price_manager       ← ERP: price sync
    ├── agent_13_cfdi_billing        ← ERP: SAT invoicing
    ├── agent_18_finance_snapshot    ← ERP: financial reports
    ├── agent_30_purchase_orders     ← ERP: supplier orders
    ├── agent_32_quote_generator     ← CRM: quotes
    ├── agent_33_follow_up           ← CRM: lead follow-up
    ├── agent_02_amazon_fba          ← E-commerce: FBA sync
    ├── agent_03_shopify_fulfillment ← E-commerce: Shopify
    └── ... 15 more agents
    │
    ▼
Proactive Greeting (urgencies surfaced on "hola")
    │
    ▼
Conversational LLM Fallback (Gemini 2.5 Flash · Claude Sonnet 4.6)
```

### Proactive Intelligence

Samantha runs a `ContextAnalyzer` on every request — four parallel queries against live DB data:

| Check | Trigger | Severity |
|-------|---------|----------|
| Inventory | stock ≤ 10 units | critical (≤3) · high (≤10) |
| CFDI | completed orders without invoice | high (≥3) · medium |
| Overdue | payments pending > 30 days | high |
| CRM | leads stale > 3 days | medium |

Results are injected into the system prompt and surfaced as a proactive greeting when urgencies exist.

---

## Project Structure

```
Atollom-KINEXIS/
├── backend/                    # FastAPI API + AI agents (Railway)
│   ├── main.py                 # Application entry point
│   ├── src/
│   │   ├── agents/             # 43 specialized agents
│   │   │   ├── samantha/       # Core AI orchestrator (core.py)
│   │   │   ├── erp/            # Inventory, finance, CFDI, logistics
│   │   │   ├── crm/            # Leads, NPS, quotes, follow-ups
│   │   │   ├── ecommerce/      # ML, Amazon FBA, Shopify
│   │   │   └── meta/           # WhatsApp, Instagram, Facebook
│   │   ├── routers/            # FastAPI route handlers
│   │   ├── services/           # intent_classifier, agent_dispatcher,
│   │   │                       # memory_service, context_analyzer
│   │   └── integrations/       # External APIs (ML, Amazon, Shopify,
│   │                           # FacturAPI, Skydropx)
│   ├── tests/                  # Pytest suite (443+ tests)
│   └── requirements.txt
│
├── src/dashboard/              # Next.js 14 frontend (Vercel)
│   ├── app/                    # App Router pages
│   │   ├── (shell)/            # Authenticated shell (sidebar + Samantha panel)
│   │   ├── login/              # Auth pages
│   │   ├── api/                # Next.js API routes (auth proxy layer)
│   │   ├── dashboard/          # Role-based dashboards
│   │   ├── ecommerce/          # ML, Amazon, Shopify modules
│   │   ├── crm/                # Pipeline, inbox, sales, support
│   │   └── erp/                # CFDI, accounting, finance, inventory
│   ├── components/
│   │   ├── shell/              # Sidebar, Header, Breadcrumbs
│   │   ├── samantha/           # SamanthaFixedPanel
│   │   ├── dashboards/         # Role-specific dashboards
│   │   ├── ToastProvider.tsx   # Real-time toast notifications
│   │   ├── NotificationBadge.tsx
│   │   └── UrgencyPanel.tsx    # Live urgency indicators
│   └── lib/                    # Supabase clients, auth helpers
│
├── docs/
│   ├── API.md                  # Full API reference
│   ├── ARCHITECTURE.md         # System design
│   ├── SECURITY.md             # Security model
│   └── DECISIONS.md            # Architecture decision log
│
├── migrations/                 # Supabase SQL migrations
├── scripts/                    # Seed scripts + admin utilities
└── CLAUDE.md                   # AI assistant context
```

---

## Integrations

| Platform | Purpose |
|----------|---------|
| Mercado Libre | Products, orders, questions, fulfillment |
| Amazon MWS | FBA shipments, inventory sync |
| Shopify | Products, orders, fulfillment |
| FacturAPI | CFDI 4.0 / SAT Mexico e-invoicing |
| Skydropx | Shipping labels, carrier rates |
| WhatsApp Business | Customer messaging |
| Instagram / Facebook | DMs, ads management |
| Stripe | Subscription billing |

---

## Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- Supabase project
- Google AI API key (`GOOGLE_API_KEY`)

### Backend (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env          # fill in secrets
uvicorn main:app --reload --port 8000
```

### Frontend (local)

```bash
cd src/dashboard
npm install
cp .env.local.example .env.local  # fill in Supabase keys + PYTHON_BACKEND_URL
npm run dev                        # http://localhost:3000
```

### Tests

```bash
cd backend
python -m pytest tests/ -v
# 443 passed
```

---

## Deploy

| Service | Config | Trigger |
|---------|--------|---------|
| **Backend** | `backend/railway.json` — root `/backend`, start `uvicorn main:app --host 0.0.0.0 --port $PORT` | Push to `main` |
| **Frontend** | Vercel auto-detected Next.js in `src/dashboard/` | Push to `main` |

### Environment Variables

**Backend (Railway)**

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (bypasses RLS) |
| `GOOGLE_API_KEY` | ✅ | Gemini 2.5 Flash |
| `ANTHROPIC_API_KEY` | optional | Claude fallback provider |
| `LLM_PROVIDER` | optional | `gemini` (default) or `anthropic` |
| `REDIS_URL` | optional | Memory caching |
| `ALLOWED_ORIGINS` | optional | CORS origins (comma-separated) |

**Frontend (Vercel)**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role (Next.js API routes) |
| `PYTHON_BACKEND_URL` | ✅ | Railway backend URL |

**Production URLs:**
- Dashboard: `https://kinexis.atollom.com`
- Backend API: `https://atollom-kinexis-production.up.railway.app`

---

## Multi-Tenant Architecture

- Every table has `tenant_id FK → tenants` with Row Level Security
- 5 RBAC roles: `owner`, `admin`, `agente`, `almacenista`, `contador`
- Samantha memory scoped per `tenant_id + user_id`
- Dashboard route serves role-specific component (`DashboardOwner`, `DashboardVendedor`, `DashboardAlmacen`)

---

*Built by [Atollom Labs](https://atollom.com) · KINEXIS v1 · Production: May 2026*
