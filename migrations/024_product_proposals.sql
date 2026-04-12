-- migrations/024_product_proposals.sql
CREATE TABLE product_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  request_type TEXT NOT NULL,
  category TEXT,
  proposed_skus JSONB DEFAULT '[]',
  estimated_roi DECIMAL(8,2),
  budget_required DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','implemented')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON product_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_product_proposals_tenant_status ON product_proposals(tenant_id, status);
CREATE INDEX idx_product_proposals_type ON product_proposals(request_type);
CREATE INDEX idx_product_proposals_created_at ON product_proposals(created_at DESC);
