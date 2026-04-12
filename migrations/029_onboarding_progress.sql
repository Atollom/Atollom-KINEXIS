-- migrations/029_onboarding_progress.sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  current_step TEXT DEFAULT 'welcome',
  completed_steps JSONB DEFAULT '[]',
  step_data JSONB DEFAULT '{}',
  blocking_issues JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_pct INTEGER DEFAULT 0
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON onboarding_progress
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_onboarding_progress_tenant ON onboarding_progress(tenant_id);
