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
  source TEXT,
  score INTEGER DEFAULT 0,
  type TEXT DEFAULT 'unknown' CHECK (type IN ('b2b', 'b2c', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leads ON leads FOR ALL USING (tenant_id = auth.uid());
CREATE INDEX idx_leads_tenant_phone ON leads(tenant_id, phone);
CREATE INDEX idx_leads_tenant_email ON leads(tenant_id, email);
