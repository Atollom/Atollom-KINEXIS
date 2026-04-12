-- migrations/019_catalog_sync_log.sql
CREATE TABLE catalog_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  trigger TEXT NOT NULL,
  platforms_synced JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalog_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON catalog_sync_log
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_catalog_sync_log_tenant_sku ON catalog_sync_log(tenant_id, sku);
CREATE INDEX idx_catalog_sync_log_trigger ON catalog_sync_log(trigger);
CREATE INDEX idx_catalog_sync_log_created_at ON catalog_sync_log(created_at DESC);
