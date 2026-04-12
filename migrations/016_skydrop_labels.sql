-- migrations/016_skydrop_labels.sql
CREATE TABLE skydrop_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  shopify_order_id TEXT,
  tracking_number TEXT NOT NULL,
  carrier TEXT,
  label_url TEXT,
  shipment_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skydrop_labels ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_skydrop_labels_tenant_tracking ON skydrop_labels(tenant_id, tracking_number);
CREATE INDEX idx_skydrop_labels_shopify_id ON skydrop_labels(shopify_order_id);
CREATE INDEX idx_skydrop_labels_expires ON skydrop_labels(expires_at);
