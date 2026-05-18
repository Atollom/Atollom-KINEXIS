-- migrations/041_users_table.sql
-- KINEXIS — Tabla `users` para onboarding y auth backend
-- Complementa `user_profiles` (Supabase Auth) con datos internos de RBAC.
-- Idempotente: IF NOT EXISTS + ADD COLUMN IF NOT EXISTS

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Crear tabla users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supabase_user_id  UUID        UNIQUE,          -- FK lógico a auth.users.id
    email             TEXT        NOT NULL,
    full_name         TEXT        NOT NULL DEFAULT '',
    role              TEXT        NOT NULL DEFAULT 'agente'
                        CHECK (role IN ('owner', 'admin', 'agente', 'almacenista', 'contador', 'viewer')),
    password_hash     TEXT,                         -- Fernet-encrypted temp password
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    must_change_pw    BOOLEAN     NOT NULL DEFAULT TRUE,  -- force change on first login
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (email)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Índices
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant       ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id  ON users(supabase_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role (FastAPI backend) tiene acceso total
DROP POLICY IF EXISTS users_service_role ON users;
CREATE POLICY users_service_role ON users
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- Cada tenant solo ve sus propios usuarios
DROP POLICY IF EXISTS users_tenant_isolation ON users;
CREATE POLICY users_tenant_isolation ON users
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: updated_at automático
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
-- 5. Seed: migrar user_profiles existentes a la tabla users
--    (solo si no existen ya — idempotente)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO users (supabase_user_id, tenant_id, email, full_name, role, must_change_pw)
SELECT
    up.id           AS supabase_user_id,
    up.tenant_id,
    COALESCE(up.email, '')     AS email,
    COALESCE(up.display_name, up.full_name, '') AS full_name,
    COALESCE(up.role, 'agente') AS role,
    FALSE           AS must_change_pw   -- existing users don't need to change pw
FROM user_profiles up
WHERE up.email IS NOT NULL
  AND up.email != ''
ON CONFLICT (email) DO NOTHING;
