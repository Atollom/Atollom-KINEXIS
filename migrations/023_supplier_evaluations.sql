-- migrations/023_supplier_evaluations.sql
CREATE TABLE supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID NOT NULL REFERENCES approved_suppliers(id),
  evaluation_type TEXT NOT NULL,
  score_precio INTEGER CHECK (score_precio BETWEEN 0 AND 100),
  score_calidad INTEGER CHECK (score_calidad BETWEEN 0 AND 100),
  score_tiempo INTEGER CHECK (score_tiempo BETWEEN 0 AND 100),
  score_total INTEGER CHECK (score_total BETWEEN 0 AND 100),
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON supplier_evaluations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_supplier_evaluations_tenant_supplier ON supplier_evaluations(tenant_id, supplier_id);
CREATE INDEX idx_supplier_evaluations_type_at ON supplier_evaluations(evaluation_type, evaluated_at DESC);
