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
