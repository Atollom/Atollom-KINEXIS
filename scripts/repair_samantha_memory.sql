-- ══════════════════════════════════════════════════════════════════════════════
-- REPARACIÓN DEFINITIVA MEMORIA SAMANTHA
-- Combina 033_missing_tables + 038_NUCLEAR_RLS_FIX
-- Ejecutar en Supabase SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: CREAR TABLAS FALTANTES (migración 033)
-- ─────────────────────────────────────────────────────────────────────────────

-- E. samantha_memory
CREATE TABLE IF NOT EXISTS samantha_memory (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question   TEXT        NOT NULL,
  answer     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE samantha_memory ENABLE ROW LEVEL SECURITY;

-- Otros objetos de 033 que también faltan
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

CREATE TABLE IF NOT EXISTS config_change_log (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID        NOT NULL,
  field          TEXT        NOT NULL,
  previous_value TEXT        NOT NULL DEFAULT '',
  new_value      TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE config_change_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS system_notifications (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_phone TEXT        NOT NULL,
  channel         TEXT        NOT NULL DEFAULT 'whatsapp'
                    CHECK (channel IN ('whatsapp', 'sms', 'email')),
  message         TEXT        NOT NULL,
  severity        TEXT        NOT NULL DEFAULT 'info'
                    CHECK (severity IN ('info', 'high', 'critical')),
  sent_by         UUID,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS report_requests (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by UUID        NOT NULL,
  report_type  TEXT        NOT NULL DEFAULT 'weekly_analytics',
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  result_url   TEXT,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE report_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tenant_agent_autonomy (
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id     TEXT NOT NULL CHECK (module_id IN ('ecommerce', 'erp', 'crm')),
  autonomy_level TEXT NOT NULL DEFAULT 'NOTIFY'
                   CHECK (autonomy_level IN ('FULL', 'NOTIFY', 'SUPERVISED', 'HUMAN_REQUIRED', 'PAUSED')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, module_id)
);
ALTER TABLE tenant_agent_autonomy ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS vault_secrets (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_name        TEXT        NOT NULL,
  encrypted_value TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key_name)
);
ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: EJECUTAR NUCLEAR RLS FIX (038)
-- ─────────────────────────────────────────────────────────────────────────────

-- Función SECURITY DEFINER sin recursión
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon;

-- Eliminar TODAS las policies de user_profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', pol.policyname);
    RAISE NOTICE 'Eliminada policy: %', pol.policyname;
  END LOOP;
END $$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Recrear policies correctas
CREATE POLICY "up_self_read" ON user_profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "up_tenant_read" ON user_profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "up_self_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "up_service_all" ON user_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "up_service_insert" ON user_profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- Actualizar policies de samantha_memory
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'samantha_memory' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.samantha_memory', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.samantha_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_isolation" ON samantha_memory FOR ALL USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "sm_service" ON samantha_memory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de tenant_profiles
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_profiles' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_profiles', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_isolation" ON tenant_profiles FOR ALL USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "tp_service" ON tenant_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de config_change_log
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'config_change_log' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.config_change_log', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.config_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccl_isolation" ON config_change_log FOR ALL USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "ccl_service" ON config_change_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de system_notifications
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'system_notifications' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_notifications', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sn_service" ON system_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de report_requests
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'report_requests' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_requests', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr_isolation" ON report_requests FOR ALL USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "rr_service" ON report_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de tenant_agent_autonomy
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_agent_autonomy' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_agent_autonomy', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.tenant_agent_autonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taa_isolation" ON tenant_agent_autonomy FOR ALL USING (tenant_id = public.get_my_tenant_id());
CREATE POLICY "taa_service" ON tenant_agent_autonomy FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Actualizar policies de vault_secrets
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vault_secrets' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vault_secrets', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.vault_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vs_service" ON vault_secrets FOR ALL TO service_role USING (true);
CREATE POLICY "vs_read" ON vault_secrets FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- Actualizar policies de tenants
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenants' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "t_isolation" ON tenants FOR ALL USING (id = public.get_my_tenant_id());
CREATE POLICY "t_service" ON tenants FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_samantha_memory_tenant  ON samantha_memory(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_tenant ON tenant_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_change_log_tenant   ON config_change_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_change_log_created  ON config_change_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_notifications_status  ON system_notifications(status);
CREATE INDEX IF NOT EXISTS idx_report_requests_tenant_status ON report_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_agent_autonomy_tenant ON tenant_agent_autonomy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vault_secrets_tenant ON vault_secrets(tenant_id);

-- Seed defaults
INSERT INTO tenant_agent_autonomy (tenant_id, module_id, autonomy_level)
SELECT t.id, m.module_id, m.default_level
FROM tenants t
CROSS JOIN (VALUES
  ('ecommerce', 'FULL'),
  ('erp',       'NOTIFY'),
  ('crm',       'SUPERVISED')
) AS m(module_id, default_level)
ON CONFLICT (tenant_id, module_id) DO NOTHING;

INSERT INTO tenant_profiles (tenant_id)
SELECT id FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Verificación final
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('samantha_memory', 'user_profiles', 'tenant_profiles')
ORDER BY tablename, policyname;

DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ REPARACIÓN COMPLETA';
  RAISE NOTICE '✅ Tabla samantha_memory CREADA';
  RAISE NOTICE '✅ CERO recursión en RLS';
  RAISE NOTICE '✅ Todas las policies actualizadas';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '🔄 Samantha ahora recuerda tus conversaciones.';
END $$;

COMMIT;