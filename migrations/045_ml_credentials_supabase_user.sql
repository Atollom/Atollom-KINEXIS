-- Extend ml_credentials to support pre-onboarding OAuth flow.
--
-- Problem: during the wizard a new user has no row in the `users` table yet,
-- so tenant_id is the nil UUID and there is no tenants FK to reference.
-- Fix: remove the FK + NOT NULL on tenant_id, add supabase_user_id as the
-- unique lookup key. After onboarding completes the service updates tenant_id.

-- 1. Drop the FK constraint
ALTER TABLE ml_credentials
    DROP CONSTRAINT IF EXISTS ml_credentials_tenant_id_fkey;

-- 2. Allow nil/null tenant_id for pre-onboarding rows
ALTER TABLE ml_credentials
    ALTER COLUMN tenant_id DROP NOT NULL;

-- 3. Drop the old UNIQUE(tenant_id) constraint
ALTER TABLE ml_credentials
    DROP CONSTRAINT IF EXISTS ml_credentials_tenant_id_key;

-- 4. Add supabase_user_id (auth.users.id) as the new canonical unique key
ALTER TABLE ml_credentials
    ADD COLUMN IF NOT EXISTS supabase_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_credentials_supabase_user
    ON ml_credentials(supabase_user_id)
    WHERE supabase_user_id IS NOT NULL;

-- 5. Restore a partial unique index on tenant_id for connected (post-onboarding) rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_credentials_tenant_connected
    ON ml_credentials(tenant_id)
    WHERE tenant_id IS NOT NULL
      AND tenant_id != '00000000-0000-0000-0000-000000000000';

COMMENT ON COLUMN ml_credentials.supabase_user_id IS
    'Supabase auth.users.id — primary lookup key. tenant_id is null until onboarding completes.';
