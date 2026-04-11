-- migrations/011_support_tickets.sql

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT,
  contact_phone TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  status TEXT DEFAULT 'open'
    CHECK (status IN (
      'open', 'resolved', 'escalated')),
  turn_count INTEGER DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON support_tickets
  FOR ALL USING (tenant_id = auth.uid()); -- O el mecanimos que usen, pero aquí lo implementamos vía código en el agente

-- Índices recomendados
CREATE INDEX idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);
CREATE INDEX idx_support_tickets_tenant_phone ON support_tickets(tenant_id, contact_phone);
CREATE INDEX idx_support_tickets_order_id ON support_tickets(order_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
