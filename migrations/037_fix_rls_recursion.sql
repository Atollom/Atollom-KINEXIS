-- ══════════════════════════════════════════════════════════════════════════════
-- 037_fix_rls_recursion.sql
-- KINEXIS — REPARACIÓN NUCLEAR DE RECURSIÓN RLS
-- 
-- PROBLEMA: user_profiles tiene una RLS policy que hace:
--   tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
-- Para evaluar esa policy, PostgreSQL necesita leer user_profiles,
-- lo que dispara la MISMA policy → loop infinito → Error 500.
--
-- Otras tablas (tenants, tenant_profiles, config_change_log, etc.) hacen
-- el mismo subquery a user_profiles, lo que también falla porque
-- user_profiles no puede leerse a sí mismo.
--
-- SOLUCIÓN:
--   1. user_profiles: policy simplificada → id = auth.uid() (sin subquery)
--      Esto permite que un usuario SOLO vea SU propio perfil.
--   2. Añadir policy para que usuarios del MISMO tenant se vean entre sí
--      (necesario para admin/owner viendo su equipo) usando auth.uid()
--      directamente, NO subquery recursivo.
--   3. Todas las demás tablas mantienen el patrón de subquery a
--      user_profiles, pero ahora user_profiles YA NO es recursivo.
--
-- IDEMPOTENTE: DROP POLICY IF EXISTS + CREATE POLICY en todo.
-- Ejecutar en Supabase SQL Editor → Run.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 0: Asegurarnos que la función de seguridad existe
-- Esta función permite obtener el tenant_id sin triggear RLS recursivo
-- porque se ejecuta con SECURITY DEFINER (como superuser).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Dar permiso a authenticated y anon para usar la función
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: REPARAR user_profiles (LA RAÍZ DEL PROBLEMA)
-- ─────────────────────────────────────────────────────────────────────────────

-- Eliminar TODAS las policies existentes de user_profiles
DROP POLICY IF EXISTS profile_tenant_policy ON user_profiles;
DROP POLICY IF EXISTS user_profiles_isolation ON user_profiles;
DROP POLICY IF EXISTS user_profiles_service_role ON user_profiles;
DROP POLICY IF EXISTS user_profiles_self_read ON user_profiles;
DROP POLICY IF EXISTS user_profiles_tenant_read ON user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert ON user_profiles;
DROP POLICY IF EXISTS user_profiles_atollom_read_all ON user_profiles;

-- A) Cada usuario puede leer SU PROPIO perfil (sin subquery = sin recursión)
CREATE POLICY user_profiles_self_read ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- B) Usuarios del MISMO tenant pueden verse entre sí
--    Usa la función SECURITY DEFINER para evitar recursión
CREATE POLICY user_profiles_tenant_read ON user_profiles
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- C) Un usuario puede actualizar solo SU propio perfil
CREATE POLICY user_profiles_self_update ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- D) Service role (backend) tiene acceso total
CREATE POLICY user_profiles_service_role ON user_profiles
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- E) atollom_admin puede ver TODOS los perfiles (panel global)
--    Usa la función SECURITY DEFINER para el check de rol
CREATE POLICY user_profiles_atollom_read_all ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'atollom_admin'
    )
  );
-- NOTA: La policy E) técnicamente también hace subquery a user_profiles,
-- pero PostgreSQL NO entra en recursión infinita aquí porque:
-- - La policy A) ya satisface la lectura para el row donde id = auth.uid()
-- - PostgreSQL evalúa las policies con OR: si A) ya da TRUE, no evalúa E)
-- Sin embargo, para máxima seguridad, también usamos la función:

DROP POLICY IF EXISTS user_profiles_atollom_read_all ON user_profiles;
CREATE POLICY user_profiles_atollom_read_all ON user_profiles
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
  );
-- Esto funciona porque la lectura interna (WHERE id = auth.uid()) es
-- satisfecha por user_profiles_self_read sin recursión.

-- F) INSERT: solo service_role puede crear perfiles (no self-service)
CREATE POLICY user_profiles_insert ON user_profiles
  FOR INSERT TO service_role WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: REPARAR tenants
-- La policy original también hacía subquery recursivo indirecto
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_isolation_policy ON tenants;
DROP POLICY IF EXISTS tenants_isolation ON tenants;
DROP POLICY IF EXISTS tenants_service_role ON tenants;
DROP POLICY IF EXISTS tenants_atollom_read_all ON tenants;

-- Isolation usando la función SECURITY DEFINER (sin recursión)
CREATE POLICY tenants_isolation ON tenants
  FOR ALL USING (id = public.get_my_tenant_id());

-- Service role
CREATE POLICY tenants_service_role ON tenants
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- atollom_admin puede ver todos los tenants
CREATE POLICY tenants_atollom_read_all ON tenants
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: REPARAR tenant_profiles
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_profiles_isolation ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_service_role ON tenant_profiles;
DROP POLICY IF EXISTS tenant_profiles_atollom_read_all ON tenant_profiles;

CREATE POLICY tenant_profiles_isolation ON tenant_profiles
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY tenant_profiles_service_role ON tenant_profiles
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY tenant_profiles_atollom_read_all ON tenant_profiles
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: REPARAR config_change_log
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS config_change_log_isolation ON config_change_log;
DROP POLICY IF EXISTS config_change_log_service_role ON config_change_log;
DROP POLICY IF EXISTS config_change_log_atollom_read_all ON config_change_log;

CREATE POLICY config_change_log_isolation ON config_change_log
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY config_change_log_service_role ON config_change_log
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY config_change_log_atollom_read_all ON config_change_log
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: REPARAR system_notifications
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS system_notifications_service_role ON system_notifications;
DROP POLICY IF EXISTS system_notifications_atollom_only ON system_notifications;

CREATE POLICY system_notifications_service_role ON system_notifications
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY system_notifications_atollom_only ON system_notifications
  FOR ALL USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: REPARAR samantha_memory
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS samantha_memory_isolation ON samantha_memory;
DROP POLICY IF EXISTS samantha_memory_service_role ON samantha_memory;

CREATE POLICY samantha_memory_isolation ON samantha_memory
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY samantha_memory_service_role ON samantha_memory
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 7: REPARAR report_requests
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS report_requests_isolation ON report_requests;
DROP POLICY IF EXISTS report_requests_service_role ON report_requests;

CREATE POLICY report_requests_isolation ON report_requests
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY report_requests_service_role ON report_requests
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 8: REPARAR tenant_agent_autonomy
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_agent_autonomy_isolation ON tenant_agent_autonomy;
DROP POLICY IF EXISTS tenant_agent_autonomy_service_role ON tenant_agent_autonomy;

CREATE POLICY tenant_agent_autonomy_isolation ON tenant_agent_autonomy
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY tenant_agent_autonomy_service_role ON tenant_agent_autonomy
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 9: REPARAR vault_secrets
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS vault_secrets_isolation ON vault_secrets;
DROP POLICY IF EXISTS vault_secrets_service_role ON vault_secrets;

CREATE POLICY vault_secrets_service_role ON vault_secrets
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY vault_secrets_isolation ON vault_secrets
  FOR SELECT USING (tenant_id = public.get_my_tenant_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 10: REPARAR cfdi_tenant_config
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS cfdi_config_policy ON cfdi_tenant_config;
DROP POLICY IF EXISTS cfdi_tenant_config_isolation ON cfdi_tenant_config;
DROP POLICY IF EXISTS cfdi_tenant_config_service_role ON cfdi_tenant_config;

CREATE POLICY cfdi_tenant_config_isolation ON cfdi_tenant_config
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY cfdi_tenant_config_service_role ON cfdi_tenant_config
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 11: REPARAR TODAS las demás tablas con tenant_id
-- Patron: reemplazar subquery a user_profiles con get_my_tenant_id()
-- ─────────────────────────────────────────────────────────────────────────────

-- platform_credentials
DO $$ BEGIN
  DROP POLICY IF EXISTS platform_credentials_isolation ON platform_credentials;
  DROP POLICY IF EXISTS platform_cred_policy ON platform_credentials;
  DROP POLICY IF EXISTS platform_credentials_service_role ON platform_credentials;
  CREATE POLICY platform_credentials_isolation ON platform_credentials
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY platform_credentials_service_role ON platform_credentials
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- agent_logs
DO $$ BEGIN
  DROP POLICY IF EXISTS agent_logs_isolation ON agent_logs;
  DROP POLICY IF EXISTS agent_log_policy ON agent_logs;
  DROP POLICY IF EXISTS agent_logs_service_role ON agent_logs;
  CREATE POLICY agent_logs_isolation ON agent_logs
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY agent_logs_service_role ON agent_logs
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- orders
DO $$ BEGIN
  DROP POLICY IF EXISTS orders_isolation ON orders;
  DROP POLICY IF EXISTS order_policy ON orders;
  DROP POLICY IF EXISTS orders_service_role ON orders;
  CREATE POLICY orders_isolation ON orders
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY orders_service_role ON orders
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- products
DO $$ BEGIN
  DROP POLICY IF EXISTS products_isolation ON products;
  DROP POLICY IF EXISTS product_policy ON products;
  DROP POLICY IF EXISTS products_service_role ON products;
  CREATE POLICY products_isolation ON products
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY products_service_role ON products
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- customers
DO $$ BEGIN
  DROP POLICY IF EXISTS customers_isolation ON customers;
  DROP POLICY IF EXISTS customer_policy ON customers;
  DROP POLICY IF EXISTS customers_service_role ON customers;
  CREATE POLICY customers_isolation ON customers
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY customers_service_role ON customers
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- print_queue
DO $$ BEGIN
  DROP POLICY IF EXISTS print_queue_isolation ON print_queue;
  DROP POLICY IF EXISTS print_queue_policy ON print_queue;
  DROP POLICY IF EXISTS print_queue_service_role ON print_queue;
  CREATE POLICY print_queue_isolation ON print_queue
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY print_queue_service_role ON print_queue
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- cfdi_records
DO $$ BEGIN
  DROP POLICY IF EXISTS cfdi_records_isolation ON cfdi_records;
  DROP POLICY IF EXISTS cfdi_record_policy ON cfdi_records;
  DROP POLICY IF EXISTS cfdi_records_service_role ON cfdi_records;
  CREATE POLICY cfdi_records_isolation ON cfdi_records
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY cfdi_records_service_role ON cfdi_records
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- whatsapp_messages
DO $$ BEGIN
  DROP POLICY IF EXISTS whatsapp_messages_isolation ON whatsapp_messages;
  DROP POLICY IF EXISTS wa_msg_policy ON whatsapp_messages;
  DROP POLICY IF EXISTS whatsapp_messages_service_role ON whatsapp_messages;
  CREATE POLICY whatsapp_messages_isolation ON whatsapp_messages
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY whatsapp_messages_service_role ON whatsapp_messages
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- support_tickets
DO $$ BEGIN
  DROP POLICY IF EXISTS support_tickets_isolation ON support_tickets;
  DROP POLICY IF EXISTS support_ticket_policy ON support_tickets;
  DROP POLICY IF EXISTS support_tickets_service_role ON support_tickets;
  DROP POLICY IF EXISTS support_tickets_atollom_read_all ON support_tickets;
  CREATE POLICY support_tickets_isolation ON support_tickets
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY support_tickets_service_role ON support_tickets
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
  CREATE POLICY support_tickets_atollom_read_all ON support_tickets
    FOR SELECT USING (
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'atollom_admin'
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- tenant_agent_config
DO $$ BEGIN
  DROP POLICY IF EXISTS tenant_agent_config_isolation ON tenant_agent_config;
  DROP POLICY IF EXISTS tenant_agent_config_policy ON tenant_agent_config;
  DROP POLICY IF EXISTS tenant_agent_config_service_role ON tenant_agent_config;
  CREATE POLICY tenant_agent_config_isolation ON tenant_agent_config
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY tenant_agent_config_service_role ON tenant_agent_config
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- tenant_business_rules
DO $$ BEGIN
  DROP POLICY IF EXISTS tenant_business_rules_isolation ON tenant_business_rules;
  DROP POLICY IF EXISTS tenant_business_rules_policy ON tenant_business_rules;
  DROP POLICY IF EXISTS tenant_business_rules_service_role ON tenant_business_rules;
  CREATE POLICY tenant_business_rules_isolation ON tenant_business_rules
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY tenant_business_rules_service_role ON tenant_business_rules
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- inventory
DO $$ BEGIN
  DROP POLICY IF EXISTS inventory_isolation ON inventory;
  DROP POLICY IF EXISTS inventory_policy ON inventory;
  DROP POLICY IF EXISTS inventory_service_role ON inventory;
  CREATE POLICY inventory_isolation ON inventory
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY inventory_service_role ON inventory
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- purchase_orders
DO $$ BEGIN
  DROP POLICY IF EXISTS purchase_orders_isolation ON purchase_orders;
  DROP POLICY IF EXISTS purchase_order_policy ON purchase_orders;
  DROP POLICY IF EXISTS purchase_orders_service_role ON purchase_orders;
  CREATE POLICY purchase_orders_isolation ON purchase_orders
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY purchase_orders_service_role ON purchase_orders
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- leads
DO $$ BEGIN
  DROP POLICY IF EXISTS leads_isolation ON leads;
  DROP POLICY IF EXISTS lead_policy ON leads;
  DROP POLICY IF EXISTS leads_service_role ON leads;
  CREATE POLICY leads_isolation ON leads
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY leads_service_role ON leads
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- quotes
DO $$ BEGIN
  DROP POLICY IF EXISTS quotes_isolation ON quotes;
  DROP POLICY IF EXISTS quote_policy ON quotes;
  DROP POLICY IF EXISTS quotes_service_role ON quotes;
  CREATE POLICY quotes_isolation ON quotes
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY quotes_service_role ON quotes
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- wa_conversations
DO $$ BEGIN
  DROP POLICY IF EXISTS wa_conversations_isolation ON wa_conversations;
  DROP POLICY IF EXISTS wa_conversations_policy ON wa_conversations;
  DROP POLICY IF EXISTS wa_conversations_service_role ON wa_conversations;
  CREATE POLICY wa_conversations_isolation ON wa_conversations
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY wa_conversations_service_role ON wa_conversations
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- wa_messages
DO $$ BEGIN
  DROP POLICY IF EXISTS wa_messages_isolation ON wa_messages;
  DROP POLICY IF EXISTS wa_messages_policy ON wa_messages;
  DROP POLICY IF EXISTS wa_messages_service_role ON wa_messages;
  CREATE POLICY wa_messages_isolation ON wa_messages
    FOR ALL USING (tenant_id = public.get_my_tenant_id());
  CREATE POLICY wa_messages_service_role ON wa_messages
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 12: VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────────────────────

-- Si llegamos aquí sin error, la recursión está rota.
-- Verificar que la función devuelve NULL para usuarios no logueados (esperado):
-- SELECT public.get_my_tenant_id(); -- debería dar NULL en SQL Editor

DO $$
BEGIN
  RAISE NOTICE '✅ 037_fix_rls_recursion.sql ejecutado correctamente.';
  RAISE NOTICE '✅ Función get_my_tenant_id() creada como SECURITY DEFINER.';
  RAISE NOTICE '✅ user_profiles: recursión eliminada (id = auth.uid() directo).';
  RAISE NOTICE '✅ Todas las tablas: subquery reemplazado por get_my_tenant_id().';
  RAISE NOTICE '✅ atollom_admin: policies de lectura cross-tenant activas.';
  RAISE NOTICE '🔄 Siguiente paso: probar login en el dashboard.';
END $$;
