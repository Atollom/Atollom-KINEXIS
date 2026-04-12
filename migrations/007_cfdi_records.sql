-- migrations/007_cfdi_records.sql
-- KINEXIS — Registro y Control de Comprobantes Fiscales (CFDI)

-- 1. Tabla de Registros CFDI
CREATE TABLE IF NOT EXISTS cfdi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    uuid TEXT UNIQUE,
    folio TEXT,
    facturapi_id TEXT,
    order_id TEXT,
    platform TEXT,
    cfdi_type CHAR(1) NOT NULL DEFAULT 'I' CHECK (cfdi_type IN ('I','E','P')),
    status TEXT NOT NULL DEFAULT 'TIMBRADO' 
        CHECK (status IN ('TIMBRADO', 'ERROR_PAC', 'ERROR_VALIDACION', 'CANCELADO', 'CANCELACION_PENDIENTE')),
    subtotal DECIMAL(12,2),
    iva DECIMAL(12,2),
    total DECIMAL(12,2),
    currency CHAR(3) DEFAULT 'MXN',
    customer_rfc TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_tax_regime TEXT,
    customer_zip TEXT,
    uso_cfdi TEXT,
    forma_pago TEXT,
    metodo_pago CHAR(3),
    related_cfdi_uuid TEXT,
    xml_url TEXT,
    pdf_url TEXT,
    approved_for_cancellation BOOLEAN DEFAULT FALSE,
    cancellation_approved_by TEXT,
    cancellation_motivo TEXT,
    cancelled_at TIMESTAMPTZ,
    timbrado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    error_code TEXT,
    error_message TEXT,
    requires_human_review BOOLEAN DEFAULT FALSE
);

-- 2. Configuración extendida de CFDI por Tenant
CREATE TABLE IF NOT EXISTS cfdi_tenant_config_ext (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    facturapi_org_id TEXT,
    rfc_emisor TEXT NOT NULL,
    nombre_emisor TEXT NOT NULL,
    regimen_fiscal TEXT NOT NULL DEFAULT '601',
    cp_expedicion TEXT NOT NULL,
    serie_ingreso TEXT DEFAULT 'KT',
    serie_egreso TEXT DEFAULT 'KTNC',
    serie_pago TEXT DEFAULT 'KTP',
    monto_minimo_rfc_real DECIMAL(10,2) DEFAULT 2000.00,
    auto_invoice_b2b BOOLEAN DEFAULT TRUE,
    auto_invoice_b2c BOOLEAN DEFAULT FALSE,
    send_pdf_email BOOLEAN DEFAULT TRUE,
    send_xml_email BOOLEAN DEFAULT TRUE,
    email_from TEXT DEFAULT 'facturacion@kaptools.mx',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE cfdi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfdi_tenant_config_ext ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS
CREATE POLICY cfdi_records_tenant_isolation ON cfdi_records
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY cfdi_config_ext_tenant_isolation ON cfdi_tenant_config_ext
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Permitir acceso al service_role
CREATE POLICY cfdi_records_service_role ON cfdi_records FOR ALL TO service_role USING (true);

-- 5. Índices de Optimización
CREATE INDEX idx_cfdi_tenant ON cfdi_records(tenant_id);
CREATE INDEX idx_cfdi_uuid ON cfdi_records(uuid);
CREATE INDEX idx_cfdi_order ON cfdi_records(order_id);
CREATE INDEX idx_cfdi_rfc ON cfdi_records(customer_rfc);
CREATE INDEX idx_cfdi_status ON cfdi_records(status);
CREATE INDEX idx_cfdi_fecha ON cfdi_records(created_at);
CREATE INDEX idx_cfdi_review ON cfdi_records(requires_human_review) WHERE requires_human_review = TRUE;

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cfdi_records_updated_at 
    BEFORE UPDATE ON cfdi_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_cfdi_tenant_config_ext_updated_at 
    BEFORE UPDATE ON cfdi_tenant_config_ext FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Vista para Auditoría Humana
CREATE OR REPLACE VIEW cfdi_pending_review AS
SELECT c.id, c.tenant_id, c.uuid, c.folio,
  c.cfdi_type, c.status, c.total,
  c.customer_rfc, c.customer_name,
  c.error_code, c.error_message,
  c.requires_human_review, c.created_at,
  t.name AS tenant_name
FROM cfdi_records c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.requires_human_review = TRUE
  AND c.status NOT IN ('CANCELADO')
ORDER BY c.created_at DESC;

-- 8. Función para aprobación de cancelación
CREATE OR REPLACE FUNCTION approve_cfdi_cancellation(
  p_cfdi_uuid TEXT,
  p_tenant_id UUID,
  p_approved_by TEXT,
  p_motivo TEXT DEFAULT '02'
) RETURNS JSONB AS $$
DECLARE
    v_record_id UUID;
    v_status TEXT;
BEGIN
    SELECT id, status INTO v_record_id, v_status 
    FROM cfdi_records 
    WHERE uuid = p_cfdi_uuid AND tenant_id = p_tenant_id;

    IF v_record_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'CFDI no encontrado.');
    END IF;

    IF v_status = 'CANCELADO' THEN
        RETURN jsonb_build_object('success', false, 'message', 'El CFDI ya está cancelado.');
    END IF;

    UPDATE cfdi_records SET
        approved_for_cancellation = TRUE,
        cancellation_approved_by = p_approved_by,
        cancellation_motivo = p_motivo,
        status = 'CANCELACION_PENDIENTE',
        updated_at = NOW()
    WHERE id = v_record_id;

    RETURN jsonb_build_object('success', true, 'message', 'Cancelación aprobada y en proceso.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Seed Kap Tools configuration (Usando el UUID detectado en 001)
INSERT INTO cfdi_tenant_config_ext (
  tenant_id, rfc_emisor, nombre_emisor,
  regimen_fiscal, cp_expedicion,
  serie_ingreso, serie_egreso, serie_pago
) VALUES (
  '40446806-0107-6201-9311-000000000001',
  'KTO2202178K8',
  'KAP TOOLS SA DE CV',
  '601',
  '72973',
  'KT', 'KTNC', 'KTP'
) ON CONFLICT (tenant_id) DO NOTHING;
