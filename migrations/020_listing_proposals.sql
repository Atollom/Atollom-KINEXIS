-- migrations/020_listing_proposals.sql
CREATE TABLE listing_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  item_id TEXT,
  platform TEXT DEFAULT 'mercadolibre',
  proposal_type TEXT,
  current_value TEXT,
  proposed_value TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','applied')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON listing_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_listing_proposals_tenant_sku ON listing_proposals(tenant_id, sku);
CREATE INDEX idx_listing_proposals_status ON listing_proposals(status);
CREATE INDEX idx_listing_proposals_platform ON listing_proposals(platform);
CREATE INDEX idx_listing_proposals_created_at ON listing_proposals(created_at DESC);
