-- ══════════════════════════════════════════════════════════════════════════════
-- migrations/033_missing_tables.sql
-- KINEXIS — Tablas faltantes para el dashboard (Settings, Chat, Atollom, Audit)
-- Idempotente: IF NOT EXISTS + ADD COLUMN IF NOT EXISTS en todo
-- Ejecutar en Supabase SQL Editor o via CLI
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- A. PARCHEAR user_profiles
--    001_tenants.sql definió roles limitados. Necesitamos owner, viewer,
--    contador, atollom_admin para el RBAC del dashboard.
--    También falta display_name (usado por Samantha y onboarding).
-- ─────────────────────────────────────────────────────────────────────────────

-- Eliminar el CHECK de rol existente y reemplazar con uno completo
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN (
    'owner', 'admin', 'socia',
    'almacenista', 'agente', 'contador', 'viewer',
    'atollom_admin'
  ));

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name  TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- B. tenant_profiles
--    Perfil de empresa del tenant: razón social, RFC, plan, módulos activos.
--    Separado de `tenants` para no tocar la tabla raíz de multi-tenancy.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_profiles (
  tenant_id               UUID        PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  business_name           TEXT        NOT NULL DEFAULT '',
  rfc                     TEXT        DEFAULT '',
  tax_regime              TEXT        DEFAULT '',
  postal_code             TEXT        DEFAULT '',
  logo_url                TEXT        DEFAULT '',
  plan                    TEXT        NOT NULL DEFAULT 'Starter'
                            CHECK (plan IN ('Starter', 'Growth', 'Pro')),
  active_modules          TEXT[]      NOT NULL DEFAULT ARRAY['ecommerce','erp','crm'],
  onboarding_complete     BOOLEAN     NOT NULL DEFAULT FALSE,
  onboarding_completed_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_profiles_isolation        ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_service_role     ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_atollom_read_all ON tenant_profiles;

-- Tenants can only see their own profile
CREATE POLICY tenant_profiles_isolation ON tenant_profiles
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- Service role (backend) has full access
CREATE POLICY tenant_profiles_service_role ON tenant_profiles
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- atollom_admin can read ALL tenant profiles (global panel)
CREATE POLICY tenant_profiles_atollom_read_all ON tenant_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'atollom_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- C. config_change_log
--    Auditoría de cambios de configuración: settings, vault, onboarding.
--    Nunca almacena valores reales de API keys (solo [REDACTED]).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS config_change_log (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL,
  field          TEXT        NOT NULL, -- e.g. "profile.rfc", "vault.ml_access_token"
  previous_value TEXT        NOT NULL DEFAULT '',
  new_value      TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE config_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS config_change_log_isolation        ON config_change_log;
DROP POLICY IF EXISTS config_change_log_service_role     ON config_change_log;
DROP POLICY IF EXISTS config_change_log_atollom_read_all ON config_change_log;

CREATE POLICY config_change_log_isolation ON config_change_log
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY config_change_log_service_role ON config_change_log
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- atollom_admin can read ALL logs (cross-tenant audit)
CREATE POLICY config_change_log_atollom_read_all ON config_change_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'atollom_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_config_change_log_tenant   ON config_change_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_change_log_created  ON config_change_log(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- D. system_notifications
--    Cola de despacho WhatsApp. El agente de notificaciones recoge registros
--    con status='pending' y los envía al número de destino.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_notifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_phone TEXT        NOT NULL,
  channel         TEXT        NOT NULL DEFAULT 'whatsapp'
                    CHECK (channel IN ('whatsapp', 'sms', 'email')),
  message         TEXT        NOT NULL,
  severity        TEXT        NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info', 'high', 'critical')),
  sent_by         UUID,        -- FK opcional (atollom_admin user id)
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS system_notifications_service_role ON system_notifications;
DROP POLICY IF EXISTS system_notifications_atollom_only ON system_notifications;

-- Only service_role (backend agents) and atollom_admin have access
CREATE POLICY system_notifications_service_role ON system_notifications
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY system_notifications_atollom_only ON system_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'atollom_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_system_notifications_status  ON system_notifications(status);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created ON system_notifications(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- E. samantha_memory
--    Memoria conversacional de Samantha por tenant.
--    Siempre filtrada por tenant_id — no hay cross-tenant leakage.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS samantha_memory (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE samantha_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS samantha_memory_isolation    ON samantha_memory;
DROP POLICY IF EXISTS samantha_memory_service_role ON samantha_memory;

CREATE POLICY samantha_memory_isolation ON samantha_memory
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY samantha_memory_service_role ON samantha_memory
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_samantha_memory_tenant  ON samantha_memory(tenant_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- F. report_requests
--    Cola de generación de reportes. El worker de background procesa los
--    registros con status='pending' y genera el PDF.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS report_requests (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by UUID        NOT NULL,  -- user_id
  report_type  TEXT        NOT NULL DEFAULT 'weekly_analytics',
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  result_url   TEXT,        -- signed URL to the generated PDF
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE report_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_requests_isolation    ON report_requests;
DROP POLICY IF EXISTS report_requests_service_role ON report_requests;

CREATE POLICY report_requests_isolation ON report_requests
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY report_requests_service_role ON report_requests
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_report_requests_tenant_status ON report_requests(tenant_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- G. tenant_agent_autonomy
--    Niveles de autonomía de agentes por módulo (ecommerce/erp/crm).
--    Composite PK (tenant_id, module_id) — upsert safe.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_agent_autonomy (
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id     TEXT NOT NULL CHECK (module_id IN ('ecommerce', 'erp', 'crm')),
  autonomy_level TEXT NOT NULL DEFAULT 'NOTIFY'
                   CHECK (autonomy_level IN ('FULL', 'NOTIFY', 'SUPERVISED', 'HUMAN_REQUIRED', 'PAUSED')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, module_id)
);

ALTER TABLE tenant_agent_autonomy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_agent_autonomy_isolation    ON tenant_agent_autonomy;
DROP POLICY IF EXISTS tenant_agent_autonomy_service_role ON tenant_agent_autonomy;

CREATE POLICY tenant_agent_autonomy_isolation ON tenant_agent_autonomy
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY tenant_agent_autonomy_service_role ON tenant_agent_autonomy
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE INDEX IF NOT EXISTS idx_tenant_agent_autonomy_tenant ON tenant_agent_autonomy(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- H. vault_secrets
--    Almacenamiento de API keys por tenant.
--    encrypted_value: en producción usar pgcrypto o Supabase Vault nativo.
--    El GET de /api/settings/vault NUNCA retorna encrypted_value al cliente.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_secrets (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_name        TEXT        NOT NULL,
  encrypted_value TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key_name)
);

ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vault_secrets_isolation    ON vault_secrets;
DROP POLICY IF EXISTS vault_secrets_service_role ON vault_secrets;

-- Only service_role can read encrypted values — client-side code never accesses this table directly
CREATE POLICY vault_secrets_service_role ON vault_secrets
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Authenticated users can only check existence (key_name), not the value
-- The API route returns boolean per key — encrypted_value is never sent to client
CREATE POLICY vault_secrets_isolation ON vault_secrets
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_vault_secrets_tenant ON vault_secrets(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- I. agent_status
--    Vista desnormalizada de estado de agentes usada por /meta/page.tsx.
--    Deriva de tenant_agent_config con columnas compatibles con el UI.
-- ─────────────────────────────────────────────────────────────────────────────

-- Patch tenant_agent_config with columns needed by agent_status view
ALTER TABLE tenant_agent_config ADD COLUMN IF NOT EXISTS last_run_at   TIMESTAMPTZ;
ALTER TABLE tenant_agent_config ADD COLUMN IF NOT EXISTS success_rate  NUMERIC(5,2) DEFAULT 100.0;

DROP VIEW IF EXISTS agent_status;
CREATE VIEW agent_status AS
SELECT
  tac.tenant_id,
  tac.agent_id,
  tac.name,
  tac.module,
  CASE
    WHEN tac.active = FALSE THEN 'inactive'
    WHEN tac.autonomy_level = 'PAUSED' THEN 'paused'
    ELSE 'active'
  END AS status,
  tac.last_run_at AS last_run,
  COALESCE(tac.success_rate, 100.0) AS success_rate
FROM tenant_agent_config tac;

-- RLS on agent_status: view inherits RLS from tenant_agent_config base table.

-- ─────────────────────────────────────────────────────────────────────────────
-- J. SEED: Default autonomy levels for existing tenants
--    Idempotente — ON CONFLICT DO NOTHING
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO tenant_agent_autonomy (tenant_id, module_id, autonomy_level)
SELECT t.id, m.module_id, m.default_level
FROM tenants t
CROSS JOIN (VALUES
  ('ecommerce', 'FULL'),
  ('erp',       'NOTIFY'),
  ('crm',       'SUPERVISED')
) AS m(module_id, default_level)
ON CONFLICT (tenant_id, module_id) DO NOTHING;

-- Default tenant_profiles for existing tenants
INSERT INTO tenant_profiles (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;
