-- migrations/017_price_history.sql
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  platform TEXT NOT NULL,
  price_before DECIMAL(12,2),
  price_after DECIMAL(12,2),
  cost_at_time DECIMAL(12,2),
  margin_pct DECIMAL(5,2),
  changed_by TEXT DEFAULT 'price_sync_agent',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their tenant's price history"
ON price_history FOR ALL
TO authenticated
USING (tenant_id = auth.jwt() ->> 'tenant_id')::uuid
WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id')::uuid;

-- Índices optimizados
CREATE INDEX idx_price_history_tenant_sku ON price_history(tenant_id, sku);
CREATE INDEX idx_price_history_tenant_platform ON price_history(tenant_id, platform);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at DESC);
CREATE INDEX idx_price_history_sku_platform ON price_history(sku, platform);
