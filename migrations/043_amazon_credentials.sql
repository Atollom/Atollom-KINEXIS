-- Amazon SP-API credentials per tenant
-- Stores the refresh_token obtained via LWA OAuth for each connected seller account.
-- One row per tenant — UPSERT on reconnect.

CREATE TABLE IF NOT EXISTS amazon_credentials (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    seller_id       TEXT        NOT NULL,
    marketplace_id  TEXT        NOT NULL DEFAULT 'A1AM78C64UM0Y8',
    refresh_token   TEXT        NOT NULL,
    environment     TEXT        NOT NULL DEFAULT 'sandbox'
                    CHECK (environment IN ('sandbox', 'production')),
    connected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_amazon_credentials_tenant
    ON amazon_credentials(tenant_id);

ALTER TABLE amazon_credentials ENABLE ROW LEVEL SECURITY;

-- Tenants can only see their own credentials
CREATE POLICY "tenant_isolation" ON amazon_credentials
    FOR ALL USING (
        tenant_id = current_setting('app.tenant_id', TRUE)::UUID
    );

-- Service role bypasses RLS (backend service-role key)
CREATE POLICY "service_role_all" ON amazon_credentials
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
