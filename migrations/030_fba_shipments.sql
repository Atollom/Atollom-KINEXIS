-- migrations/030_fba_shipments.sql
CREATE TABLE fba_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  fnsku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shipment_id TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','shipped','received','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fba_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON fba_shipments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_fba_shipments_tenant_sku ON fba_shipments(tenant_id, sku);
CREATE INDEX idx_fba_shipments_shipment_id ON fba_shipments(shipment_id);
