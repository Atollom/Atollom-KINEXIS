-- migrations/027_pipeline_snapshots.sql
CREATE TABLE pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  leads_analyzed INTEGER DEFAULT 0,
  cold_leads INTEGER DEFAULT 0,
  stale_leads INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  pipeline_health JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON pipeline_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_pipeline_snapshots_tenant_at ON pipeline_snapshots(tenant_id, snapshot_at DESC);
