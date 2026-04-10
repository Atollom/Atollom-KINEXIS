-- ============================================================
-- KINEXIS — Migracion: Modulo CFDI Facturacion Electronica
-- Version: 1.0.0 | Fecha: 2026-04-09
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. TABLA PRINCIPAL DE CFDIs ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cfdi_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Identificadores SAT y PAC
    uuid                        TEXT UNIQUE,
    folio                       TEXT,
    facturapi_id                TEXT,

    -- Relacion con ordenes del sistema
    order_id                    TEXT,
    platform                    TEXT,   -- 'mercadolibre' | 'amazon' | 'shopify' | 'b2b_directo'

    -- Tipo y estado del CFDI
    cfdi_type                   CHAR(1) NOT NULL DEFAULT 'I'
                                CHECK (cfdi_type IN ('I', 'E', 'P')),
    status                      TEXT NOT NULL DEFAULT 'TIMBRADO'
                                CHECK (status IN (
                                    'TIMBRADO', 'ERROR_PAC', 'ERROR_VALIDACION',
                                    'CANCELADO', 'CANCELACION_PENDIENTE'
                                )),

    -- Montos
    subtotal                    DECIMAL(12, 2),
    iva                         DECIMAL(12, 2),
    total                       DECIMAL(12, 2),
    currency                    CHAR(3) DEFAULT 'MXN',

    -- Datos del receptor (obligatorios en CFDI 4.0)
    customer_rfc                TEXT NOT NULL,
    customer_name               TEXT NOT NULL,
    customer_email              TEXT,
    customer_tax_regime         TEXT,
    customer_zip                TEXT,

    -- Configuracion del comprobante
    uso_cfdi                    TEXT,
    forma_pago                  TEXT,
    metodo_pago                 CHAR(3),    -- 'PUE' o 'PPD'

    -- Relaciones entre CFDIs
    related_cfdi_uuid           TEXT,       -- UUID del CFDI relacionado (para E y P)

    -- Archivos en Supabase Storage (bucket: cfdi-documents)
    xml_url                     TEXT,
    pdf_url                     TEXT,

    -- Control de cancelacion
    approved_for_cancellation   BOOLEAN DEFAULT FALSE,
    cancellation_approved_by    TEXT,
    cancellation_motivo         TEXT,
    cancelled_at                TIMESTAMPTZ,
    cancelled_by                TEXT,

    -- Auditoria y errores
    timbrado_at                 TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    error_code                  TEXT,
    error_message               TEXT,
    requires_human_review       BOOLEAN DEFAULT FALSE
);

-- Indices para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_cfdi_tenant       ON cfdi_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_uuid         ON cfdi_records(uuid);
CREATE INDEX IF NOT EXISTS idx_cfdi_order        ON cfdi_records(order_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_rfc          ON cfdi_records(customer_rfc);
CREATE INDEX IF NOT EXISTS idx_cfdi_status       ON cfdi_records(status);
CREATE INDEX IF NOT EXISTS idx_cfdi_fecha        ON cfdi_records(timbrado_at DESC);
CREATE INDEX IF NOT EXISTS idx_cfdi_review       ON cfdi_records(requires_human_review)
    WHERE requires_human_review = TRUE;

-- Row Level Security: cada tenant solo ve sus CFDIs
ALTER TABLE cfdi_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cfdi_tenant_isolation" ON cfdi_records
    FOR ALL
    USING (tenant_id = (
        SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "cfdi_service_role" ON cfdi_records
    FOR ALL TO service_role
    USING (TRUE) WITH CHECK (TRUE);

-- Trigger para updated_at automatico
CREATE OR REPLACE FUNCTION update_cfdi_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cfdi_updated_at
    BEFORE UPDATE ON cfdi_records
    FOR EACH ROW EXECUTE FUNCTION update_cfdi_timestamp();


-- ─── 2. CONFIGURACION CFDI POR TENANT ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cfdi_tenant_config (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

    -- Datos fiscales del emisor (configurados en Facturapi)
    facturapi_org_id        TEXT NOT NULL,
    rfc_emisor              TEXT NOT NULL,
    nombre_emisor           TEXT NOT NULL,
    regimen_fiscal          TEXT NOT NULL DEFAULT '601',    -- 601 = Personas Morales
    cp_expedicion           TEXT NOT NULL,                  -- CP del lugar de expedicion

    -- Series de folio
    serie_ingreso           TEXT DEFAULT 'A',
    serie_egreso            TEXT DEFAULT 'NC',
    serie_pago              TEXT DEFAULT 'P',

    -- Reglas de negocio de facturacion
    monto_minimo_rfc_real   DECIMAL(10,2) DEFAULT 2000.00,
    auto_invoice_b2b        BOOLEAN DEFAULT TRUE,
    auto_invoice_b2c        BOOLEAN DEFAULT FALSE,

    -- Credenciales PAC (ENCRIPTADAS con pgsodium Vault)
    -- Nunca guardar la API Key en texto plano
    facturapi_api_key_enc   TEXT,

    -- Configuracion de envio al cliente
    send_pdf_email          BOOLEAN DEFAULT TRUE,
    send_xml_email          BOOLEAN DEFAULT TRUE,
    email_from              TEXT DEFAULT 'facturacion@kaptools.mx',

    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cfdi_tenant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cfdi_config_tenant" ON cfdi_tenant_config
    FOR ALL
    USING (tenant_id = (
        SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "cfdi_config_service" ON cfdi_tenant_config
    FOR ALL TO service_role
    USING (TRUE) WITH CHECK (TRUE);


-- ─── 3. CLAVES SAT POR PRODUCTO (catalogo Kap Tools) ─────────────────────────

CREATE TABLE IF NOT EXISTS public.product_sat_keys (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku                     TEXT NOT NULL,
    clave_producto_sat      TEXT NOT NULL,          -- Catalogo Productos/Servicios SAT
    clave_unidad_sat        TEXT NOT NULL DEFAULT 'H87',  -- H87 = Pieza
    descripcion_sat         TEXT,                   -- Descripcion estandarizada para CFDI
    iva_rate                DECIMAL(4,2) DEFAULT 0.16,
    es_exportacion          BOOLEAN DEFAULT FALSE,
    CONSTRAINT sat_keys_unique UNIQUE (tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_sat_keys ON product_sat_keys(tenant_id, sku);

ALTER TABLE product_sat_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sat_keys_tenant" ON product_sat_keys
    FOR ALL
    USING (tenant_id = (
        SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    ));


-- ─── 4. VISTA: CFDIs PENDIENTES DE REVISION ──────────────────────────────────

CREATE OR REPLACE VIEW cfdi_pending_review AS
SELECT
    c.id, c.tenant_id, c.uuid, c.folio, c.cfdi_type, c.status,
    c.total, c.customer_rfc, c.customer_name,
    c.error_code, c.error_message, c.requires_human_review,
    c.created_at, t.name AS tenant_name
FROM cfdi_records c
JOIN tenants t ON t.id = c.tenant_id
WHERE c.requires_human_review = TRUE
  AND c.status NOT IN ('CANCELADO')
ORDER BY c.created_at DESC;


-- ─── 5. FUNCION: APROBAR CANCELACION ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION approve_cfdi_cancellation(
    p_cfdi_uuid     TEXT,
    p_tenant_id     UUID,
    p_approved_by   TEXT,
    p_motivo        TEXT DEFAULT '02'
)
RETURNS JSONB AS $$
DECLARE v_cfdi cfdi_records%ROWTYPE;
BEGIN
    SELECT * INTO v_cfdi FROM cfdi_records
    WHERE uuid = p_cfdi_uuid AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'CFDI no encontrado');
    END IF;
    IF v_cfdi.status = 'CANCELADO' THEN
        RETURN jsonb_build_object('success', false, 'message', 'CFDI ya cancelado');
    END IF;

    UPDATE cfdi_records SET
        approved_for_cancellation = TRUE,
        cancellation_approved_by = p_approved_by,
        cancellation_motivo = p_motivo,
        updated_at = NOW()
    WHERE uuid = p_cfdi_uuid AND tenant_id = p_tenant_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Cancelacion aprobada. El agente procesara la cancelacion con el SAT.',
        'cfdi_uuid', p_cfdi_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 6. INSERT INICIAL: Claves SAT Catalogo Kap Tools ────────────────────────
-- Descomentar y ajustar el tenant_id real de Kap Tools antes de ejecutar

/*
INSERT INTO product_sat_keys (tenant_id, sku, clave_producto_sat, clave_unidad_sat, descripcion_sat, iva_rate)
VALUES
-- Herramientas de precision
('[TENANT_ID_KAP_TOOLS]', 'DEST-REL-001', '27111702', 'H87', 'Destornillador de relojeria', 0.16),
('[TENANT_ID_KAP_TOOLS]', 'KIT-DEST-001', '27111701', 'H87', 'Kit herramientas de precision', 0.16),
('[TENANT_ID_KAP_TOOLS]', 'LUPA-10X-001', '41112901', 'H87', 'Lupa de aumento 10x', 0.16),
('[TENANT_ID_KAP_TOOLS]', 'CALIB-001',    '41111500', 'H87', 'Calibrador digital', 0.16),
-- Reactivos quimicos
('[TENANT_ID_KAP_TOOLS]', 'ACIDO-ORO-001','12352107', 'MLT', 'Acido de prueba para oro', 0.16),
('[TENANT_ID_KAP_TOOLS]', 'ACIDO-PLT-001','12352107', 'MLT', 'Acido de prueba para plata', 0.16),
-- Consumibles
('[TENANT_ID_KAP_TOOLS]', 'BATERIAS-001', '44121600', 'H87', 'Baterias para reloj SR626', 0.16)
ON CONFLICT (tenant_id, sku) DO NOTHING;
*/


-- ─── INSTRUCCIONES POST-MIGRACION ────────────────────────────────────────────
-- 1. Crear bucket en Supabase Storage:
--      Nombre: cfdi-documents
--      Acceso: PRIVADO (no publico)
--      Tamano max: 10 MB
--      MIME permitidos: application/xml, application/pdf
--
-- 2. Configurar cfdi_tenant_config con los datos reales de Kap Tools
--    (RFC, CP, Facturapi Org ID, API Key encriptada con pgsodium)
--
-- 3. Cargar product_sat_keys con los SKUs del catalogo de Kap Tools
--
-- 4. Agregar a .env del proyecto:
--      CFDI_SERVICE_URL=http://localhost:8001
--      INTERNAL_SERVICE_SECRET=<secret-largo>
