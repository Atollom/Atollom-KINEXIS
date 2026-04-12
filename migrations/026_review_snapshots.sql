-- migrations/026_review_snapshots.sql
CREATE TABLE review_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL CHECK (platform IN ('mercadolibre','amazon','all')),
  sku TEXT,
  avg_rating DECIMAL(3,2),
  review_count INTEGER,
  low_rating_alert BOOLEAN DEFAULT FALSE,
  fake_pattern_alert BOOLEAN DEFAULT FALSE,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON review_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_review_snapshots_tenant_platform ON review_snapshots(tenant_id, platform);
CREATE INDEX idx_review_snapshots_tenant_sku ON review_snapshots(tenant_id, sku);
CREATE INDEX idx_review_snapshots_alerts ON review_snapshots(low_rating_alert, fake_pattern_alert) WHERE low_rating_alert = TRUE OR fake_pattern_alert = TRUE;
CREATE INDEX idx_review_snapshots_at ON review_snapshots(snapshot_at DESC);
