-- Add FacturAPI organization ID to tenants.
-- KINEXIS distributor model: one org per tenant RFC.

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS facturapi_org_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tenants_facturapi_org
    ON tenants(facturapi_org_id)
    WHERE facturapi_org_id IS NOT NULL;

COMMENT ON COLUMN tenants.facturapi_org_id IS
    'FacturAPI organization ID — created automatically during onboarding when RFC is provided.';

-- Also add to tenant_fiscal_config for quick lookup during CFDI timbrado
ALTER TABLE tenant_fiscal_config
    ADD COLUMN IF NOT EXISTS facturapi_org_id VARCHAR(255);

COMMENT ON COLUMN tenant_fiscal_config.facturapi_org_id IS
    'Mirrors tenants.facturapi_org_id for JOIN-free access during invoice creation.';
