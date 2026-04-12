-- migrations/014_amazon_orders.sql
CREATE TABLE amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amazon_order_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','label_created',
      'shipped','cancelled')),
  items_json JSONB,
  tracking_number TEXT,
  carrier TEXT,
  same_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, amazon_order_id)
);

ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_amazon_orders_tenant_status ON amazon_orders(tenant_id, status);
CREATE INDEX idx_amazon_orders_amazon_id ON amazon_orders(amazon_order_id);
CREATE INDEX idx_amazon_orders_created_at ON amazon_orders(created_at DESC);
CREATE INDEX idx_amazon_orders_same_day ON amazon_orders(same_day) WHERE same_day = TRUE;
