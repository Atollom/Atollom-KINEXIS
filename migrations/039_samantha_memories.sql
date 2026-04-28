-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 039: samantha_memories (vector memory system)
-- Tabla avanzada de memoria semántica para Samantha.
-- Requiere extensión pgvector habilitada en Supabase (Extensions → vector).
-- La tabla samantha_memory (singular, migración 033) sigue existiendo como
-- caché conversacional simple. Esta tabla es para memoria persistente de largo plazo.
-- ─────────────────────────────────────────────────────────────────────────────

-- Paso 0: Habilitar pgvector (idempotente — seguro ejecutar si ya existe)
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- A. Tabla principal
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS samantha_memories (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,

  -- Contenido
  content         text        NOT NULL,
  summary         text,
  importance      int         CHECK (importance BETWEEN 1 AND 10) DEFAULT 5,
  tags            text[]      DEFAULT '{}',

  -- Embedding vectorial (OpenAI text-embedding-3-small = 1536 dims)
  embedding       vector(1536),

  -- Versionado (actualizar sin borrar — mantiene historial)
  parent_id       uuid        REFERENCES samantha_memories(id),
  superseded_at   timestamptz,

  -- Trazabilidad
  session_id      text,
  agent_source    text,       -- qué agente creó esta memoria (ej: "inventory", "samantha_chat")
  event_timestamp timestamptz DEFAULT NOW(),
  created_at      timestamptz DEFAULT NOW(),
  updated_at      timestamptz DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- B. Trigger updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_samantha_memories_updated_at ON samantha_memories;
CREATE TRIGGER update_samantha_memories_updated_at
  BEFORE UPDATE ON samantha_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- C. Índices
-- ─────────────────────────────────────────────────────────────────────────────

-- Full-text search en español
CREATE INDEX IF NOT EXISTS samantha_memories_content_fts_idx
  ON samantha_memories
  USING GIN (to_tsvector('spanish', content));

-- Búsqueda vectorial (coseno) — requiere al menos 1 fila para crear el índice IVFFlat
-- Si falla, ejecutar después de insertar datos:
--   CREATE INDEX samantha_memories_embedding_idx ON samantha_memories
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'samantha_memories_embedding_idx'
  ) THEN
    BEGIN
      EXECUTE 'CREATE INDEX samantha_memories_embedding_idx
               ON samantha_memories
               USING ivfflat (embedding vector_cosine_ops)
               WITH (lists = 100)';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'IVFFlat index skipped (tabla vacía) — crear después de insertar datos.';
    END;
  END IF;
END $$;

-- Búsqueda rápida por tenant + usuario + tiempo
CREATE INDEX IF NOT EXISTS samantha_memories_tenant_user_idx
  ON samantha_memories(tenant_id, user_id, event_timestamp DESC);

-- Boot sequence: memorias activas de alta importancia
CREATE INDEX IF NOT EXISTS samantha_memories_importance_idx
  ON samantha_memories(tenant_id, user_id, importance DESC)
  WHERE parent_id IS NULL AND superseded_at IS NULL;

-- Búsqueda por tags (GIN para arrays)
CREATE INDEX IF NOT EXISTS samantha_memories_tags_idx
  ON samantha_memories USING GIN (tags);

-- ─────────────────────────────────────────────────────────────────────────────
-- D. RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE samantha_memories ENABLE ROW LEVEL SECURITY;

-- Aislamiento por tenant: el usuario solo ve memorias de su tenant
DROP POLICY IF EXISTS samantha_memories_tenant_isolation ON samantha_memories;
CREATE POLICY samantha_memories_tenant_isolation ON samantha_memories
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- service_role bypasa RLS para el backend Python
DROP POLICY IF EXISTS samantha_memories_service_role ON samantha_memories;
CREATE POLICY samantha_memories_service_role ON samantha_memories
  FOR ALL TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- atollom_admin puede leer todas las memorias (para debugging)
DROP POLICY IF EXISTS samantha_memories_atollom_read ON samantha_memories;
CREATE POLICY samantha_memories_atollom_read ON samantha_memories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'atollom_admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- E. Funciones helper
-- ─────────────────────────────────────────────────────────────────────────────

-- Búsqueda semántica por embedding
CREATE OR REPLACE FUNCTION match_samantha_memories(
  query_embedding  vector(1536),
  p_tenant_id      uuid,
  p_user_id        uuid,
  match_threshold  float DEFAULT 0.7,
  match_count      int   DEFAULT 10
)
RETURNS TABLE (
  id              uuid,
  content         text,
  summary         text,
  importance      int,
  tags            text[],
  similarity      float,
  event_timestamp timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos del owner, no del llamador
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.content,
    sm.summary,
    sm.importance,
    sm.tags,
    1 - (sm.embedding <=> query_embedding) AS similarity,
    sm.event_timestamp
  FROM samantha_memories sm
  WHERE sm.tenant_id    = p_tenant_id
    AND sm.user_id      = p_user_id
    AND sm.parent_id    IS NULL
    AND sm.superseded_at IS NULL
    AND sm.embedding    IS NOT NULL
    AND 1 - (sm.embedding <=> query_embedding) > match_threshold
  ORDER BY sm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Boot sequence: cargar memorias importantes al inicio de sesión
CREATE OR REPLACE FUNCTION get_boot_memories(
  p_tenant_id    uuid,
  p_user_id      uuid,
  min_importance int DEFAULT 7
)
RETURNS TABLE (
  id         uuid,
  content    text,
  summary    text,
  importance int,
  tags       text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.content,
    sm.summary,
    sm.importance,
    sm.tags
  FROM samantha_memories sm
  WHERE sm.tenant_id    = p_tenant_id
    AND sm.user_id      = p_user_id
    AND sm.importance   >= min_importance
    AND sm.parent_id    IS NULL
    AND sm.superseded_at IS NULL
  ORDER BY sm.importance DESC, sm.event_timestamp DESC
  LIMIT 20;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- F. Comentarios de tabla
-- ─────────────────────────────────────────────────────────────────────────────
COMMENT ON TABLE samantha_memories IS
  'Memoria persistente de Samantha con soporte vectorial. '
  'Distinto de samantha_memory (simple caché conversacional). '
  'parent_id + superseded_at implementan soft-versioning sin borrar historial.';

COMMENT ON COLUMN samantha_memories.importance IS
  '1-10: 1=efímera, 5=normal, 7+=importante, 9-10=crítica. '
  'Boot sequence carga memorias con importance >= 7.';

COMMENT ON COLUMN samantha_memories.embedding IS
  'Vector 1536 dims (OpenAI text-embedding-3-small). '
  'NULL hasta que el backend lo calcule asíncronamente.';

COMMENT ON COLUMN samantha_memories.superseded_at IS
  'NULL = memoria activa. Timestamp = fue reemplazada por una versión más nueva (parent_id en la nueva).';

-- ─────────────────────────────────────────────────────────────────────────────
-- G. Datos de verificación (Kap Tools)
-- ─────────────────────────────────────────────────────────────────────────────

-- Test insert (sin embedding — se calcula luego)
INSERT INTO samantha_memories (
  tenant_id,
  user_id,
  content,
  summary,
  importance,
  tags,
  agent_source
) VALUES (
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '0aea6e5b-021e-4bee-9575-d45f99c7e8b3',
  'El usuario prefiere recibir reportes de inventario los lunes a las 9am. '
  'Solicitó que los reportes incluyan tanto el stock actual como las alertas de reorden.',
  'Preferencia de reportes: lunes 9am, incluir alertas de reorden',
  8,
  ARRAY['preferencia', 'reportes', 'inventario', 'horario'],
  'samantha_chat'
) ON CONFLICT DO NOTHING;

-- Verificar tabla
SELECT
  id,
  content,
  summary,
  importance,
  tags,
  agent_source,
  created_at
FROM samantha_memories
ORDER BY created_at DESC
LIMIT 5;

-- Verificar boot sequence
SELECT * FROM get_boot_memories(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '0aea6e5b-021e-4bee-9575-d45f99c7e8b3'
);
