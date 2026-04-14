-- migrations/036_wa_inbox.sql
-- KINEXIS — WhatsApp Inbox & AI Control
-- Soporte para bandeja de entrada unificada y desactivación de Samantha por sesión.

-- 1. Modificar whatsapp_sessions para control de IA
ALTER TABLE whatsapp_sessions 
ADD COLUMN IF NOT EXISTS samantha_active BOOLEAN DEFAULT TRUE;

-- 2. Modificar whatsapp_messages para transcripciones y medios
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Asegurar que media_url existe (ya debería existir por 008)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_messages' AND column_name='media_url') THEN
    ALTER TABLE whatsapp_messages ADD COLUMN media_url TEXT;
  END IF;
END $$;

-- 3. Actualizar RLS (Aislamiento total por tenant_id)
-- whatsapp_sessions
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_whatsapp_sessions ON whatsapp_sessions;
CREATE POLICY tenant_isolation_whatsapp_sessions ON whatsapp_sessions
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_whatsapp_messages ON whatsapp_messages;
CREATE POLICY tenant_isolation_whatsapp_messages ON whatsapp_messages
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
  );

-- 4. Supabase Storage: Bucket wa-media
-- Nota: Esto asume que se ejecuta en Supabase. En otros entornos esto fallará, 
-- pero es la instrucción estándar para aprovisionar buckets via SQL en Supabase.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wa-media', 'wa-media', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para el bucket
DROP POLICY IF EXISTS "wa_media_isolation" ON storage.objects;
CREATE POLICY "wa_media_isolation" ON storage.objects
  FOR ALL USING (
    bucket_id = 'wa-media' AND
    (storage.foldername(name))[1] IN (SELECT tenant_id::text FROM user_profiles WHERE id = auth.uid())
  );

-- 5. Comentarios (español)
COMMENT ON COLUMN whatsapp_sessions.samantha_active IS 'Indica si Samantha (IA) debe responder automáticamente en esta conversación.';
COMMENT ON COLUMN whatsapp_messages.transcript IS 'Transcripción de texto generada para mensajes de audio.';

-- 6. Habilitar Realtime
-- Nota: Esto habilita la replicación en Supabase para que los widgets se actualicen en vivo.
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sessions;
