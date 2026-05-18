-- migrations/042_users_add_missing_columns.sql
-- KINEXIS — Adds columns missing from pre-existing `users` table.
-- Migration 041 used CREATE TABLE IF NOT EXISTS which was a no-op on an existing
-- table, so these columns were never added. All statements are idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add missing columns
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name         TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash     TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active         BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_pw    BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add UNIQUE constraint on supabase_user_id (idempotent via DO block)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_supabase_user_id_key'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_supabase_user_id_key UNIQUE (supabase_user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add CHECK constraint on role (idempotent via DO block)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('owner', 'admin', 'agente', 'almacenista', 'contador', 'viewer'));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indices (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant      ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS policies (drop + recreate to ensure correct definition)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_service_role ON users;
CREATE POLICY users_service_role ON users
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Trigger: auto-update updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _set_users_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_users_updated_at ON users;
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION _set_users_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Seed: migrate existing user_profiles (idempotent — ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO users (supabase_user_id, tenant_id, email, full_name, role, must_change_pw)
SELECT
    up.id                                          AS supabase_user_id,
    up.tenant_id,
    COALESCE(up.email, '')                         AS email,
    COALESCE(up.display_name, up.full_name, '')    AS full_name,
    COALESCE(up.role, 'agente')                    AS role,
    FALSE                                          AS must_change_pw
FROM user_profiles up
WHERE up.email IS NOT NULL
  AND up.email != ''
ON CONFLICT (email) DO NOTHING;
