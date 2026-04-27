-- KINEXIS Ecommerce Tables: products, customers, orders, order_items
-- Autor: Carlos Cortés (Atollom Labs)
-- Fecha: 2026-04-24

-- ─────────────────────────────────────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  sku           VARCHAR(100)  NOT NULL,
  name          VARCHAR(500)  NOT NULL,
  description   TEXT,
  price         DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost          DECIMAL(12,2),
  stock         INTEGER       NOT NULL DEFAULT 0,

  -- Platform IDs
  ml_item_id    VARCHAR(50),
  amazon_asin   VARCHAR(20),
  shopify_id    VARCHAR(50),

  -- Taxonomy
  category      VARCHAR(255),
  brand         VARCHAR(255),
  image_url     TEXT,

  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant  ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku     ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_ml      ON products(ml_item_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name          VARCHAR(500)  NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(20),
  rfc           VARCHAR(13),

  -- Platform IDs
  ml_user_id    VARCHAR(50),

  -- Address
  city          VARCHAR(100),
  state         VARCHAR(100),
  country       VARCHAR(2) DEFAULT 'MX',

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email  ON customers(tenant_id, email);

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id         UUID          REFERENCES customers(id),

  order_number        VARCHAR(100)  NOT NULL,
  channel             VARCHAR(30)   NOT NULL DEFAULT 'direct',
  -- mercadolibre | amazon | shopify | direct

  -- Platform IDs
  ml_order_id         VARCHAR(50),
  amazon_order_id     VARCHAR(50),
  shopify_order_id    VARCHAR(50),

  -- Amounts
  subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax                 DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping            DECIMAL(12,2) NOT NULL DEFAULT 0,
  total               DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency            VARCHAR(3)    NOT NULL DEFAULT 'MXN',

  -- Status
  status              VARCHAR(30)   NOT NULL DEFAULT 'pending',
  -- pending | paid | shipped | delivered | cancelled | refunded
  payment_status      VARCHAR(30)   NOT NULL DEFAULT 'pending',
  fulfillment_status  VARCHAR(30)   NOT NULL DEFAULT 'pending',

  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT check_channel CHECK (
    channel IN ('mercadolibre', 'amazon', 'shopify', 'direct', 'whatsapp')
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant   ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_channel  ON orders(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_orders_ml       ON orders(ml_order_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Order Items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID          REFERENCES products(id),

  sku         VARCHAR(100),
  name        VARCHAR(500)  NOT NULL,
  quantity    INTEGER       NOT NULL DEFAULT 1,
  unit_price  DECIMAL(12,2) NOT NULL,
  total       DECIMAL(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- View: monthly revenue by channel
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW monthly_revenue_by_channel AS
SELECT
  tenant_id,
  channel,
  DATE_TRUNC('month', created_at)  AS month,
  COUNT(*)                         AS order_count,
  SUM(total)                       AS revenue,
  AVG(total)                       AS avg_ticket
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY tenant_id, channel, DATE_TRUNC('month', created_at);
