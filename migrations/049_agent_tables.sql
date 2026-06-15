-- Migration 049: Tablas necesarias para agentes (idempotente)
-- Crea tablas faltantes + parches a tablas existentes

-- ── quotes: agregar columnas faltantes ──────────────────────────────────────
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_name   TEXT DEFAULT '';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_rfc    TEXT DEFAULT '';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_terms   TEXT DEFAULT '30_days';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_number    TEXT;

-- ── returns: agregar columnas faltantes ──────────────────────────────────────
ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_number  TEXT;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS channel        TEXT DEFAULT '';
ALTER TABLE returns ADD COLUMN IF NOT EXISTS refund_amount  DECIMAL(12,2) DEFAULT 0;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS items          JSONB;

-- ── nps_surveys: agregar columnas faltantes ──────────────────────────────────
ALTER TABLE nps_surveys ADD COLUMN IF NOT EXISTS customer_id  TEXT;
ALTER TABLE nps_surveys ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'general';
ALTER TABLE nps_surveys ADD COLUMN IF NOT EXISTS sentiment    TEXT DEFAULT 'neutral';
ALTER TABLE nps_surveys ADD COLUMN IF NOT EXISTS comment      TEXT DEFAULT '';

-- ── ml_questions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ml_questions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question_id    TEXT        NOT NULL,
  product_id     TEXT        DEFAULT '',
  question_text  TEXT        NOT NULL,
  category       TEXT        DEFAULT 'general',
  answer         TEXT,
  answered_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, question_id)
);

ALTER TABLE ml_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_ml_questions" ON ml_questions
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_ml_questions_tenant ON ml_questions(tenant_id, answered_at DESC);

-- ── instagram_messages ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ig_id       TEXT        NOT NULL,
  direction   TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  message     TEXT        NOT NULL,
  status      TEXT        DEFAULT 'received',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_ig_messages" ON instagram_messages
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_ig_messages_tenant ON instagram_messages(tenant_id, created_at DESC);

-- ── facebook_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fb_id       TEXT        NOT NULL,
  direction   TEXT        NOT NULL CHECK (direction IN ('inbound','outbound')),
  message     TEXT        NOT NULL,
  status      TEXT        DEFAULT 'received',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE facebook_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_fb_messages" ON facebook_messages
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_fb_messages_tenant ON facebook_messages(tenant_id, created_at DESC);

-- ── meta_campaigns (agents use this name; maps cleanly from ads_campaigns) ───
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meta_campaign_id    TEXT,
  name                TEXT        NOT NULL,
  objective           TEXT        DEFAULT 'CONVERSIONS',
  budget_daily        DECIMAL(10,2) DEFAULT 0,
  platforms           JSONB       DEFAULT '[]',
  status              TEXT        DEFAULT 'draft'
                        CHECK (status IN ('active','paused','draft','deleted')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_meta_campaigns" ON meta_campaigns
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_tenant ON meta_campaigns(tenant_id, created_at DESC);

-- ── meta_posts (content publisher) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meta_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_type  TEXT        DEFAULT 'post' CHECK (content_type IN ('post','story','reel')),
  caption       TEXT        DEFAULT '',
  media_url     TEXT,
  platforms     JSONB       DEFAULT '{}',
  status        TEXT        DEFAULT 'draft'
                  CHECK (status IN ('draft','published','scheduled','deleted')),
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_meta_posts" ON meta_posts
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_meta_posts_tenant ON meta_posts(tenant_id, created_at DESC);

-- ── amazon_inventory ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amazon_inventory (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asin              TEXT        NOT NULL,
  seller_sku        TEXT        NOT NULL,
  fulfillable_qty   INTEGER     DEFAULT 0,
  synced_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, seller_sku)
);

ALTER TABLE amazon_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_amazon_inventory" ON amazon_inventory
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_amazon_inventory_tenant ON amazon_inventory(tenant_id, seller_sku);

-- ── amazon_shipments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amazon_shipments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shipment_id  TEXT        NOT NULL,
  status       TEXT        DEFAULT 'working',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE amazon_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_amazon_shipments" ON amazon_shipments
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE INDEX IF NOT EXISTS idx_amazon_shipments_tenant ON amazon_shipments(tenant_id, created_at DESC);

-- ── instagram_credentials ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ig_user_id   TEXT  NOT NULL,
  access_token TEXT  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_ig_creds" ON instagram_credentials
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ── facebook_credentials ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_credentials (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id      TEXT  NOT NULL,
  access_token TEXT  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE facebook_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_fb_creds" ON facebook_credentials
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ── meta_ads_credentials ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meta_ads_credentials (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad_account_id  TEXT  NOT NULL,
  access_token   TEXT  NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE meta_ads_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_meta_ads_creds" ON meta_ads_credentials
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ── meta_page_credentials ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meta_page_credentials (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  page_id      TEXT  NOT NULL,
  ig_user_id   TEXT,
  access_token TEXT  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE meta_page_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_meta_page_creds" ON meta_page_credentials
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ── shopify_credentials ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_credentials (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID  NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_url     TEXT  NOT NULL,
  access_token  TEXT  NOT NULL,
  api_version   TEXT  DEFAULT '2024-04',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE shopify_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_shopify_creds" ON shopify_credentials
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
