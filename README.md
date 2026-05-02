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
| AI / LLM | Google Gemini 2.5 Flash + embeddings |
| Cache | Redis 7 (Railway) |

---

## Project Structure

```
Atollom-KINEXIS/
├── backend/                    # FastAPI API + AI agents (Railway)
│   ├── main.py                 # Application entry point
│   ├── src/
│   │   ├── agents/             # 26 specialized agents (ERP, CRM, E-commerce, Meta)
│   │   │   ├── samantha/       # Core AI orchestrator
│   │   │   ├── erp/            # Inventory, finance, CFDI, logistics
│   │   │   ├── crm/            # Leads, NPS, quotes, follow-ups
│   │   │   ├── ecommerce/      # ML, Amazon FBA, Shopify
│   │   │   └── meta/           # WhatsApp, Instagram, Facebook
│   │   ├── routers/            # FastAPI route handlers
│   │   ├── services/           # intent_classifier, agent_dispatcher, memory_service
│   │   └── integrations/       # External APIs (ML, Amazon, Shopify, FacturAPI, Skydrop)
│   ├── tests/                  # Pytest test suite (67+ tests)
│   └── requirements.txt
│
├── src/dashboard/              # Next.js 14 frontend (Vercel)
│   ├── app/                    # App Router pages
│   │   ├── (shell)/            # Authenticated shell (sidebar + Samantha panel)
│   │   ├── login/              # Auth pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── ecommerce/          # ML, Amazon, Shopify modules
│   │   ├── crm/                # Pipeline, inbox, sales, support
│   │   └── erp/                # CFDI, accounting, finance, inventory
│   ├── components/
│   │   ├── shell/              # Sidebar, Header, Breadcrumbs
│   │   ├── samantha/           # SamanthaFixedPanel
│   │   └── ui/                 # shadcn/ui base components
│   └── tailwind.config.ts
│
├── docs/                       # Technical documentation
│   ├── ARCHITECTURE.md         # System design (1,073 lines)
│   ├── SECURITY.md             # Security model
│   └── DECISIONS.md            # Architecture decision log
│
├── migrations/                 # Supabase SQL migrations
├── scripts/                    # Seed scripts + admin utilities
└── CLAUDE.md                   # AI assistant context
```

---

## Samantha AI — Agent Orchestration

```
User Query
    │
    ▼
IntentClassifier (regex fast-path → Gemini structured extraction)
    │
    ▼
AgentDispatcher (lazy-load → execute → format with Gemini)
    │
    ├── agent_05_inventory_monitor   ← ERP: stock levels
    ├── agent_06_price_manager       ← ERP: price sync
    ├── agent_13_cfdi_billing        ← ERP: SAT invoicing
    ├── agent_18_finance_snapshot    ← ERP: financial reports
    ├── agent_32_quote_generator     ← CRM: quotes
    ├── agent_33_follow_up           ← CRM: lead follow-up
    ├── agent_02_amazon_fba          ← E-commerce: FBA sync
    ├── agent_03_shopify_fulfillment ← E-commerce: Shopify orders
    └── ... 18 more agents
    │
    ▼
Conversational LLM Fallback (Claude Sonnet 4.6)
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
| Stripe | Payments |

---

## Setup

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
cp .env.local.example .env.local  # fill in Supabase keys
npm run dev                        # http://localhost:3000
```

### Tests
```bash
cd backend
python -m pytest tests/ -v
```

---

## Deploy

| Service | Config | Trigger |
|---------|--------|---------|
| **Backend** | `backend/railway.json` — root `/backend`, start `uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info` | Push to `main` |
| **Frontend** | Vercel auto-detected Next.js in `src/dashboard/` | Push to `main` |

**Production URLs:**
- Dashboard: `https://dashboard.atollom.com`
- Backend API: `https://atollom-kinexis-production.up.railway.app`

---

## Multi-Tenant Architecture

- Every database table has `tenant_id FK → tenants`
- Supabase Row Level Security (RLS) enforces tenant isolation
- 5 RBAC roles: `owner`, `admin`, `agente`, `almacenista`, `contador`
- Samantha memory is scoped per `tenant_id + user_id`

---

*Built by [Atollom Labs](https://atollom.com) · KINEXIS v1 · MVP target: May 2026*
