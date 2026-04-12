-- migrations/025_crisis_events.sql
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  severity TEXT NOT NULL CHECK (severity IN ('level_1','level_2','level_3')),
  channel TEXT,
  trigger_type TEXT,
  content_summary TEXT,
  action_taken TEXT,
  ai_paused BOOLEAN DEFAULT FALSE,
  ads_paused BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON crisis_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_crisis_events_tenant_severity ON crisis_events(tenant_id, severity);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at DESC);
CREATE INDEX idx_crisis_events_ai_paused ON crisis_events(ai_paused) WHERE ai_paused = TRUE;
