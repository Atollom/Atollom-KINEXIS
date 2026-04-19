# ATOLLOM NEXUS v3.0 - ACTUALIZACIÓN COMPLETA
## Integración Instagram + Necesidades Reales de Kap Tools

**Fecha**: 09 Abril 2026  
**Cliente**: Kap Tools SA de CV (Felipe Gascon Fernandez)  
**Cambios principales**:
- ✅ Instagram Business API integrado (DM, Comments, Shopping, Ads)
- ✅ 16 agentes nuevos para cubrir TODAS las responsabilidades del cliente
- ✅ Total: 42 agentes especializados (vs 26 originales)
- ✅ Gestión completa de ADS (ML + Amazon + Instagram + Facebook)
- ✅ Procurement y logística de importación
- ✅ Desarrollo de productos y Account Management

---

## 1. INSTAGRAM - INTEGRACIÓN COMPLETA

### 1.1 APIs de Meta Business Platform (Unificadas)

```
META BUSINESS PLATFORM
├── WhatsApp Business API ✅
├── Facebook Messenger API ✅
├── Facebook Pages API (comments, posts) ✅
├── Instagram Graph API (NEW) ✅
│   ├── Instagram Direct Messages
│   ├── Instagram Comments
│   ├── Instagram Media Publishing
│   ├── Instagram Shopping
│   └── Instagram Insights
└── Meta Marketing API (Ads) ✅
    ├── Facebook Ads
    ├── Instagram Ads
    └── Audience Network
```

**Ventaja clave**: Un solo `MetaBusinessAdapter` maneja WhatsApp + Facebook + Instagram  
**Autenticación**: Un solo Facebook App con permisos para los 3 canales  
**Webhooks**: Un solo endpoint `/api/webhooks/meta` recibe eventos de los 3

### 1.2 Nuevas Tablas de Base de Datos

```sql
-- ============================================
-- INSTAGRAM: Perfiles y Conexiones
-- ============================================

CREATE TABLE instagram_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    instagram_business_account_id VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    profile_picture_url TEXT,
    followers_count INT DEFAULT 0,
    follows_count INT DEFAULT 0,
    media_count INT DEFAULT 0,
    access_token_encrypted TEXT NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    
    UNIQUE(tenant_id, instagram_business_account_id)
);
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON instagram_accounts
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================
-- INSTAGRAM: Conversaciones y Mensajes
-- ============================================

CREATE TABLE instagram_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    instagram_account_id UUID REFERENCES instagram_accounts(id),
    participant_id VARCHAR(255) NOT NULL, -- Instagram User ID
    participant_username VARCHAR(100),
    status VARCHAR(20) DEFAULT 'open', -- open, ai_handled, human_handled, closed
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, instagram_account_id, participant_id)
);
ALTER TABLE instagram_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON instagram_conversations
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE instagram_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    conversation_id UUID REFERENCES instagram_conversations(id) ON DELETE CASCADE,
    platform_message_id VARCHAR(255) NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'customer', 'agent', 'ai'
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, platform_message_id)
);
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON instagram_messages
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================
-- INSTAGRAM: Posts y Comments
-- ============================================

CREATE TABLE instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    instagram_account_id UUID REFERENCES instagram_accounts(id),
    platform_post_id VARCHAR(255) NOT NULL,
    caption TEXT,
    media_type VARCHAR(20), -- IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url TEXT,
    permalink TEXT,
    like_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, platform_post_id)
);
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON instagram_posts
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE instagram_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    post_id UUID REFERENCES instagram_posts(id) ON DELETE CASCADE,
    platform_comment_id VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    text TEXT,
    like_count INT DEFAULT 0,
    is_replied BOOLEAN DEFAULT FALSE,
    replied_by VARCHAR(20), -- 'ai' or 'human'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, platform_comment_id)
);
ALTER TABLE instagram_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON instagram_comments
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================
-- CAMPAÑAS PUBLICITARIAS (Multi-canal)
-- ============================================

CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    platform VARCHAR(50) NOT NULL, -- 'mercadolibre', 'amazon', 'facebook', 'instagram'
    platform_campaign_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(50), -- 'traffic', 'conversions', 'brand_awareness', etc.
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed
    budget_total DECIMAL(10, 2),
    budget_daily DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    targeting JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ad_campaigns
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE TABLE ad_campaign_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0,
    conversions INT DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(5, 4), -- Click-through rate
    cpc DECIMAL(10, 2), -- Cost per click
    roas DECIMAL(10, 2), -- Return on ad spend
    
    UNIQUE(tenant_id, campaign_id, date)
);
ALTER TABLE ad_campaign_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ad_campaign_metrics
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 1.3 MetaBusinessAdapter Actualizado

```python
# backend/integrations/meta_business.py

class MetaBusinessAdapter:
    """
    Adaptador unificado para WhatsApp + Facebook + Instagram
    """
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.credentials = self._load_credentials()
        self.base_url = "https://graph.facebook.com/v18.0"
    
    # ========================================
    # INSTAGRAM DIRECT MESSAGES
    # ========================================
    
    async def send_instagram_dm(
        self,
        instagram_account_id: str,
        recipient_id: str,
        message: str
    ):
        """
        Envía mensaje directo en Instagram
        """
        url = f"{self.base_url}/{instagram_account_id}/messages"
        
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": message}
        }
        
        response = await self._post(url, payload)
        return response
    
    async def get_instagram_conversations(self, instagram_account_id: str):
        """
        Obtiene conversaciones recientes de Instagram DM
        """
        url = f"{self.base_url}/{instagram_account_id}/conversations"
        params = {
            "platform": "instagram",
            "fields": "id,participants,updated_time,message_count"
        }
        
        response = await self._get(url, params)
        return response["data"]
    
    async def get_instagram_messages(self, conversation_id: str):
        """
        Obtiene mensajes de una conversación específica
        """
        url = f"{self.base_url}/{conversation_id}/messages"
        params = {
            "fields": "id,from,to,message,created_time"
        }
        
        response = await self._get(url, params)
        return response["data"]
    
    # ========================================
    # INSTAGRAM COMMENTS
    # ========================================
    
    async def get_post_comments(self, media_id: str):
        """
        Obtiene comentarios de un post de Instagram
        """
        url = f"{self.base_url}/{media_id}/comments"
        params = {
            "fields": "id,username,text,timestamp,like_count"
        }
        
        response = await self._get(url, params)
        return response["data"]
    
    async def reply_to_comment(self, comment_id: str, message: str):
        """
        Responde a un comentario en Instagram
        """
        url = f"{self.base_url}/{comment_id}/replies"
        payload = {"message": message}
        
        response = await self._post(url, payload)
        return response
    
    # ========================================
    # INSTAGRAM MEDIA PUBLISHING
    # ========================================
    
    async def create_instagram_post(
        self,
        instagram_account_id: str,
        image_url: str,
        caption: str,
        product_tags: list[dict] = None
    ):
        """
        Publica una imagen en Instagram (con optional product tagging)
        """
        # Paso 1: Crear contenedor de media
        url = f"{self.base_url}/{instagram_account_id}/media"
        
        payload = {
            "image_url": image_url,
            "caption": caption
        }
        
        # Agregar product tags si existen (Instagram Shopping)
        if product_tags:
            payload["product_tags"] = product_tags
        
        container = await self._post(url, payload)
        
        # Paso 2: Publicar el contenedor
        publish_url = f"{self.base_url}/{instagram_account_id}/media_publish"
        publish_payload = {"creation_id": container["id"]}
        
        result = await self._post(publish_url, publish_payload)
        return result
    
    # ========================================
    # INSTAGRAM SHOPPING (Catálogo de productos)
    # ========================================
    
    async def sync_product_catalog(self, products: list[dict]):
        """
        Sincroniza catálogo de productos con Instagram Shopping
        """
        catalog_id = self.credentials["facebook_catalog_id"]
        url = f"{self.base_url}/{catalog_id}/products"
        
        results = []
        for product in products:
            payload = {
                "retailer_id": product["sku"],
                "name": product["name"],
                "description": product["description"],
                "url": product["url"],
                "image_url": product["image_url"],
                "brand": product.get("brand", "Kap Tools"),
                "price": f"{product['price']} MXN",
                "availability": "in stock" if product["stock"] > 0 else "out of stock"
            }
            
            result = await self._post(url, payload)
            results.append(result)
        
        return results
    
    # ========================================
    # INSTAGRAM ADS (Campañas publicitarias)
    # ========================================
    
    async def create_instagram_ad_campaign(
        self,
        ad_account_id: str,
        campaign_name: str,
        objective: str,  # 'OUTCOME_TRAFFIC', 'OUTCOME_SALES', etc.
        budget_daily: float,
        start_time: datetime,
        end_time: datetime
    ):
        """
        Crea campaña publicitaria en Instagram
        """
        url = f"{self.base_url}/act_{ad_account_id}/campaigns"
        
        payload = {
            "name": campaign_name,
            "objective": objective,
            "status": "ACTIVE",
            "special_ad_categories": [],
            "daily_budget": int(budget_daily * 100),  # En centavos
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
        campaign = await self._post(url, payload)
        return campaign
    
    async def create_instagram_ad_set(
        self,
        ad_account_id: str,
        campaign_id: str,
        targeting: dict,
        optimization_goal: str = "LINK_CLICKS"
    ):
        """
        Crea Ad Set con targeting específico
        """
        url = f"{self.base_url}/act_{ad_account_id}/adsets"
        
        payload = {
            "name": f"AdSet_{datetime.now().strftime('%Y%m%d_%H%M')}",
            "campaign_id": campaign_id,
            "optimization_goal": optimization_goal,
            "billing_event": "IMPRESSIONS",
            "bid_amount": 500,  # En centavos (0.50 MXN)
            "targeting": targeting,
            "status": "ACTIVE"
        }
        
        adset = await self._post(url, payload)
        return adset
    
    async def create_instagram_ad_creative(
        self,
        ad_account_id: str,
        image_hash: str,
        message: str,
        link: str
    ):
        """
        Crea creativo de anuncio (imagen + texto + link)
        """
        url = f"{self.base_url}/act_{ad_account_id}/adcreatives"
        
        payload = {
            "name": f"Creative_{datetime.now().strftime('%Y%m%d_%H%M')}",
            "object_story_spec": {
                "page_id": self.credentials["facebook_page_id"],
                "instagram_actor_id": self.credentials["instagram_account_id"],
                "link_data": {
                    "image_hash": image_hash,
                    "message": message,
                    "link": link,
                    "call_to_action": {
                        "type": "SHOP_NOW",
                        "value": {"link": link}
                    }
                }
            }
        }
        
        creative = await self._post(url, payload)
        return creative
    
    # ========================================
    # WEBHOOKS (Unificados para WA + FB + IG)
    # ========================================
    
    async def verify_webhook(self, mode: str, token: str, challenge: str):
        """
        Verificación de webhook de Meta
        """
        if mode == "subscribe" and token == self.credentials["webhook_verify_token"]:
            return challenge
        else:
            raise ValueError("Token de verificación inválido")
    
    async def process_webhook_event(self, event: dict):
        """
        Procesa evento de webhook (puede ser de WhatsApp, Facebook o Instagram)
        """
        object_type = event.get("object")
        
        if object_type == "instagram":
            return await self._process_instagram_webhook(event)
        elif object_type == "whatsapp_business_account":
            return await self._process_whatsapp_webhook(event)
        elif object_type == "page":
            return await self._process_facebook_webhook(event)
        else:
            raise ValueError(f"Tipo de objeto desconocido: {object_type}")
    
    async def _process_instagram_webhook(self, event: dict):
        """
        Procesa eventos específicos de Instagram
        """
        for entry in event.get("entry", []):
            for change in entry.get("changes", []):
                field = change.get("field")
                value = change.get("value")
                
                if field == "messages":
                    # Nuevo mensaje directo en Instagram
                    await self._handle_instagram_message(value)
                
                elif field == "comments":
                    # Nuevo comentario en post de Instagram
                    await self._handle_instagram_comment(value)
                
                elif field == "mentions":
                    # Mención en story de Instagram
                    await self._handle_instagram_mention(value)
```

---

## 2. ARQUITECTURA DE 42 AGENTES - ESTRUCTURA COMPLETA

### 2.1 Matriz de Agentes por Módulo

```
MÓDULO E-COMMERCE (20 agentes)
├── MERCADO LIBRE (6)
│   ├── 1. ML Question Handler Agent
│   ├── 2. ML Listing Optimizer Agent (NEW)
│   ├── 3. ML Ads Manager Agent (NEW)
│   ├── 4. ML Analytics Agent (NEW)
│   ├── 5. ML Fulfillment Agent (NEW)
│   └── 6. ML Competitor Monitor Agent
│
├── AMAZON (6)
│   ├── 7. Amazon Question Handler Agent
│   ├── 8. Amazon Listing Optimizer Agent (NEW)
│   ├── 9. Amazon Ads Manager Agent (NEW)
│   ├── 10. Amazon FBA/FBM Manager Agent (NEW)
│   ├── 11. Amazon Analytics Agent (NEW)
│   └── 12. Amazon Competitor Monitor Agent
│
├── SHOPIFY (2)
│   ├── 13. Shopify Order Processor Agent
│   └── 14. Shopify Inventory Sync Agent
│
├── INSTAGRAM (4)
│   ├── 15. Instagram DM Handler Agent (NEW)
│   ├── 16. Instagram Comments Agent (NEW)
│   ├── 17. Instagram Content Publisher Agent (NEW)
│   └── 18. Instagram Ads Manager Agent (NEW)
│
└── GENERAL E-COMMERCE (2)
    ├── 19. Price Optimization Agent
    └── 20. Demand Forecasting Agent

MÓDULO CRM (10 agentes)
├── COMUNICACIÓN (5)
│   ├── 21. WhatsApp Handler Agent
│   ├── 22. Email Orchestrator Agent
│   ├── 23. Facebook Messenger Agent
│   ├── 24. SMS Handler Agent (optional)
│   └── 25. Live Chat Widget Agent
│
├── VENTAS (3)
│   ├── 26. Lead Qualifier Agent
│   ├── 27. Sales Agent B2B
│   └── 28. Account Manager Agent (NEW)
│
└── SOPORTE (2)
    ├── 29. Support Agent
    └── 30. Customer Success Agent (NEW)

MÓDULO ERP (8 agentes)
├── INVENTARIO (3)
│   ├── 31. Inventory Agent
│   ├── 32. Warehouse Coordinator Agent (NEW)
│   └── 33. Stock Optimizer Agent
│
├── COMPRAS Y LOGÍSTICA (3)
│   ├── 34. Procurement Agent (NEW)
│   ├── 35. Import Logistics Agent (NEW)
│   └── 36. Supplier Relations Agent (NEW)
│
└── FINANZAS Y REPORTES (2)
    ├── 37. Finance Agent
    └── 38. Reporting Agent

MÓDULO PRODUCTO (2 agentes)
├── 39. Product Development Assistant Agent (NEW)
└── 40. Catalog Manager Agent

SISTEMA (2 agentes)
├── 41. Router Agent (orquestador maestro)
└── 42. Validation Agent (policía del Spec)
```

---

## 3. INTEGRACIONES DE APIs - MAPA COMPLETO

```
INTEGRACIONES EXTERNAS:
├── PLATAFORMAS E-COMMERCE
│   ├── Mercado Libre API v2
│   │   ├── Orders
│   │   ├── Items (publicaciones)
│   │   ├── Questions
│   │   ├── Shipping
│   │   ├── Fulfillment (ML FULL)
│   │   └── Advertising API
│   │
│   ├── Amazon SP-API
│   │   ├── Orders
│   │   ├── Catalog Items
│   │   ├── Fulfillment Inbound/Outbound (FBA)
│   │   ├── Feeds (bulk updates)
│   │   ├── Reports
│   │   └── Amazon Advertising API
│   │
│   └── Shopify Admin API
│       ├── Products
│       ├── Orders
│       ├── Inventory
│       └── Webhooks
│
├── META BUSINESS PLATFORM
│   ├── WhatsApp Business API
│   ├── Instagram Graph API
│   │   ├── Instagram Direct Messages
│   │   ├── Instagram Comments
│   │   ├── Instagram Media
│   │   ├── Instagram Shopping
│   │   └── Instagram Insights
│   ├── Facebook Pages API
│   └── Meta Marketing API (Ads)
│
├── PAQUETERÍAS (Envíos)
│   ├── Estafeta
│   ├── DHL
│   ├── FedEx
│   └── 99minutos (last-mile)
│
├── PAGOS Y FINANZAS
│   ├── Stripe (pagos sitio web)
│   ├── PayPal (opcional)
│   └── Facturación electrónica (SAT México)
│
├── COMUNICACIÓN
│   ├── Resend (email transaccional)
│   ├── Twilio (SMS + Voice)
│   └── SendGrid (email marketing)
│
└── HERRAMIENTAS
    ├── Google Analytics
    ├── Google Sheets (reporting opcional)
    └── Sentry (error monitoring)
```

---

## 4. PLAN DE IMPLEMENTACIÓN REVISADO

### FASE 1: MVP CRÍTICO (8 semanas)

**Semanas 1-2: Fundación**
- [ ] Setup infraestructura (Supabase, Railway, Vercel)
- [ ] Esquema BD completo con RLS
- [ ] Sistema de encriptación
- [ ] Autenticación + middleware tenant
- [ ] Router Agent base

**Semanas 3-4: E-commerce Core**
- [ ] Integración Mercado Libre (órdenes + preguntas)
- [ ] ML Question Handler Agent
- [ ] ML Fulfillment Agent (etiquetas)
- [ ] Dashboard órdenes + etiquetas

**Semanas 5-6: Instagram + Meta**
- [ ] Integración Meta Business API
- [ ] Instagram DM Handler Agent
- [ ] WhatsApp Handler Agent (mejorado)
- [ ] Dashboard conversaciones unificado

**Semanas 7-8: CRM Básico**
- [ ] Sales Agent B2B
- [ ] Lead Qualifier Agent
- [ ] Pipeline de ventas
- [ ] Sistema de permisos IA

### FASE 2: E-COMMERCE AVANZADO (6 semanas)

**Semanas 9-10: Optimización ML**
- [ ] ML Listing Optimizer Agent
- [ ] ML Analytics Agent
- [ ] Reportes semanales automáticos

**Semanas 11-12: Amazon**
- [ ] Integración Amazon SP-API
- [ ] Amazon FBA Manager Agent
- [ ] Dashboard Amazon

**Semanas 13-14: Publicidad**
- [ ] ML Ads Manager Agent
- [ ] Instagram Ads Manager Agent
- [ ] Dashboard campañas unificado

### FASE 3: ERP Y OPERACIONES (4 semanas)

**Semanas 15-16: Compras**
- [ ] Procurement Agent
- [ ] Import Logistics Agent
- [ ] Warehouse Coordinator Agent

**Semanas 17-18: Producto**
- [ ] Product Development Assistant Agent
- [ ] Account Manager Agent
- [ ] Onboarding Agent completo

### FASE 4: MULTI-TENANT (2 semanas)

**Semanas 19-20: SaaS**
- [ ] Módulo facturación
- [ ] Self-service signup
- [ ] Marketplace de integraciones

---

## 5. DASHBOARD ACTUALIZADO

Voy a crear un mockup del dashboard con Instagram integrado:
