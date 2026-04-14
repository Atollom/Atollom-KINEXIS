-- ═══════════════════════════════════════════
-- FILE: migrations/001_tenants.sql
-- ═══════════════════════════════════════════
-- migrations/001_tenants.sql
-- KINEXIS — Gestión de Multi-tenancy

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'socia', 'almacenista', 'agente')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Configuración CFDI por Tenant (Kap Tools Core)
CREATE TABLE IF NOT EXISTS cfdi_tenant_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    rfc_emisor TEXT NOT NULL,
    nombre_emisor TEXT NOT NULL,
    regimen_fiscal TEXT NOT NULL,
    cp_expedicion TEXT NOT NULL,
    serie_ingreso TEXT DEFAULT 'F',
    serie_egreso TEXT DEFAULT 'NC',
    serie_pago TEXT DEFAULT 'P',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfdi_tenant_config ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de RLS Iniciales (Super Admin y Tenant Isolation)
-- Nota: En producción, auth.uid() debe estar vinculado al tenant_id del perfil.

CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL USING (id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY profile_tenant_policy ON user_profiles
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY cfdi_config_policy ON cfdi_tenant_config
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- 6. Seed Inicial: Kap Tools SA de CV
DO $$
DECLARE
    kap_tenant_id UUID := '40446806-0107-6201-9311-000000000001'; -- UUID determinado para Kap Tools
BEGIN
    INSERT INTO tenants (id, name)
    VALUES (kap_tenant_id, 'Kap Tools SA de CV')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO cfdi_tenant_config (
        tenant_id, rfc_emisor, nombre_emisor, regimen_fiscal, cp_expedicion, serie_ingreso, serie_egreso, serie_pago
    )
    VALUES (
        kap_tenant_id, 
        'KTO2202178K8', 
        'KAP TOOLS SA DE CV', 
        '601', 
        '72973', 
        'KT', 
        'KTNC', 
        'KTP'
    )
    ON CONFLICT (tenant_id) DO NOTHING;
END $$;

-- ═══════════════════════════════════════════
-- FILE: migrations/002_platform_credentials.sql
-- ═══════════════════════════════════════════
-- migrations/002_platform_credentials.sql
-- KINEXIS — Gestión de Credenciales con Vault (pgsodium)

-- 1. Tabla de Credenciales por Plataforma
-- Se agrupa por tenant_id para asegurar aislamiento total.
CREATE TABLE IF NOT EXISTS platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    platform_name TEXT NOT NULL CHECK (platform_name IN ('ml', 'amazon', 'shopify', 'meta', 'facturapi', 'skydrop', 'resend')),
    key_name TEXT NOT NULL, -- e.g., 'API_KEY', 'CLIENT_SECRET'
    encrypted_value TEXT NOT NULL, -- El valor real se maneja vía pgsodium en la app layer o vía serverless functions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, platform_name, key_name)
);

-- 2. Habilitar RLS
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Política de RLS
CREATE POLICY platform_credentials_isolation ON platform_credentials
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- 4. Comentario sobre Vault
COMMENT ON TABLE platform_credentials IS 'Almacena referencias a credenciales de plataformas. Los valores sensibles deben ser cifrados vía pgsodium.';

-- ═══════════════════════════════════════════
-- FILE: migrations/003_agent_logs.sql
-- ═══════════════════════════════════════════
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

-- ═══════════════════════════════════════════
-- FILE: migrations/004_core_business.sql
-- ═══════════════════════════════════════════
-- migrations/004_core_business.sql
-- KINEXIS — Core de Negocio: Productos, Órdenes e Inventario

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    category TEXT,
    is_kit BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, sku)
);

-- 2. Tabla de Kits (Relación SKU por SKU)
CREATE TABLE IF NOT EXISTS product_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    parent_sku TEXT NOT NULL,
    child_sku TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabla de Órdenes
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    external_id TEXT, -- Mercado Libre Pack ID, Shopify Order Name, etc.
    platform TEXT NOT NULL CHECK (platform IN ('ml', 'amazon', 'shopify', 'b2b')),
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'SENT', 'DELIVERED', 'CANCELLED')),
    customer_name TEXT,
    customer_rfc TEXT,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    shipping_cost DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Ítems de la Orden
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Inventario
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sku TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    warehouse_location TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, sku)
);

-- 6. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS
CREATE POLICY core_products_isolation ON products FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY core_kits_isolation ON product_kits FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY core_orders_isolation ON orders FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY core_order_items_isolation ON order_items FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY core_inventory_isolation ON inventory FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════
-- FILE: migrations/005_ml_credentials.sql
-- ═══════════════════════════════════════════
-- migrations/005_ml_credentials.sql
-- KINEXIS — Registro Seguro de Credenciales Mercado Libre (Kap Tools)

-- Nota: Para que estas funciones existan, pgsodium y vault deben estar habilitados en Supabase.

-- 1. App ID
-- NOTA: Configurar secrets via Supabase Dashboard
-- Settings -> Vault -> Add Secret
-- Key: [nombre_del_secret]

-- 2. Client Secret
-- NOTA: Configurar secrets via Supabase Dashboard
-- Settings -> Vault -> Add Secret
-- Key: [nombre_del_secret]

-- 3. Comentario de Auditoría

-- ═══════════════════════════════════════════
-- FILE: migrations/006_print_queue.sql
-- ═══════════════════════════════════════════
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

-- ═══════════════════════════════════════════
-- FILE: migrations/007_cfdi_records.sql
-- ═══════════════════════════════════════════
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

-- ═══════════════════════════════════════════
-- FILE: migrations/008_whatsapp_messages.sql
-- ═══════════════════════════════════════════
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

-- ═══════════════════════════════════════════
-- FILE: migrations/009_sales_b2b.sql
-- ═══════════════════════════════════════════
-- Migration: 009_sales_b2b
-- Description: Tables for B2B sales management

-- B2B Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  order_id UUID REFERENCES orders(id),
  quote_number TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  iva DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  valid_until DATE NOT NULL,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN (
      'draft','sent','accepted',
      'rejected','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated follow-up queue
CREATE TABLE IF NOT EXISTS followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  agent_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','executed','cancelled')),
  context JSONB
);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_quotes ON quotes
  FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY tenant_isolation_followup_queue ON followup_queue
  FOR ALL USING (tenant_id = auth.uid());

-- Indices
CREATE INDEX idx_quotes_tenant_status ON quotes(tenant_id, status);
CREATE INDEX idx_quotes_tenant_lead ON quotes(tenant_id, lead_id);
CREATE INDEX idx_followup_scheduled_at ON followup_queue(scheduled_at) WHERE status = 'pending';

-- ═══════════════════════════════════════════
-- FILE: migrations/010_inventory_procurement.sql
-- ═══════════════════════════════════════════
-- migrations/010_inventory_procurement.sql
-- ERP Core: Inventory Movements & Procurement

-- 1. Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('sale', 'receipt', 'adjustment', 'return', 'sync_correction')),
  qty_change INTEGER NOT NULL,
  qty_before INTEGER NOT NULL,
  qty_after INTEGER NOT NULL,
  platform TEXT,
  reference_id TEXT,
  registered_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Inventory Movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_inventory_movements ON inventory_movements
  FOR ALL USING (tenant_id = auth.uid()); -- o la política estándar de auth

-- Índices de Movements
CREATE INDEX idx_inv_mov_tenant_sku ON inventory_movements(tenant_id, sku);
CREATE INDEX idx_inv_mov_tenant_created ON inventory_movements(tenant_id, created_at DESC);
CREATE INDEX idx_inv_mov_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_mov_platform ON inventory_movements(platform);


-- 2. Approved Suppliers
CREATE TABLE IF NOT EXISTS approved_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  categories TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  incumplimientos_90_dias INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approved_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_approved_suppliers ON approved_suppliers
  FOR ALL USING (tenant_id = auth.uid());


-- 3. Purchase Orders (Procurement)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID REFERENCES approved_suppliers(id),
  status TEXT DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'RECEIVED', 'CANCELLED')),
  items JSONB NOT NULL,
  total_estimate DECIMAL(12,2) NOT NULL,
  approval_url TEXT,
  approval_expires_at TIMESTAMPTZ,
  approved_by TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders
  FOR ALL USING (tenant_id = auth.uid());

CREATE INDEX idx_po_tenant_status ON purchase_orders(tenant_id, status);

-- 4. Leads Table (Implicitly referenced earlier, creating if not exists to ensure integrity for tests and future)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  source TEXT,
  score INTEGER DEFAULT 0,
  deal_stage TEXT DEFAULT 'new',
  type TEXT DEFAULT 'unknown' CHECK (type IN ('b2b', 'b2c', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leads ON leads FOR ALL USING (tenant_id = auth.uid());
CREATE INDEX idx_leads_tenant_phone ON leads(tenant_id, phone);
CREATE INDEX idx_leads_tenant_email ON leads(tenant_id, email);

-- ═══════════════════════════════════════════
-- FILE: migrations/011_support_tickets.sql
-- ═══════════════════════════════════════════
-- migrations/011_support_tickets.sql

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT,
  contact_phone TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  status TEXT DEFAULT 'open'
    CHECK (status IN (
      'open', 'resolved', 'escalated')),
  turn_count INTEGER DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON support_tickets
  FOR ALL USING (tenant_id = auth.uid()); -- O el mecanimos que usen, pero aquí lo implementamos vía código en el agente

-- Índices recomendados
CREATE INDEX idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);
CREATE INDEX idx_support_tickets_tenant_phone ON support_tickets(tenant_id, contact_phone);
CREATE INDEX idx_support_tickets_order_id ON support_tickets(order_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/012_b2b_accounts.sql
-- ═══════════════════════════════════════════
-- migrations/012_b2b_accounts.sql

CREATE TABLE b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  company_name TEXT,
  contact_phone TEXT,
  mrr DECIMAL(12,2) DEFAULT 0,
  last_purchase_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 100
    CHECK (health_score BETWEEN 0 AND 100),
  nps_last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  account_id UUID REFERENCES b2b_accounts(id),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- RLS estándar en ambas tablas
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;

-- Índices recomendados
CREATE INDEX idx_b2b_accounts_tenant_health ON b2b_accounts(tenant_id, health_score);
CREATE INDEX idx_b2b_accounts_tenant_last_purchase ON b2b_accounts(tenant_id, last_purchase_at);
CREATE INDEX idx_b2b_accounts_tenant_nps_sent ON b2b_accounts(tenant_id, nps_last_sent_at);

-- ═══════════════════════════════════════════
-- FILE: migrations/013_import_shipments.sql
-- ═══════════════════════════════════════════
-- migrations/013_import_shipments.sql

CREATE TABLE import_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  po_id UUID REFERENCES purchase_orders(id),
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  status TEXT DEFAULT 'in_transit'
    CHECK (status IN (
      'in_transit', 'customs_cleared',
      'received', 'delayed', 'cancelled')),
  eta DATE,
  eta_original DATE,
  customs_reference TEXT,
  received_at TIMESTAMPTZ,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE import_shipments ENABLE ROW LEVEL SECURITY;

-- Índices recomendados
CREATE INDEX idx_import_shipments_tenant_status ON import_shipments(tenant_id, status);
CREATE INDEX idx_import_shipments_tenant_po ON import_shipments(tenant_id, po_id);
CREATE INDEX idx_import_shipments_eta ON import_shipments(eta);

-- ═══════════════════════════════════════════
-- FILE: migrations/014_amazon_orders.sql
-- ═══════════════════════════════════════════
-- migrations/014_amazon_orders.sql
CREATE TABLE amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  amazon_order_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','label_created',
      'shipped','cancelled')),
  items_json JSONB,
  tracking_number TEXT,
  carrier TEXT,
  same_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, amazon_order_id)
);

ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_amazon_orders_tenant_status ON amazon_orders(tenant_id, status);
CREATE INDEX idx_amazon_orders_amazon_id ON amazon_orders(amazon_order_id);
CREATE INDEX idx_amazon_orders_created_at ON amazon_orders(created_at DESC);
CREATE INDEX idx_amazon_orders_same_day ON amazon_orders(same_day) WHERE same_day = TRUE;

-- ═══════════════════════════════════════════
-- FILE: migrations/015_shopify_orders.sql
-- ═══════════════════════════════════════════
-- migrations/015_shopify_orders.sql
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  shopify_order_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','label_created',
      'shipped','cancelled')),
  fulfillment_id TEXT,
  tracking_number TEXT,
  tracking_company TEXT,
  label_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, shopify_order_id)
);

ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shopify_orders_tenant_status ON shopify_orders(tenant_id, status);
CREATE INDEX idx_shopify_orders_shopify_id ON shopify_orders(shopify_order_id);
CREATE INDEX idx_shopify_orders_created_at ON shopify_orders(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/016_skydrop_labels.sql
-- ═══════════════════════════════════════════
-- migrations/016_skydrop_labels.sql
CREATE TABLE skydrop_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  shopify_order_id TEXT,
  tracking_number TEXT NOT NULL,
  carrier TEXT,
  label_url TEXT,
  shipment_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skydrop_labels ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_skydrop_labels_tenant_tracking ON skydrop_labels(tenant_id, tracking_number);
CREATE INDEX idx_skydrop_labels_shopify_id ON skydrop_labels(shopify_order_id);
CREATE INDEX idx_skydrop_labels_expires ON skydrop_labels(expires_at);

-- ═══════════════════════════════════════════
-- FILE: migrations/017_price_history.sql
-- ═══════════════════════════════════════════
-- migrations/017_price_history.sql
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  platform TEXT NOT NULL,
  price_before DECIMAL(12,2),
  price_after DECIMAL(12,2),
  cost_at_time DECIMAL(12,2),
  margin_pct DECIMAL(5,2),
  changed_by TEXT DEFAULT 'price_sync_agent',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their tenant's price history"
ON price_history FOR ALL
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Índices optimizados
CREATE INDEX idx_price_history_tenant_sku ON price_history(tenant_id, sku);
CREATE INDEX idx_price_history_tenant_platform ON price_history(tenant_id, platform);
CREATE INDEX idx_price_history_changed_at ON price_history(changed_at DESC);
CREATE INDEX idx_price_history_sku_platform ON price_history(sku, platform);

-- ═══════════════════════════════════════════
-- FILE: migrations/018_returns.sql
-- ═══════════════════════════════════════════
-- migrations/018_returns.sql
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending_approval'
    CHECK (status IN (
      'pending_approval','approved',
      'rejected','refunded','cancelled')),
  media_urls JSONB,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  cfdi_egreso_uuid TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS estándar por tenant
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their tenant's returns"
ON returns FOR ALL
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Índices optimizados
CREATE INDEX idx_returns_tenant_status ON returns(tenant_id, status);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_platform ON returns(platform);
CREATE INDEX idx_returns_created_at ON returns(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/019_catalog_sync_log.sql
-- ═══════════════════════════════════════════
-- migrations/019_catalog_sync_log.sql
CREATE TABLE catalog_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  trigger TEXT NOT NULL,
  platforms_synced JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catalog_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON catalog_sync_log
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_catalog_sync_log_tenant_sku ON catalog_sync_log(tenant_id, sku);
CREATE INDEX idx_catalog_sync_log_trigger ON catalog_sync_log(trigger);
CREATE INDEX idx_catalog_sync_log_created_at ON catalog_sync_log(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/020_listing_proposals.sql
-- ═══════════════════════════════════════════
-- migrations/020_listing_proposals.sql
CREATE TABLE listing_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  item_id TEXT,
  platform TEXT DEFAULT 'mercadolibre',
  proposal_type TEXT,
  current_value TEXT,
  proposed_value TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','applied')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON listing_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_listing_proposals_tenant_sku ON listing_proposals(tenant_id, sku);
CREATE INDEX idx_listing_proposals_status ON listing_proposals(status);
CREATE INDEX idx_listing_proposals_platform ON listing_proposals(platform);
CREATE INDEX idx_listing_proposals_created_at ON listing_proposals(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/021_analytics_reports.sql
-- ═══════════════════════════════════════════
-- migrations/021_analytics_reports.sql
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_type TEXT NOT NULL,
  date_from DATE,
  date_to DATE,
  report_url TEXT,
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON analytics_reports
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_analytics_reports_tenant_type ON analytics_reports(tenant_id, report_type);
CREATE INDEX idx_analytics_reports_created_at ON analytics_reports(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/022_finance_snapshots.sql
-- ═══════════════════════════════════════════
-- migrations/022_finance_snapshots.sql
CREATE TABLE finance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue DECIMAL(14,2) DEFAULT 0,
  costs DECIMAL(14,2) DEFAULT 0,
  gross_margin DECIMAL(14,2) DEFAULT 0,
  cash_balance DECIMAL(14,2) DEFAULT 0,
  projection_30d DECIMAL(14,2) DEFAULT 0,
  alerts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON finance_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_finance_snapshots_tenant_period ON finance_snapshots(tenant_id, period_start);
CREATE INDEX idx_finance_snapshots_created_at ON finance_snapshots(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/023_supplier_evaluations.sql
-- ═══════════════════════════════════════════
-- migrations/023_supplier_evaluations.sql
CREATE TABLE supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID NOT NULL REFERENCES approved_suppliers(id),
  evaluation_type TEXT NOT NULL,
  score_precio INTEGER CHECK (score_precio BETWEEN 0 AND 100),
  score_calidad INTEGER CHECK (score_calidad BETWEEN 0 AND 100),
  score_tiempo INTEGER CHECK (score_tiempo BETWEEN 0 AND 100),
  score_total INTEGER CHECK (score_total BETWEEN 0 AND 100),
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON supplier_evaluations
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_supplier_evaluations_tenant_supplier ON supplier_evaluations(tenant_id, supplier_id);
CREATE INDEX idx_supplier_evaluations_type_at ON supplier_evaluations(evaluation_type, evaluated_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/024_product_proposals.sql
-- ═══════════════════════════════════════════
-- migrations/024_product_proposals.sql
CREATE TABLE product_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  request_type TEXT NOT NULL,
  category TEXT,
  proposed_skus JSONB DEFAULT '[]',
  estimated_roi DECIMAL(8,2),
  budget_required DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','implemented')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON product_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_product_proposals_tenant_status ON product_proposals(tenant_id, status);
CREATE INDEX idx_product_proposals_type ON product_proposals(request_type);
CREATE INDEX idx_product_proposals_created_at ON product_proposals(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/025_crisis_events.sql
-- ═══════════════════════════════════════════
-- migrations/025_crisis_events.sql
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  severity TEXT NOT NULL CHECK (severity IN ('level_1','level_2','level_3')),
  channel TEXT,
  trigger_type TEXT,
  content_summary TEXT,
  action_taken TEXT,
  ai_paused BOOLEAN DEFAULT FALSE,
  ads_paused BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON crisis_events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_crisis_events_tenant_severity ON crisis_events(tenant_id, severity);
CREATE INDEX idx_crisis_events_created_at ON crisis_events(created_at DESC);
CREATE INDEX idx_crisis_events_ai_paused ON crisis_events(ai_paused) WHERE ai_paused = TRUE;

-- ═══════════════════════════════════════════
-- FILE: migrations/026_review_snapshots.sql
-- ═══════════════════════════════════════════
-- migrations/026_review_snapshots.sql
CREATE TABLE review_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL CHECK (platform IN ('mercadolibre','amazon','all')),
  sku TEXT,
  avg_rating DECIMAL(3,2),
  review_count INTEGER,
  low_rating_alert BOOLEAN DEFAULT FALSE,
  fake_pattern_alert BOOLEAN DEFAULT FALSE,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE review_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON review_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_review_snapshots_tenant_platform ON review_snapshots(tenant_id, platform);
CREATE INDEX idx_review_snapshots_tenant_sku ON review_snapshots(tenant_id, sku);
CREATE INDEX idx_review_snapshots_alerts ON review_snapshots(low_rating_alert, fake_pattern_alert) WHERE low_rating_alert = TRUE OR fake_pattern_alert = TRUE;
CREATE INDEX idx_review_snapshots_at ON review_snapshots(snapshot_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/027_pipeline_snapshots.sql
-- ═══════════════════════════════════════════
-- migrations/027_pipeline_snapshots.sql
CREATE TABLE pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  leads_analyzed INTEGER DEFAULT 0,
  cold_leads INTEGER DEFAULT 0,
  stale_leads INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  pipeline_health JSONB,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON pipeline_snapshots
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_pipeline_snapshots_tenant_at ON pipeline_snapshots(tenant_id, snapshot_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/028_nps_surveys.sql
-- ═══════════════════════════════════════════
-- migrations/028_nps_surveys.sql
CREATE TABLE nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id TEXT,
  customer_contact TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','responded','expired')),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  promoter_type TEXT CHECK (promoter_type IN ('promoter','passive','detractor')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON nps_surveys
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_nps_surveys_tenant_contact ON nps_surveys(tenant_id, customer_contact);
CREATE INDEX idx_nps_surveys_tenant_status ON nps_surveys(tenant_id, status);
CREATE INDEX idx_nps_surveys_sent_at ON nps_surveys(sent_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/029_onboarding_progress.sql
-- ═══════════════════════════════════════════
-- migrations/029_onboarding_progress.sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  current_step TEXT DEFAULT 'welcome',
  completed_steps JSONB DEFAULT '[]',
  step_data JSONB DEFAULT '{}',
  blocking_issues JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_pct INTEGER DEFAULT 0
);

ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON onboarding_progress
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_onboarding_progress_tenant ON onboarding_progress(tenant_id);

-- ═══════════════════════════════════════════
-- FILE: migrations/030_fba_shipments.sql
-- ═══════════════════════════════════════════
-- migrations/030_fba_shipments.sql
CREATE TABLE fba_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  fnsku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shipment_id TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned','shipped','received','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fba_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON fba_shipments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_fba_shipments_tenant_sku ON fba_shipments(tenant_id, sku);
CREATE INDEX idx_fba_shipments_shipment_id ON fba_shipments(shipment_id);

-- ═══════════════════════════════════════════
-- FILE: migrations/031_ads_campaigns.sql
-- ═══════════════════════════════════════════
-- migrations/031_ads_campaigns.sql
CREATE TABLE ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','draft')),
  daily_budget DECIMAL(10,2),
  spend DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roas DECIMAL(8,4) DEFAULT 0,
  last_optimized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform, campaign_id)
);

ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON ads_campaigns
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_ads_campaigns_tenant_platform ON ads_campaigns(tenant_id, platform, status);
CREATE INDEX idx_ads_campaigns_roas ON ads_campaigns(roas);
CREATE INDEX idx_ads_campaigns_created_at ON ads_campaigns(created_at DESC);

-- ═══════════════════════════════════════════
-- FILE: migrations/032_content_proposals.sql
-- ═══════════════════════════════════════════
-- migrations/032_content_proposals.sql
CREATE TABLE content_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  action TEXT NOT NULL,
  image_url TEXT,
  caption TEXT,
  product_sku TEXT,
  hashtags JSONB DEFAULT '[]',
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  approved_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON content_proposals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_content_proposals_tenant_status ON content_proposals(tenant_id, status);
CREATE INDEX idx_content_proposals_scheduled_at ON content_proposals(scheduled_at);
CREATE INDEX idx_content_proposals_created_at ON content_proposals(created_at DESC);

