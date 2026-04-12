-- migrations/032_content_proposals.sql
CREATE TABLE content_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  action TEXT NOT NULL,
  image_url TEXT,
  caption TEXT,
  product_sku TEXT,
  hashtags JSONB DEFAULT '[]',
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  approved_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON content_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_content_proposals_tenant_status ON content_proposals(tenant_id, status);
CREATE INDEX idx_content_proposals_scheduled_at ON content_proposals(scheduled_at);
CREATE INDEX idx_content_proposals_created_at ON content_proposals(created_at DESC);
