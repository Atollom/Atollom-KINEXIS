-- MercadoLibre OAuth credentials per tenant
-- Stores the access/refresh tokens obtained via ML OAuth 2.0 for each connected account.
-- One row per tenant — UPSERT on reconnect.

CREATE TABLE IF NOT EXISTS ml_credentials (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ml_user_id    TEXT        NOT NULL,
    ml_nickname   TEXT,
    access_token  TEXT        NOT NULL,
    refresh_token TEXT,
    expires_in    INTEGER     NOT NULL DEFAULT 21600,
    site_id       VARCHAR(10),
    connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id)
);

COMMENT ON TABLE ml_credentials IS 'MercadoLibre OAuth credentials per tenant';

CREATE INDEX IF NOT EXISTS idx_ml_credentials_tenant
    ON ml_credentials(tenant_id);

CREATE INDEX IF NOT EXISTS idx_ml_credentials_ml_user
    ON ml_credentials(ml_user_id);

ALTER TABLE ml_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON ml_credentials
    FOR ALL USING (
        tenant_id = current_setting('app.tenant_id', TRUE)::UUID
    );

CREATE POLICY "service_role_all" ON ml_credentials
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
