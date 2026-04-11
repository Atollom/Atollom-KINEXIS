-- migrations/012_b2b_accounts.sql

CREATE TABLE b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  company_name TEXT,
  contact_phone TEXT,
  mrr DECIMAL(12,2) DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 100
    CHECK (health_score BETWEEN 0 AND 100),
  nps_last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  account_id UUID REFERENCES b2b_accounts(id),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- RLS estándar en ambas tablas
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Índices recomendados
CREATE INDEX idx_b2b_accounts_tenant_health ON b2b_accounts(tenant_id, health_score);
CREATE INDEX idx_b2b_accounts_tenant_last_purchase ON b2b_accounts(tenant_id, last_purchase_at);
CREATE INDEX idx_b2b_accounts_tenant_nps_sent ON b2b_accounts(tenant_id, nps_last_sent_at);
