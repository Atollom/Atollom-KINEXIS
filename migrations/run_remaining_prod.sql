-- ══════════════════════════════════════════════════════════════════
-- KINEXIS — run_remaining_prod.sql
-- Script idempotente: parchea tablas existentes + crea las faltantes
-- Seguro ejecutar múltiples veces (IF NOT EXISTS en todo)
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- SECCIÓN A: PARCHEAR TABLAS EXISTENTES (columnas faltantes)
-- ──────────────────────────────────────────────────────────────────

-- A1. cfdi_records: columnas que faltaban en la migración parcial 007
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS error_code              TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS error_message           TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS requires_human_review   BOOLEAN DEFAULT FALSE;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS facturapi_id            TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS order_id                TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS platform                TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS subtotal                DECIMAL(12,2);
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS iva                     DECIMAL(12,2);
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS currency                CHAR(3) DEFAULT 'MXN';
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS customer_email          TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS customer_tax_regime     TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS customer_zip            TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS uso_cfdi                TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS forma_pago              TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS metodo_pago             CHAR(3);
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS related_cfdi_uuid       TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS xml_url                 TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS pdf_url                 TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS approved_for_cancellation  BOOLEAN DEFAULT FALSE;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS cancellation_approved_by   TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS cancellation_motivo        TEXT;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS cancelled_at               TIMESTAMPTZ;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS timbrado_at                TIMESTAMPTZ;
ALTER TABLE cfdi_records ADD COLUMN IF NOT EXISTS updated_at                 TIMESTAMPTZ DEFAULT NOW();

-- A2. inventory: columna days_remaining usada por APIs y KPIs
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS days_remaining INTEGER DEFAULT 999;

-- A3. orders: columnas usadas por warehouse API
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_info      JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_metadata  JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT NOW();

-- A4. user_profiles: ampliar roles para el sistema RBAC actual
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('owner','admin','warehouse','contador','viewer','socia','almacenista','agente'));

-- A5. agent_execution_logs: columna 'name' y 'module' para agents status API
ALTER TABLE agent_execution_logs ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
ALTER TABLE agent_execution_logs ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- ──────────────────────────────────────────────────────────────────
-- SECCIÓN B: COMPLETAR MIGRACIONES PARCIALES (003, 006, 007)
-- ──────────────────────────────────────────────────────────────────

-- B1. De 003_agent_logs: tablas que pudieron no haberse creado
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID REFERENCES agent_execution_logs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    check_name TEXT NOT NULL,
    is_passing BOOLEAN NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS validation_logs_isolation ON validation_logs;
CREATE POLICY validation_logs_isolation ON validation_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS routing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_log_id UUID REFERENCES agent_execution_logs(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sub_router TEXT NOT NULL,
    target_agent_id TEXT NOT NULL,
    routing_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE routing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS routing_logs_isolation ON routing_logs;
CREATE POLICY routing_logs_isolation ON routing_logs
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- B2. De 006_print_queue
CREATE TABLE IF NOT EXISTS print_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    order_id TEXT NOT NULL,
    job_content TEXT,
    protocol TEXT DEFAULT 'ZPL' CHECK (protocol IN ('ZPL', 'EPL')),
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PRINTING', 'DONE', 'FAILED')),
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
ALTER TABLE print_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS print_queue_tenant_isolation ON print_queue;
CREATE POLICY print_queue_tenant_isolation ON print_queue
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_print_queue_tenant_status ON print_queue(tenant_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_print_queue_order ON print_queue(order_id);

-- B3. De 007_cfdi_records: cfdi_tenant_config_ext y objetos dependientes
CREATE TABLE IF NOT EXISTS cfdi_tenant_config_ext (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    facturapi_org_id TEXT,
    rfc_emisor TEXT NOT NULL DEFAULT '',
    nombre_emisor TEXT NOT NULL DEFAULT '',
    regimen_fiscal TEXT NOT NULL DEFAULT '601',
    cp_expedicion TEXT NOT NULL DEFAULT '00000',
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
ALTER TABLE cfdi_tenant_config_ext ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cfdi_config_ext_tenant_isolation ON cfdi_tenant_config_ext;
CREATE POLICY cfdi_config_ext_tenant_isolation ON cfdi_tenant_config_ext
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- Función updated_at (idempotente con OR REPLACE)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

-- Triggers de updated_at (drop primero para idempotencia)
DROP TRIGGER IF EXISTS update_cfdi_records_updated_at ON cfdi_records;
CREATE TRIGGER update_cfdi_records_updated_at
    BEFORE UPDATE ON cfdi_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_cfdi_tenant_config_ext_updated_at ON cfdi_tenant_config_ext;
CREATE TRIGGER update_cfdi_tenant_config_ext_updated_at
    BEFORE UPDATE ON cfdi_tenant_config_ext FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Vista de auditoría (ahora que las columnas existen)
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

-- Función aprobación cancelación CFDI
CREATE OR REPLACE FUNCTION approve_cfdi_cancellation(
  p_cfdi_uuid TEXT, p_tenant_id UUID,
  p_approved_by TEXT, p_motivo TEXT DEFAULT '02'
) RETURNS JSONB AS $$
DECLARE v_record_id UUID; v_status TEXT;
BEGIN
    SELECT id, status INTO v_record_id, v_status
    FROM cfdi_records WHERE uuid = p_cfdi_uuid AND tenant_id = p_tenant_id;
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
    RETURN jsonb_build_object('success', true, 'message', 'Cancelación aprobada.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed Kap Tools en cfdi_tenant_config_ext
INSERT INTO cfdi_tenant_config_ext (
  tenant_id, rfc_emisor, nombre_emisor, regimen_fiscal, cp_expedicion,
  serie_ingreso, serie_egreso, serie_pago
) VALUES (
  '40446806-0107-6201-9311-000000000001',
  'KTO2202178K8', 'KAP TOOLS SA DE CV', '601', '72973',
  'KT', 'KTNC', 'KTP'
) ON CONFLICT (tenant_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- SECCIÓN C: TABLAS NUEVAS REQUERIDAS POR APIs (no estaban en ninguna migración)
-- ──────────────────────────────────────────────────────────────────

-- C1. tenant_agent_config — usada por /api/agents/status
CREATE TABLE IF NOT EXISTS tenant_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    module TEXT NOT NULL,
    autonomy_level TEXT DEFAULT 'NOTIFY'
        CHECK (autonomy_level IN ('FULL','NOTIFY','SUPERVISED','HUMAN_REQUIRED','PAUSED')),
    active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, agent_id)
);
ALTER TABLE tenant_agent_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_agent_config_isolation ON tenant_agent_config;
CREATE POLICY tenant_agent_config_isolation ON tenant_agent_config
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS tenant_agent_config_service_role ON tenant_agent_config;
CREATE POLICY tenant_agent_config_service_role ON tenant_agent_config
    FOR ALL TO service_role USING (true);
CREATE INDEX IF NOT EXISTS idx_agent_config_tenant ON tenant_agent_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_config_active ON tenant_agent_config(tenant_id, active);

-- C2. tenant_business_rules — usada por /api/settings/business-rules e inventario
CREATE TABLE IF NOT EXISTS tenant_business_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
    ml_margin DECIMAL(5,3) DEFAULT 1.20,
    amazon_margin DECIMAL(5,3) DEFAULT 1.25,
    shopify_margin DECIMAL(5,3) DEFAULT 1.30,
    b2b_margin DECIMAL(5,3) DEFAULT 1.18,
    stock_safety_days INTEGER DEFAULT 15,
    stock_critical_days INTEGER DEFAULT 7,
    nps_cooldown_days INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tenant_business_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_business_rules_isolation ON tenant_business_rules;
CREATE POLICY tenant_business_rules_isolation ON tenant_business_rules
    FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS tenant_business_rules_service_role ON tenant_business_rules;
CREATE POLICY tenant_business_rules_service_role ON tenant_business_rules
    FOR ALL TO service_role USING (true);

-- Seed defaults para Kap Tools
INSERT INTO tenant_business_rules (tenant_id)
VALUES ('40446806-0107-6201-9311-000000000001')
ON CONFLICT (tenant_id) DO NOTHING;

-- Seed de 43 agentes para Kap Tools
INSERT INTO tenant_agent_config (tenant_id, agent_id, name, module, autonomy_level) VALUES
  ('40446806-0107-6201-9311-000000000001','agent_00','Guardian / Router','core','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_01','ML Fulfillment','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_02','Amazon FBA Manager','ecommerce','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_03','Shopify Fulfillment','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_04','B2B Sales','crm','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_05','Inventory Monitor','erp','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_06','Price Manager ML','ecommerce','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_07','Price Manager Amazon','ecommerce','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_08','Price Manager Shopify','ecommerce','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_09','WhatsApp Handler','meta','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_10','Instagram Publisher','meta','HUMAN_REQUIRED'),
  ('40446806-0107-6201-9311-000000000001','agent_11','ML Ads Manager','ecommerce','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_12','Meta Ads Manager','meta','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_13','CFDI Billing','erp','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_14','Returns Manager','ecommerce','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_15','Catalog Manager','erp','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_16','Supplier Evaluator','erp','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_17','Analytics Reporter','core','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_18','Finance Snapshot','erp','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_19','NPS Collector','crm','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_20','Onboarding Guide','core','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_21','Crisis Manager','core','HUMAN_REQUIRED'),
  ('40446806-0107-6201-9311-000000000001','agent_22','Review Monitor','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_23','Pipeline Monitor','core','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_24','Thermal Printer','erp','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_25','Skydrop Shipping','erp','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_26','Validator','core','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_27','ML Questions Handler','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_28','Instagram CRM','meta','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_29','Content Scheduler','meta','HUMAN_REQUIRED'),
  ('40446806-0107-6201-9311-000000000001','agent_30','Purchase Order Agent','erp','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_31','Lead Scorer','crm','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_32','Quote Generator','crm','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_33','Follow-up Agent','crm','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_34','FBA Shipment Agent','ecommerce','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_35','Import Manager','erp','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_36','Listing Optimizer','ecommerce','SUPERVISED'),
  ('40446806-0107-6201-9311-000000000001','agent_37','Support Ticket Agent','crm','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_38','B2B Account Manager','crm','NOTIFY'),
  ('40446806-0107-6201-9311-000000000001','agent_39','Shopify Sync','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_40','Amazon Sync','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_41','ML Sync','ecommerce','FULL'),
  ('40446806-0107-6201-9311-000000000001','agent_42','Notification Dispatcher','core','FULL')
ON CONFLICT (tenant_id, agent_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- SECCIÓN D: MIGRACIONES 008-032 (con IF NOT EXISTS + DROP POLICY IF EXISTS)
-- ──────────────────────────────────────────────────────────────────

-- ═══ 008_whatsapp_messages ═══════════════════════════════════════
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
  intent_classification TEXT,
  contact_phone TEXT,
  processed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'received',
  lead_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_whatsapp_messages ON whatsapp_messages;
CREATE POLICY tenant_isolation_whatsapp_messages ON whatsapp_messages
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_id ON whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at_desc ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_phone ON whatsapp_messages(tenant_id, contact_phone);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  from_number TEXT NOT NULL,
  session_type TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, from_number, session_type)
);
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_whatsapp_sessions ON whatsapp_sessions;
CREATE POLICY tenant_isolation_whatsapp_sessions ON whatsapp_sessions
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 009_sales_b2b ═══════════════════════════════════════════════
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
  type TEXT DEFAULT 'unknown' CHECK (type IN ('b2b','b2c','unknown')),
  assigned_agent TEXT,
  estimated_value DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_leads ON leads;
CREATE POLICY tenant_isolation_leads ON leads
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_leads_tenant_phone ON leads(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_score ON leads(tenant_id, score DESC);

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
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_quotes ON quotes;
CREATE POLICY tenant_isolation_quotes ON quotes
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_status ON quotes(tenant_id, status);

CREATE TABLE IF NOT EXISTS followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  agent_id TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','executed','cancelled')),
  context JSONB
);
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_followup_queue ON followup_queue;
CREATE POLICY tenant_isolation_followup_queue ON followup_queue
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_followup_scheduled_at ON followup_queue(scheduled_at) WHERE status = 'pending';

-- ═══ 010_inventory_procurement ═══════════════════════════════════
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale','receipt','adjustment','return','sync_correction')),
  qty_change INTEGER NOT NULL,
  qty_before INTEGER NOT NULL,
  qty_after INTEGER NOT NULL,
  platform TEXT,
  reference_id TEXT,
  registered_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_inventory_movements ON inventory_movements;
CREATE POLICY tenant_isolation_inventory_movements ON inventory_movements
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_inv_mov_tenant_sku ON inventory_movements(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_inv_mov_tenant_created ON inventory_movements(tenant_id, created_at DESC);

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
DROP POLICY IF EXISTS tenant_isolation_approved_suppliers ON approved_suppliers;
CREATE POLICY tenant_isolation_approved_suppliers ON approved_suppliers
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID REFERENCES approved_suppliers(id),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','SENT','RECEIVED','CANCELLED')),
  items JSONB NOT NULL DEFAULT '[]',
  total_estimate DECIMAL(12,2) NOT NULL DEFAULT 0,
  approval_url TEXT,
  approval_expires_at TIMESTAMPTZ,
  approved_by TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_purchase_orders ON purchase_orders;
CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_po_tenant_status ON purchase_orders(tenant_id, status);

-- ═══ 011_support_tickets ═════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  external_id TEXT,
  platform TEXT,
  customer_name TEXT,
  customer_contact TEXT,
  issue_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assigned_agent TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_support_tickets ON support_tickets;
CREATE POLICY tenant_isolation_support_tickets ON support_tickets
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);

-- ═══ 012_b2b_accounts ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  rfc TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_b2b_accounts ON b2b_accounts;
CREATE POLICY tenant_isolation_b2b_accounts ON b2b_accounts
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS nps_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_contact TEXT NOT NULL,
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  platform TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE nps_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_nps_responses ON nps_responses;
CREATE POLICY tenant_isolation_nps_responses ON nps_responses
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 013_import_shipments ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS import_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  reference TEXT NOT NULL,
  supplier_id UUID REFERENCES approved_suppliers(id),
  status TEXT DEFAULT 'IN_TRANSIT' CHECK (status IN ('IN_TRANSIT','CUSTOMS','DELIVERED','DELAYED')),
  items JSONB DEFAULT '[]',
  eta DATE,
  arrived_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE import_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_import_shipments ON import_shipments;
CREATE POLICY tenant_isolation_import_shipments ON import_shipments
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 014_amazon_orders ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  amazon_order_id TEXT NOT NULL,
  fulfillment_channel TEXT,
  ship_service_level TEXT,
  same_day BOOLEAN DEFAULT FALSE,
  buyer_email TEXT,
  ship_address JSONB,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_amazon_orders ON amazon_orders;
CREATE POLICY tenant_isolation_amazon_orders ON amazon_orders
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_amazon_orders_tenant ON amazon_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_id ON amazon_orders(amazon_order_id);

-- ═══ 015_shopify_orders ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  shopify_order_id TEXT NOT NULL,
  shopify_order_name TEXT,
  financial_status TEXT,
  fulfillment_status TEXT,
  shipping_address JSONB,
  line_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_shopify_orders ON shopify_orders;
CREATE POLICY tenant_isolation_shopify_orders ON shopify_orders
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_shopify_orders_tenant ON shopify_orders(tenant_id);

-- ═══ 016_skydrop_labels ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS skydrop_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  tracking_number TEXT,
  carrier TEXT,
  label_url TEXT,
  shipment_id TEXT,
  status TEXT DEFAULT 'CREATED' CHECK (status IN ('CREATED','IN_TRANSIT','DELIVERED','EXCEPTION')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE skydrop_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_skydrop_labels ON skydrop_labels;
CREATE POLICY tenant_isolation_skydrop_labels ON skydrop_labels
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_skydrop_labels_tenant ON skydrop_labels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skydrop_tracking ON skydrop_labels(tracking_number);

-- ═══ 017_price_history ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  platform TEXT NOT NULL,
  old_price DECIMAL(12,2),
  new_price DECIMAL(12,2),
  changed_by TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_price_history ON price_history;
CREATE POLICY tenant_isolation_price_history ON price_history
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_price_history_tenant_sku ON price_history(tenant_id, sku);

-- ═══ 018_returns ═════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_id UUID REFERENCES orders(id),
  external_id TEXT,
  platform TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending_approval'
    CHECK (status IN ('pending_approval','approved','rejected','received','refunded')),
  items JSONB DEFAULT '[]',
  refund_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_returns ON returns;
CREATE POLICY tenant_isolation_returns ON returns
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_returns_tenant_status ON returns(tenant_id, status);

-- ═══ 019_catalog_sync_log ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS catalog_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL,
  sku TEXT,
  action TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success','failed','skipped')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE catalog_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_catalog_sync_log ON catalog_sync_log;
CREATE POLICY tenant_isolation_catalog_sync_log ON catalog_sync_log
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_catalog_sync_tenant ON catalog_sync_log(tenant_id, created_at DESC);

-- ═══ 020_listing_proposals ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS listing_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku TEXT NOT NULL,
  platform TEXT NOT NULL,
  proposed_title TEXT,
  proposed_description TEXT,
  proposed_price DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','applied')),
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE listing_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_listing_proposals ON listing_proposals;
CREATE POLICY tenant_isolation_listing_proposals ON listing_proposals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 021_analytics_reports ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE analytics_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_analytics_reports ON analytics_reports;
CREATE POLICY tenant_isolation_analytics_reports ON analytics_reports
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_type ON analytics_reports(tenant_id, report_type);

-- ═══ 022_finance_snapshots ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  snapshot_date DATE NOT NULL,
  revenue DECIMAL(12,2) DEFAULT 0,
  cogs DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  platform_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, snapshot_date)
);
ALTER TABLE finance_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_finance_snapshots ON finance_snapshots;
CREATE POLICY tenant_isolation_finance_snapshots ON finance_snapshots
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 023_supplier_evaluations ════════════════════════════════════
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  supplier_id UUID REFERENCES approved_suppliers(id),
  period TEXT NOT NULL,
  on_time_delivery_pct DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  price_competitiveness DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_supplier_evaluations ON supplier_evaluations;
CREATE POLICY tenant_isolation_supplier_evaluations ON supplier_evaluations
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 024_product_proposals ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS product_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  proposed_sku TEXT,
  name TEXT NOT NULL,
  category TEXT,
  estimated_cost DECIMAL(12,2),
  estimated_price DECIMAL(12,2),
  rationale TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_product_proposals ON product_proposals;
CREATE POLICY tenant_isolation_product_proposals ON product_proposals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 025_crisis_events ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type TEXT NOT NULL,
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 3),
  description TEXT,
  affected_agents TEXT[],
  ai_active BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE crisis_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_crisis_events ON crisis_events;
CREATE POLICY tenant_isolation_crisis_events ON crisis_events
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_crisis_tenant_active ON crisis_events(tenant_id) WHERE resolved_at IS NULL;

-- ═══ 026_review_snapshots ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS review_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL,
  sku TEXT,
  avg_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE review_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_review_snapshots ON review_snapshots;
CREATE POLICY tenant_isolation_review_snapshots ON review_snapshots
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 027_pipeline_snapshots ══════════════════════════════════════
CREATE TABLE IF NOT EXISTS pipeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  snapshot_date DATE NOT NULL,
  stage TEXT NOT NULL,
  lead_count INTEGER DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_pipeline_snapshots ON pipeline_snapshots;
CREATE POLICY tenant_isolation_pipeline_snapshots ON pipeline_snapshots
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 028_nps_surveys ═════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_contact TEXT NOT NULL,
  platform TEXT,
  order_id UUID REFERENCES orders(id),
  score INTEGER CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ
);
ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_nps_surveys ON nps_surveys;
CREATE POLICY tenant_isolation_nps_surveys ON nps_surveys
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_nps_surveys_tenant_contact ON nps_surveys(tenant_id, customer_contact);

-- ═══ 029_onboarding_progress ═════════════════════════════════════
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  current_step TEXT DEFAULT 'start',
  progress_pct INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_onboarding_progress ON onboarding_progress;
CREATE POLICY tenant_isolation_onboarding_progress ON onboarding_progress
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));

-- ═══ 030_fba_shipments ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fba_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  shipment_id TEXT NOT NULL,
  name TEXT,
  destination_fulfillment_center_id TEXT,
  ship_from_address JSONB,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'WORKING',
  fnsku_validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE fba_shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_fba_shipments ON fba_shipments;
CREATE POLICY tenant_isolation_fba_shipments ON fba_shipments
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_fba_shipments_tenant ON fba_shipments(tenant_id);

-- ═══ 031_ads_campaigns ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL CHECK (platform IN ('ml','amazon','meta')),
  campaign_id TEXT,
  campaign_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  budget DECIMAL(12,2),
  spend DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roas DECIMAL(8,4),
  acos DECIMAL(8,4),
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ads_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_ads_campaigns ON ads_campaigns;
CREATE POLICY tenant_isolation_ads_campaigns ON ads_campaigns
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_tenant_platform ON ads_campaigns(tenant_id, platform);

-- ═══ 032_content_proposals ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook','whatsapp')),
  content_type TEXT DEFAULT 'post' CHECK (content_type IN ('post','story','reel','message')),
  caption TEXT,
  media_urls TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_by TEXT,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE content_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_content_proposals ON content_proposals;
CREATE POLICY tenant_isolation_content_proposals ON content_proposals
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_content_proposals_tenant_status ON content_proposals(tenant_id, status);

-- ══════════════════════════════════════════════════════════════════
-- FIN — todas las tablas y relaciones KINEXIS v1.0
-- ══════════════════════════════════════════════════════════════════
