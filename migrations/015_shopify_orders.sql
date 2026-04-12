-- migrations/015_shopify_orders.sql
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  shopify_order_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','label_created',
      'shipped','cancelled')),
  fulfillment_id TEXT,
  tracking_number TEXT,
  tracking_company TEXT,
  label_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_order_id)
);

ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shopify_orders_tenant_status ON shopify_orders(tenant_id, status);
CREATE INDEX idx_shopify_orders_shopify_id ON shopify_orders(shopify_order_id);
CREATE INDEX idx_shopify_orders_created_at ON shopify_orders(created_at DESC);
