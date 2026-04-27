-- KINEXIS Core Tables: tenants, tenant_integrations, users
-- Autor: Carlos Cortés (Atollom Labs)
-- Fecha: 2026-04-21
-- Nota: tenant_fiscal_config ya creada en 001_add_cfdi_tables.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Tenants (empresas / clientes de Atollom)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos básicos
  name                    VARCHAR(255) NOT NULL,
  slug                    VARCHAR(100) UNIQUE NOT NULL,

  -- Datos fiscales rápidos (fuente canónica: tenant_fiscal_config)
  rfc                     VARCHAR(13),
  legal_name              VARCHAR(255),

  -- Contacto
  email                   VARCHAR(255),
  phone                   VARCHAR(20),
  address                 TEXT,

  -- Branding
  logo_url                TEXT,

  -- Plan y billing
  plan                    VARCHAR(20)  NOT NULL DEFAULT 'starter',
  -- starter | growth | pro | enterprise

  -- Status
  status                  VARCHAR(20)  NOT NULL DEFAULT 'trial',
  -- trial | active | suspended | cancelled
  trial_ends_at           TIMESTAMPTZ,

  -- Onboarding
  onboarding_completed    BOOLEAN      NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT check_plan   CHECK (plan   IN ('starter', 'growth', 'pro', 'enterprise')),
  CONSTRAINT check_status CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  CONSTRAINT check_slug   CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug   ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan   ON tenants(plan);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tenant Integrations (API credentials encriptadas)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Provider
  provider          VARCHAR(50)  NOT NULL,
  -- mercadolibre | amazon | shopify | whatsapp | instagram | facebook
  -- stripe | facturama | facturapi

  -- Credenciales encriptadas con Fernet (AES-128-CBC)
  config            TEXT         NOT NULL,

  -- Estado de conexión
  is_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
  is_connected      BOOLEAN      NOT NULL DEFAULT FALSE,
  last_test_at      TIMESTAMPTZ,
  last_test_result  JSONB,

  -- Metadata
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  UNIQUE (tenant_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_tenant   ON tenant_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON tenant_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled  ON tenant_integrations(is_enabled);

-- ─────────────────────────────────────────────────────────────────────────────
-- Users (empleados / acceso al dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Identidad
  email             VARCHAR(255) UNIQUE NOT NULL,
  full_name         VARCHAR(255) NOT NULL,
  avatar_url        TEXT,

  -- Rol RBAC
  role              VARCHAR(20)  NOT NULL DEFAULT 'agente',
  -- owner | admin | agente | almacenista | contador

  -- Auth (compatible con Supabase Auth — password_hash null si usa OAuth)
  password_hash     TEXT,
  supabase_user_id  UUID,

  -- Estado
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  email_confirmed   BOOLEAN      NOT NULL DEFAULT FALSE,
  last_login_at     TIMESTAMPTZ,

  -- Metadata
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT check_role CHECK (
    role IN ('owner', 'admin', 'agente', 'almacenista', 'contador')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger updated_at (compartido)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Vista: resumen para dashboard admin Atollom
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW tenants_overview AS
SELECT
  t.id,
  t.name,
  t.slug,
  t.plan,
  t.status,
  t.onboarding_completed,
  t.created_at,
  COUNT(DISTINCT u.id)  FILTER (WHERE u.is_active)          AS user_count,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.is_enabled)        AS integration_count,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.is_connected)      AS integrations_connected,
  tfc.invoice_limit_monthly,
  tfc.invoices_used_current_month
FROM tenants t
LEFT JOIN users                u   ON t.id = u.tenant_id
LEFT JOIN tenant_integrations  ti  ON t.id = ti.tenant_id
LEFT JOIN tenant_fiscal_config tfc ON t.id = tfc.tenant_id
GROUP BY t.id, t.name, t.slug, t.plan, t.status,
         t.onboarding_completed, t.created_at,
         tfc.invoice_limit_monthly, tfc.invoices_used_current_month;
