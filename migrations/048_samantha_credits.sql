-- Migration 048: Samantha credits table
-- Tracks monthly LLM usage per tenant

CREATE TABLE IF NOT EXISTS samantha_credits (
    tenant_id     UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    used          INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
    monthly_limit INTEGER NOT NULL DEFAULT 500 CHECK (monthly_limit > 0),
    reset_at      TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-reset used count when reset_at passes
CREATE OR REPLACE FUNCTION reset_samantha_credits()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOW() >= NEW.reset_at THEN
        NEW.used := 0;
        NEW.reset_at := date_trunc('month', NOW()) + INTERVAL '1 month';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_samantha_credits ON samantha_credits;
CREATE TRIGGER trg_reset_samantha_credits
    BEFORE UPDATE ON samantha_credits
    FOR EACH ROW EXECUTE FUNCTION reset_samantha_credits();

-- RLS
ALTER TABLE samantha_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_credits_own" ON samantha_credits
    FOR ALL USING (tenant_id = (
        SELECT tenant_id FROM users
        WHERE supabase_user_id = auth.uid()
        LIMIT 1
    ));
