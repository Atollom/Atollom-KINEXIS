-- migrations/013_import_shipments.sql

CREATE TABLE import_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  po_id UUID REFERENCES purchase_orders(id),
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  status TEXT DEFAULT 'in_transit'
    CHECK (status IN (
      'in_transit', 'customs_cleared',
      'received', 'delayed', 'cancelled')),
  eta DATE,
  eta_original DATE,
  customs_reference TEXT,
  received_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE import_shipments ENABLE ROW LEVEL SECURITY;

-- Índices recomendados
CREATE INDEX idx_import_shipments_tenant_status ON import_shipments(tenant_id, status);
CREATE INDEX idx_import_shipments_tenant_po ON import_shipments(tenant_id, po_id);
CREATE INDEX idx_import_shipments_eta ON import_shipments(eta);
