-- migrations/006_print_queue.sql
-- KINEXIS — Gestión de Cola de Impresión Física

CREATE TABLE IF NOT EXISTS print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id TEXT NOT NULL,
    job_content TEXT NOT NULL,
    protocol TEXT DEFAULT 'ZPL' CHECK (protocol IN ('ZPL', 'EPL')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PRINTING', 'DONE', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Habilitar RLS
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento de Tenant
CREATE POLICY print_queue_tenant_isolation ON print_queue
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_profiles
            WHERE id = auth.uid()
        )
    );

-- Índices (Solicitados por Carlos para optimización)
-- Índice para búsqueda de trabajos pendientes del día
CREATE INDEX IF NOT EXISTS idx_print_queue_tenant_status
    ON print_queue(tenant_id, status)
    WHERE status = 'PENDING';

-- Índice para referenciar por orden
CREATE INDEX IF NOT EXISTS idx_print_queue_order
    ON print_queue(order_id);
