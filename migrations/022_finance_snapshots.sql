-- migrations/022_finance_snapshots.sql
CREATE TABLE finance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue DECIMAL(14,2) DEFAULT 0,
  costs DECIMAL(14,2) DEFAULT 0,
  gross_margin DECIMAL(14,2) DEFAULT 0,
  cash_balance DECIMAL(14,2) DEFAULT 0,
  projection_30d DECIMAL(14,2) DEFAULT 0,
  alerts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON finance_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_finance_snapshots_tenant_period ON finance_snapshots(tenant_id, period_start);
CREATE INDEX idx_finance_snapshots_created_at ON finance_snapshots(created_at DESC);
