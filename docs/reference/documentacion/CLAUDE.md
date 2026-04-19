# KINEXIS / ATOLLOM NEXUS — MEMORIA MAESTRA DEL PROYECTO
> Versión: 3.0 | Fecha: 09 Abril 2026  
> Uso: Pegar este archivo al inicio de cualquier conversación con Claude en lugar de subir todos los documentos.

---

## 🏢 IDENTIDAD DEL PROYECTO

| Campo | Detalle |
|---|---|
| Producto | **KINEXIS** — Integrated AI Systems |
| Empresa | **Atollom Labs** |
| Fundadores | Carlos Hernán Cortés Ayala + Alexis Hiram Valencia Duarte |
| Cliente piloto | **Kap Tools SA de CV** (Felipe Gascón Fernández) |
| Tipo de negocio Kap Tools | Comercializadora B2B/B2C: herramientas de micro-relojería, reactivos químicos, precisión |
| Plataformas activas | Mercado Libre, Amazon, Shopify, Instagram, WhatsApp Business, Facebook |
| Stack tecnológico | Next.js · Supabase (PostgreSQL + RLS) · Railway · Vercel · Claude API · Gemini fallback |

---

## 🏗️ ARQUITECTURA: 42 AGENTES ESPECIALIZADOS

### Distribución por módulo

| Módulo | Cant. | Enfoque |
|---|---|---|
| E-COMMERCE | 20 | ML, Amazon, Shopify, Instagram, ADS |
| CRM | 10 | Ventas B2B, soporte, relaciones clave |
| ERP | 8 | Inventario, compras, logística, finanzas |
| PRODUCTO | 2 | Catálogo, desarrollo de nuevos productos |
| SISTEMA | 2 | Router Agent + Validation Agent (#26) |
| **TOTAL** | **42** | |

### Agentes clave a recordar siempre

- **Router Agent** — Orquestador central (cuello de botella si no se optimiza con jerarquía)
- **Validation Agent #26** — "Policía del Spec": usa lógica determinista en Python para validar TODOS los outputs antes de tocar BD o cliente. Corazón de la "Edición Bunker".
- **ML Question Handler** — Responde preguntas de compradores en ML
- **ML Fulfillment Agent** — Genera etiquetas ML FULL
- **ML Listing Optimizer** — Optimiza títulos/descripciones/imágenes ML con SEO
- **ML Ads Manager** — Campañas publicitarias ML (ROAS, CTR, pujas diarias)
- **Amazon FBA Manager** — Gestión envíos FBA
- **Amazon Ads Manager** — Sponsored Products/Brands/Display
- **Instagram DM Handler** — Atención por mensajes directos (integra inventario en tiempo real)
- **Instagram Comments Agent** — Respuestas automáticas a comentarios en posts
- **Instagram Content Publisher** — Publica en feed/Stories, etiqueta productos (Instagram Shopping)
- **Instagram Ads Manager** — Campañas Feed, Stories, Reels
- **WhatsApp Handler** — B2B: cotizaciones, pedidos, soporte
- **Sales Agent B2B** — Pipeline de ventas consultivas
- **Lead Qualifier Agent** — Califica leads entrantes
- **Procurement Agent** — Órdenes de compra a proveedores
- **Import Logistics Agent** — Seguimiento de importaciones (China principalmente)
- **Warehouse Coordinator Agent** — Tareas diarias de almacén (pick&pack, recepción, ciclos)
- **Account Manager Agent** — Seguimiento proactivo de cuentas clave B2B
- **Product Development Assistant** — Análisis de oportunidades de mercado para nuevos SKUs
- **Onboarding Agent** — Auto-configuración para nuevos tenants (<30 min)

---

## 🔌 INTEGRACIONES DE API

### Meta Business Platform (UN SOLO adaptador: MetaBusinessAdapter)
- WhatsApp Business API
- Instagram Graph API (DM, Comments, Media, Shopping, Insights)
- Facebook Pages API
- Meta Marketing API (ADS en IG + FB)
- Un solo webhook: `/api/webhooks/meta`

### Mercado Libre API v2
- Orders, Items, Questions, Shipping, Fulfillment (ML FULL), Advertising API

### Amazon SP-API
- Orders, Catalog Items, FBA Inbound/Outbound, Feeds, Reports, Amazon Advertising API

### Shopify Admin API
- Products, Orders, Inventory, Webhooks

---

## 💰 COSTOS OPERACIONALES (v3.0)

| Concepto | Costo/mes |
|---|---|
| Infra (Supabase + Railway + Vercel) | $125 USD |
| IA API (Claude + Gemini fallback) | $70–110 USD |
| APIs Externas (Meta, Twilio, Resend) | $35–55 USD |
| Monitoreo (Sentry + Logtail) | $36 USD |
| **TOTAL** | **$266–326 USD/mes** |

---

## 📅 PLAN DE IMPLEMENTACIÓN (20 semanas)

| Fase | Semanas | Entregables |
|---|---|---|
| FASE 1: MVP Crítico | 1–8 | Infra, ML órdenes+preguntas, Instagram DM, WhatsApp, CRM básico |
| FASE 2: E-commerce Avanzado | 9–14 | ML/Amazon ADS, Listing Optimizers, Amazon FBA |
| FASE 3: ERP + Operaciones | 15–18 | Procurement, Logística, Warehouse, Product Dev |
| FASE 4: Multi-Tenant SaaS | 19–20 | Facturación, self-signup, marketplace integraciones |

---

## ⚖️ BLINDAJE LEGAL (INDAUTOR / México)

**Contexto legal**: La SCJN (Amparo Directo 6/2025) estableció que obras 100% generadas por IA son dominio público en México. Para que el IP pertenezca a Carlos y Alexis se requiere evidencia de autoría humana.

**4 mecanismos de Ingeniería de Evidencia**:
1. **Commit Semántico con Atribución** — formato: [decisión humana] vs [contribución IA]
2. **Decision Log (Bitácora)** — registro de cada decisión arquitectónica
3. **Prompt Master Log** — registro de prompts que demuestran edición/selección humana
4. **Architecture Review Gate** — ningún cambio en `/specs/` sin aprobación humana en GitHub

**Activos registrables ante INDAUTOR**:
- Arquitectura SSO (Estructura, Secuencia, Organización) como Obra Literaria
- Diagramas de flujo de 42 agentes como Obra Gráfica
- Reglas de negocio en YAML/Python como Código Fuente
- Marca 'Atollom Nexus' como Marca Comercial (Clase 42 en IMPI)

---

## 🚨 BRECHAS CRÍTICAS IDENTIFICADAS (Prioridad de resolución)

1. **Router Agent cuello de botella** → Implementar orquestación jerárquica / Graph-of-Agents (reduce latencia 38–46%)
2. **Sin backups off-platform** → Regla 3-2-1: Supabase + S3/GCS externo + tercero independiente. `pg_dump` automatizado
3. **Sin LLMOps / observabilidad** → Dashboard de "Tasa de Alucinación" + token consumption por workflow. Detectar token hemorrhaging (bucles infinitos)
4. **Deuda técnica Vibe Coding** → SonarQube/Veracode en cada PR. Políticas-como-código. CLAUDE.md y .cursorrules para contexto persistente

---

## 📐 METODOLOGÍA: SPEC-DRIVEN DEVELOPMENT (SDD)

**Principio**: Ningún agente existe sin un Agent Contract (Spec) formal.

**Flujo**: `Intent → Spec → Generate → Review → Iterate → Ship`

**Herramientas**:
- Google Antigravity (Gemini Flash) → Scaffolding y prototipos rápidos (Pista 1)
- Claude Code (Claude Sonnet 4) → Endurecimiento production-ready, seguridad, edge cases (Pista 2)
- CLAUDE.md / .cursorrules → Memoria de estándares de codificación persistente

**Validation Agent**: Valida esquemas JSON, reglas de negocio (ej: no vender < costo+5%), permisos de autonomía, rate limits de API. Mecanismo Maker-Checker.

---

## 🎯 POSICIONAMIENTO DE MERCADO

- Competidor principal a superar: **Salesforce Agentforce** (segmento SMB)
- Ventajas de Kinexis: menor TCO, mayor flexibilidad, propiedad total de la inteligencia de negocio
- Diferenciador: IA-Native (no plugin periférico) + multi-tenant + foco LATAM (ML + Amazon MX)

---

## 📁 DOCUMENTOS ORIGINALES DEL PROYECTO (ya no necesitas subirlos)

| Archivo | Contenido |
|---|---|
| `ATOLLOM_kinexis_Documento_Maestro_v1.docx` | Arquitectura base 26 agentes |
| `ATOLLOM_kinexis_Maestro_v2_Bunker.docx` | Edición Bunker: Validation Agent, SDD, blindaje legal |
| `ATOLLOM_kinexis_v3_Instagram_Completo.docx` | V3: 42 agentes, Instagram completo, costos actualizados |
| `analisis_necesidades_kap_tools.md` | Código Python de referencia por agente |
| `Proyecto_ATOLLOM_KINEXIS_Análisis_y_Potencialidades.pdf` | Análisis técnico externo con brechas |
| `kap_tools_dashboard_v3_instagram.html` | Mock dashboard con canales unificados |
| `atollom_kinexis_arquitectura_general.svg` | Diagrama visual de arquitectura |
