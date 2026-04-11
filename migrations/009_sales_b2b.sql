-- Migration: 009_sales_b2b
-- Description: Tables for B2B sales management

-- B2B Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  order_id UUID REFERENCES orders(id),
  quote_number TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  iva DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  valid_until DATE NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN (
      'draft','sent','accepted',
      'rejected','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated follow-up queue
CREATE TABLE IF NOT EXISTS followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  agent_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','executed','cancelled')),
  context JSONB
);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quotes ON quotes
  FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY tenant_isolation_followup_queue ON followup_queue
  FOR ALL USING (tenant_id = auth.uid());

-- Indices
CREATE INDEX idx_quotes_tenant_status ON quotes(tenant_id, status);
CREATE INDEX idx_quotes_tenant_lead ON quotes(tenant_id, lead_id);
CREATE INDEX idx_followup_scheduled_at ON followup_queue(scheduled_at) WHERE status = 'pending';
