-- migrations/021_analytics_reports.sql
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_type TEXT NOT NULL,
  date_from DATE,
  date_to DATE,
  report_url TEXT,
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON analytics_reports
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_analytics_reports_tenant_type ON analytics_reports(tenant_id, report_type);
CREATE INDEX idx_analytics_reports_created_at ON analytics_reports(created_at DESC);
