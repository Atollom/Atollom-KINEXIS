-- ══════════════════════════════════════════════════════════════════════════════
-- 038_NUCLEAR_RLS_FIX.sql — SOLUCIÓN DEFINITIVA
-- 
-- Este script hace 3 cosas:
-- 1. DESHABILITA RLS temporalmente en user_profiles
-- 2. ELIMINA **TODAS** las policies (sin importar el nombre)
-- 3. Recrea SOLO las policies necesarias (sin subqueries recursivos)
--
-- EJECUTAR EN: Supabase SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 0: Crear la función SECURITY DEFINER (si no existe)
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 1: NUCLEAR — Eliminar ABSOLUTAMENTE TODAS las policies de user_profiles
-- (sin importar cómo se llamen)
-- ═══════════════════════════════════════════════════════════════════════════

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

-- Asegurarse que RLS esté habilitado (lo necesitamos, pero con policies correctas)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 2: Recrear SOLO las policies seguras para user_profiles
-- ═══════════════════════════════════════════════════════════════════════════

-- A) Cada usuario puede leer SU PROPIO perfil (CERO subqueries)
CREATE POLICY "up_self_read" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- B) Usuarios del mismo tenant se ven entre sí (via SECURITY DEFINER function)
CREATE POLICY "up_tenant_read" ON user_profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- C) Update solo tu propio perfil
CREATE POLICY "up_self_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- D) Service role tiene acceso total
CREATE POLICY "up_service_all" ON user_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- E) Insert solo por service_role
CREATE POLICY "up_service_insert" ON user_profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 3: NUCLEAR — Limpiar policies de TODAS las otras tablas
-- ═══════════════════════════════════════════════════════════════════════════

-- tenants
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

-- tenant_profiles
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_profiles' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_profiles', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "tp_isolation" ON tenant_profiles FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY "tp_service" ON tenant_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- config_change_log
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'config_change_log' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.config_change_log', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.config_change_log ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "ccl_isolation" ON config_change_log FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY "ccl_service" ON config_change_log FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- system_notifications
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'system_notifications' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_notifications', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "sn_service" ON system_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- samantha_memory
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'samantha_memory' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.samantha_memory', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.samantha_memory ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "sm_isolation" ON samantha_memory FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY "sm_service" ON samantha_memory FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- report_requests
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'report_requests' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.report_requests', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.report_requests ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "rr_isolation" ON report_requests FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY "rr_service" ON report_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- tenant_agent_autonomy
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'tenant_agent_autonomy' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_agent_autonomy', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.tenant_agent_autonomy ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "taa_isolation" ON tenant_agent_autonomy FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY "taa_service" ON tenant_agent_autonomy FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- vault_secrets
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'vault_secrets' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.vault_secrets', pol.policyname);
  END LOOP;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.vault_secrets ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "vs_service" ON vault_secrets FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "vs_read" ON vault_secrets FOR SELECT USING (tenant_id = public.get_my_tenant_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 4: Tablas de negocio — limpiar y recrear con get_my_tenant_id()
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  pol RECORD;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'orders', 'products', 'customers', 'inventory', 'purchase_orders',
    'leads', 'quotes', 'cfdi_records', 'cfdi_tenant_config',
    'platform_credentials', 'agent_logs', 'print_queue',
    'whatsapp_messages', 'support_tickets', 'tenant_agent_config',
    'tenant_business_rules', 'wa_conversations', 'wa_messages'
  ] LOOP
    -- Verificar que la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      -- Eliminar TODAS sus policies
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
        RAISE NOTICE 'Eliminada: %.%', tbl, pol.policyname;
      END LOOP;
      
      -- Habilitar RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      
      -- Crear isolation policy
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (tenant_id = public.get_my_tenant_id())',
        tbl || '_iso', tbl);
      
      -- Crear service_role policy
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        tbl || '_svc', tbl);
      
      RAISE NOTICE '✅ % — policies recreadas', tbl;
    ELSE
      RAISE NOTICE '⏭️ % — tabla no existe, saltando', tbl;
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASO 5: VERIFICACIÓN — Listar policies resultantes
-- ═══════════════════════════════════════════════════════════════════════════

SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'tenants', 'tenant_profiles', 'orders', 'inventory')
ORDER BY tablename, policyname;

DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ 038_NUCLEAR_RLS_FIX completado';
  RAISE NOTICE '✅ CERO subqueries recursivos en user_profiles';
  RAISE NOTICE '✅ Todas las tablas usan get_my_tenant_id()';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '🔄 Recarga el dashboard ahora.';
END $$;
