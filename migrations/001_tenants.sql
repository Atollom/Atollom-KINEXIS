-- migrations/001_tenants.sql
-- KINEXIS — Gestión de Multi-tenancy

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'socia', 'almacenista', 'agente')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Configuración CFDI por Tenant (Kap Tools Core)
CREATE TABLE IF NOT EXISTS cfdi_tenant_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    rfc_emisor TEXT NOT NULL,
    nombre_emisor TEXT NOT NULL,
    regimen_fiscal TEXT NOT NULL,
    cp_expedicion TEXT NOT NULL,
    serie_ingreso TEXT DEFAULT 'F',
    serie_egreso TEXT DEFAULT 'NC',
    serie_pago TEXT DEFAULT 'P',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfdi_tenant_config ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS Iniciales (Super Admin y Tenant Isolation)
-- Nota: En producción, auth.uid() debe estar vinculado al tenant_id del perfil.

CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL USING (id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY profile_tenant_policy ON user_profiles
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY cfdi_config_policy ON cfdi_tenant_config
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- 6. Seed Inicial: Kap Tools SA de CV
DO $$
DECLARE
    kap_tenant_id UUID := '40446806-0107-6201-9311-000000000001'; -- UUID determinado para Kap Tools
BEGIN
    INSERT INTO tenants (id, name)
    VALUES (kap_tenant_id, 'Kap Tools SA de CV')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO cfdi_tenant_config (
        tenant_id, rfc_emisor, nombre_emisor, regimen_fiscal, cp_expedicion, serie_ingreso, serie_egreso, serie_pago
    )
    VALUES (
        kap_tenant_id, 
        'KTO2202178K8', 
        'KAP TOOLS SA DE CV', 
        '601', 
        '72973', 
        'KT', 
        'KTNC', 
        'KTP'
    )
    ON CONFLICT (tenant_id) DO NOTHING;
END $$;
