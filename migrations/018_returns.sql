-- migrations/018_returns.sql
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending_approval'
    CHECK (status IN (
      'pending_approval','approved',
      'rejected','refunded','cancelled')),
  media_urls JSONB,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  cfdi_egreso_uuid TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their tenant's returns"
ON returns FOR ALL
TO authenticated
USING (tenant_id = auth.jwt() ->> 'tenant_id')::uuid
WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

-- Índices optimizados
CREATE INDEX idx_returns_tenant_status ON returns(tenant_id, status);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_platform ON returns(platform);
CREATE INDEX idx_returns_created_at ON returns(created_at DESC);
