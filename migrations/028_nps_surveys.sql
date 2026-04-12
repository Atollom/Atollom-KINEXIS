-- migrations/028_nps_surveys.sql
CREATE TABLE nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT,
  customer_contact TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','responded','expired')),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  promoter_type TEXT CHECK (promoter_type IN ('promoter','passive','detractor')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON nps_surveys
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_nps_surveys_tenant_contact ON nps_surveys(tenant_id, customer_contact);
CREATE INDEX idx_nps_surveys_tenant_status ON nps_surveys(tenant_id, status);
CREATE INDEX idx_nps_surveys_sent_at ON nps_surveys(sent_at DESC);
