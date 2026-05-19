# KINEXIS — Plataforma SaaS Omnicanal E-commerce

Sistema completo de gestión para vendedores en Amazon, Mercado Libre, Shopify y más, orquestado por **Samantha AI** con 43 agentes especializados.

[![Deploy](https://img.shields.io/badge/frontend-Vercel-black)](https://kinexis.atollom.com)
[![Backend](https://img.shields.io/badge/backend-Railway-purple)](https://atollom-kinexis-production.up.railway.app)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-green)]()

---

## Funcionalidades

- **Multi-canal** — Sincroniza órdenes, inventario y precios entre ML, Amazon, Shopify y B2B
- **ERP Integrado** — Finanzas, compras, inventario, facturación CFDI 4.0
- **CRM Completo** — Pipeline, leads, soporte, NPS, portal B2B
- **43 Agentes IA** — Automatización inteligente por dominio
- **Samantha AI** — Asistente virtual con Claude Sonnet 4.6 + memoria persistente
- **Analytics** — Reportes en tiempo real de ventas, inventario y clientes
- **Multi-tenant** — Aislamiento completo por empresa via RLS

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript (Vercel) |
| Backend | FastAPI 0.115 + Python 3.12 (Railway) |
| Base de datos | PostgreSQL 15 + pgvector (Supabase) |
| Auth | Supabase Auth + Row Level Security |
| AI / LLM | Google Gemini 2.5 Flash · Anthropic Claude Sonnet 4.6 |
| Cache | Redis 7 (Railway) |
| Pagos | Stripe |

---

## Arquitectura — Samantha AI

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
    └── ... 34 more agents
    │
    ▼
Proactive Greeting (urgencies surfaced on "hola")
    │
    ▼
Conversational LLM Fallback
```

---

## Integraciones

| Plataforma | Uso |
|-----------|-----|
| Mercado Libre | Productos, órdenes, preguntas, fulfillment |
| Amazon SP-API | FBA, inventario, reportes |
| Shopify | Productos, órdenes, descuentos |
| FacturAPI | CFDI 4.0 / SAT México |
| Skydropx | Guías de envío, tarifas de paquetería |
| WhatsApp Business | Mensajería de clientes |
| Instagram / Facebook | DMs, gestión de ads |
| Stripe | Suscripciones y pagos |
| Resend | Emails transaccionales |

---

## Estructura del Proyecto

```
Atollom-KINEXIS/
├── backend/                    # FastAPI API + AI agents (Railway)
│   ├── main.py                 # Entry point
│   ├── src/
│   │   ├── agents/             # 43 agentes especializados
│   │   ├── routers/            # FastAPI route handlers
│   │   ├── services/           # intent_classifier, memory_service, context_analyzer
│   │   └── integrations/       # External APIs
│   ├── tests/                  # Pytest suite (443+ tests)
│   └── requirements.txt
│
├── src/dashboard/              # Next.js 14 frontend (Vercel)
│   ├── app/
│   │   ├── (shell)/            # Shell autenticado
│   │   │   ├── dashboard/      # Dashboards por rol
│   │   │   ├── ecommerce/      # ML, Amazon, Shopify, Catalog
│   │   │   ├── crm/            # Pipeline, inbox, sales, support
│   │   │   ├── erp/            # CFDI, finanzas, inventario, compras
│   │   │   ├── analytics/      # Ventas, inventario, clientes
│   │   │   ├── operations/     # Fulfillment, envíos, almacén, calidad
│   │   │   ├── settings/       # Perfil, usuarios, billing, integraciones
│   │   │   └── admin/          # Panel super admin
│   │   ├── onboarding/         # Wizard de onboarding
│   │   └── api/                # Next.js API routes (auth proxy)
│   └── components/
│
├── migrations/                 # Supabase SQL migrations (43 archivos)
├── docs/                       # API.md, ARCHITECTURE.md, USER_GUIDE.md
├── scripts/                    # Backup scripts
└── .github/workflows/          # GitHub Actions
```

---

## Setup Local

### Prerequisitos

- Node.js 18+
- Python 3.12+
- Cuenta Supabase
- Google AI API key

### Frontend

```bash
cd src/dashboard
npm install
cp .env.local.example .env.local  # llenar con credenciales Supabase
npm run dev
# http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp ../.env.example .env         # llenar secrets
uvicorn main:app --reload --port 8000
# http://localhost:8000/docs
```

### Tests Backend

```bash
cd backend
python -m pytest tests/ -v
# 443 passed
```

---

## Variables de Entorno

### Frontend (`src/dashboard/.env.local`)

| Variable | Descripción |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (API routes) |
| `PYTHON_BACKEND_URL` | URL del backend Railway |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry (opcional) |

### Backend (`backend/.env`)

| Variable | Descripción |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `GOOGLE_API_KEY` | Gemini 2.5 Flash |
| `ANTHROPIC_API_KEY` | Claude Sonnet (fallback LLM) |
| `STRIPE_SECRET_KEY` | Stripe pagos |
| `FACTURAPI_SECRET_KEY` | FacturAPI CFDI |
| `SKYDROPX_API_KEY` | Paquetería |
| `RESEND_API_KEY` | Emails transaccionales |
| `ENCRYPTION_KEY` | Fernet key para API keys vault |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `SENTRY_DSN` | DSN Sentry backend (opcional) |

---

## Deploy

| Servicio | Config | Trigger |
|---------|--------|---------|
| **Frontend** | Vercel — auto-detected Next.js | Push a `main` |
| **Backend** | Railway — `uvicorn main:app --host 0.0.0.0 --port $PORT` | Push a `main` |

**URLs de producción:**
- Dashboard: `https://kinexis.atollom.com`
- API: `https://atollom-kinexis-production.up.railway.app`
- API Docs: `https://atollom-kinexis-production.up.railway.app/docs`

---

## Seguridad

- **RLS** — Row Level Security en todas las tablas via `tenant_id`
- **RBAC** — 5 roles: `owner`, `admin`, `agente`, `almacenista`, `contador`
- **Vault** — API keys encriptadas con Fernet, nunca expuestas al cliente
- **CORS** — Origins específicos configurados via env var
- **Rate limiting** — SlowAPI, 100 req/min por defecto
- **Security headers** — CSP, HSTS, X-Frame-Options en todas las responses

---

## Monitoreo

| Herramienta | Uso |
|------------|-----|
| Vercel Analytics | Frontend performance |
| Railway Metrics | Backend CPU/RAM |
| Sentry | Error tracking frontend + backend |
| UptimeRobot | Health check cada 5 min |

---

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| `owner` | Todo, incluyendo billing y gestión de usuarios |
| `admin` | Operaciones completas, no puede cambiar billing |
| `agente` | CRM, órdenes, cotizaciones |
| `almacenista` | Inventario, despacho, devoluciones |
| `contador` | ERP, CFDI, finanzas (solo lectura) |
| `atollom_admin` | Panel admin cross-tenant |

---

## Documentación

- [API Reference](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Decisions Log](docs/DECISIONS.md)

---

*Construido por [Atollom Labs](https://atollom.com) · KINEXIS v1.0.0-beta · Mayo 2026*
