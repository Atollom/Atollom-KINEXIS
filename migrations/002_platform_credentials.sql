-- migrations/002_platform_credentials.sql
-- KINEXIS — Gestión de Credenciales con Vault (pgsodium)

-- 1. Tabla de Credenciales por Plataforma
-- Se agrupa por tenant_id para asegurar aislamiento total.
CREATE TABLE IF NOT EXISTS platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    platform_name TEXT NOT NULL CHECK (platform_name IN ('ml', 'amazon', 'shopify', 'meta', 'facturapi', 'skydrop', 'resend')),
    key_name TEXT NOT NULL, -- e.g., 'API_KEY', 'CLIENT_SECRET'
    encrypted_value TEXT NOT NULL, -- El valor real se maneja vía pgsodium en la app layer o vía serverless functions
    vault_secret_id UUID, -- Referencia opcional al ID en vault.secrets si se usa integración nativa Supabase
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, platform_name, key_name)
);

-- 2. Habilitar RLS
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Política de RLS
CREATE POLICY platform_credentials_isolation ON platform_credentials
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- 4. Comentario sobre Vault
COMMENT ON TABLE platform_credentials IS 'Almacena referencias a credenciales de plataformas. Los valores sensibles deben ser cifrados vía pgsodium.';
