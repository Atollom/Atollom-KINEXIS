-- Migration: 008_whatsapp_messages
-- Description: Table to store incoming and outgoing WhatsApp messages

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  message_text TEXT,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  intent TEXT,
  processed BOOLEAN DEFAULT FALSE,
  lead_id UUID REFERENCES leads(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_whatsapp_messages ON whatsapp_messages
  FOR ALL
  USING (tenant_id = auth.uid()); -- Assuming auth.uid() matches tenant_id in this context, 
                                 -- or using the project's standard RLS pattern.

-- Indices
CREATE INDEX idx_whatsapp_messages_tenant_id ON whatsapp_messages(tenant_id);
CREATE INDEX idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX idx_whatsapp_messages_created_at_desc ON whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_processed_false ON whatsapp_messages(processed) WHERE processed = FALSE;

-- Table for long-running conversation states (e.g., CFDI data collection)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  from_number TEXT NOT NULL,
  session_type TEXT NOT NULL, -- e.g., 'cfdi_collection'
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, from_number, session_type)
);

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_whatsapp_sessions ON whatsapp_sessions
  FOR ALL
  USING (tenant_id = auth.uid()); -- Or the project's standard RLS pattern.
