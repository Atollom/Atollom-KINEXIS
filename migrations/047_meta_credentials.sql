-- Migration 047: meta_credentials table for Meta Business Login OAuth
-- Stores WhatsApp Business + Instagram + Facebook credentials per tenant/user

CREATE TABLE IF NOT EXISTS meta_credentials (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           UUID        REFERENCES tenants(id) ON DELETE CASCADE,
  supabase_user_id    TEXT        NOT NULL,
  fb_user_id          TEXT,
  fb_name             TEXT,
  access_token        TEXT        NOT NULL,
  waba_id             TEXT,                         -- WhatsApp Business Account ID
  phone_number_id     TEXT,                         -- WhatsApp Phone Number ID
  phone_number        TEXT,                         -- Display phone number
  connected_platforms TEXT[]      DEFAULT '{}',    -- ['whatsapp','instagram','facebook']
  connected_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(supabase_user_id)
);

-- RLS: tenants only see their own credentials
ALTER TABLE meta_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_meta_credentials"
  ON meta_credentials
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE supabase_user_id = auth.uid()::text
    )
  );

-- Index for webhook tenant resolution
CREATE INDEX IF NOT EXISTS idx_meta_credentials_waba
  ON meta_credentials(waba_id)
  WHERE waba_id IS NOT NULL;

-- Also add whatsapp_credentials table for webhook → tenant resolution
-- (used by the WhatsApp webhook router to look up tenant by phone_number_id)
CREATE TABLE IF NOT EXISTS whatsapp_credentials (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number_id TEXT NOT NULL,
  waba_id         TEXT,
  display_number  TEXT,
  access_token    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number_id)
);

ALTER TABLE whatsapp_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_wa_credentials"
  ON whatsapp_credentials
  FOR ALL
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE supabase_user_id = auth.uid()::text
  ));
