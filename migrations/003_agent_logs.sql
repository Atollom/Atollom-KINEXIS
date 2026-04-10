-- migrations/003_agent_logs.sql
-- KINEXIS — Logs de Observabilidad y Trazabilidad de Agentes

-- 1. Logs de Ejecución de Agentes
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    agent_id TEXT NOT NULL, -- #0, #1, #26, etc.
    session_id UUID NOT NULL,
    input_payload JSONB,
    output_payload JSONB,
    status TEXT CHECK (status IN ('running', 'success', 'failed', 'blocked')),
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER
);

-- 2. Logs de Validación (Agente #26)
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID REFERENCES agent_execution_logs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    check_name TEXT NOT NULL, -- check_json_schema, check_price_above_minimum, etc.
    is_passing BOOLEAN NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Logs de Ruteo (Router Agent)
CREATE TABLE IF NOT EXISTS routing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID REFERENCES agent_execution_logs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sub_router TEXT NOT NULL, -- ecommerce, meta, erp, crm
    target_agent_id TEXT NOT NULL,
    routing_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS
CREATE POLICY agent_logs_isolation ON agent_execution_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY validation_logs_isolation ON validation_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY routing_logs_isolation ON routing_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
