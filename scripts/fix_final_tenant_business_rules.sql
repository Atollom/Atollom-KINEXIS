-- ══════════════════════════════════════════════════════════════════════════════
-- SOLUCIÓN DEFINITIVA ÚLTIMO ERROR
-- Tabla tenant_business_rules que faltaba y causaba el crash
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Crear tabla faltante que causa el error Digest 3532962870
CREATE TABLE IF NOT EXISTS tenant_business_rules (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  stock_critical_days INTEGER NOT NULL DEFAULT 7,
  minimum_margin DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  auto_approve_orders_below DECIMAL(12,2) NOT NULL DEFAULT 1000.00,
  require_invoice_above DECIMAL(12,2) NOT NULL DEFAULT 2000.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenant_business_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tbr_isolation ON tenant_business_rules;
DROP POLICY IF EXISTS tbr_service ON tenant_business_rules;

CREATE POLICY tbr_isolation ON tenant_business_rules
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY tbr_service ON tenant_business_rules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insertar valores por defecto para TODOS los tenants existentes
INSERT INTO tenant_business_rules (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

SELECT '✅ ÚLTIMA TABLA CREADA. El dashboard cargará AHORA.' AS status;
