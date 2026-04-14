-- migrations/034_multi_empresa.sql
-- KINEXIS — Estructura Multi-empresa por Tenant
-- Soporte para múltiples razones sociales por cada tenant con una empresa principal.

-- 1. Tabla de Empresas por Tenant
CREATE TABLE IF NOT EXISTS tenant_empresas (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre           TEXT        NOT NULL,
  rfc              TEXT        NOT NULL,
  regimen_fiscal   TEXT        NOT NULL,
  cp_expedicion    TEXT        NOT NULL,
  facturapi_org_id TEXT,
  es_principal     BOOLEAN     DEFAULT FALSE,
  activa           BOOLEAN     DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restricción: Solo una empresa principal por tenant
-- Usamos un índice único parcial para asegurar que solo haya un 'true' por tenant_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_principal_per_tenant 
ON tenant_empresas (tenant_id) 
WHERE (es_principal = TRUE);

-- 3. Habilitar RLS
ALTER TABLE tenant_empresas ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
DROP POLICY IF EXISTS tenant_empresas_isolation ON tenant_empresas;
CREATE POLICY tenant_empresas_isolation ON tenant_empresas
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tenant_empresas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_tenant_empresas_timestamp ON tenant_empresas;
CREATE TRIGGER tr_update_tenant_empresas_timestamp
BEFORE UPDATE ON tenant_empresas
FOR EACH ROW
EXECUTE FUNCTION update_tenant_empresas_timestamp();

-- 6. Migración de Datos Existentes
-- Insertamos en tenant_empresas los datos actuales de tenant_profiles
DO $$
BEGIN
  INSERT INTO tenant_empresas (tenant_id, nombre, rfc, regimen_fiscal, cp_expedicion, es_principal)
  SELECT 
    tenant_id, 
    business_name, 
    rfc, 
    tax_regime, 
    postal_code,
    TRUE -- Marcar como principal los datos existentes
  FROM tenant_profiles
  WHERE rfc IS NOT NULL AND rfc != ''
  ON CONFLICT DO NOTHING;
END $$;

-- 7. Comentarios (español)
COMMENT ON TABLE tenant_empresas IS 'Registro de múltiples razones sociales o empresas asociadas a un tenant.';
COMMENT ON COLUMN tenant_empresas.facturapi_org_id IS 'ID de la organización en FacturAPI específica para esta empresa.';
COMMENT ON COLUMN tenant_empresas.es_principal IS 'Indica si es la razón social por defecto para ese tenant.';
