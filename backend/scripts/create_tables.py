"""
Crea todas las tablas en Railway PostgreSQL
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("🔌 Conectando a PostgreSQL...")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("📋 Creando tablas...")

# EXTENSIÓN
cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

# 1. TENANTS
cur.execute("""
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  rfc VARCHAR(13),
  legal_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  plan VARCHAR(20) DEFAULT 'starter',
  status VARCHAR(20) DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ tenants")

# 2. TENANT_FISCAL_CONFIG
cur.execute("""
CREATE TABLE IF NOT EXISTS tenant_fiscal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rfc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  regimen_fiscal VARCHAR(3) NOT NULL,
  codigo_postal VARCHAR(5) NOT NULL,
  invoice_limit_monthly INTEGER DEFAULT 500,
  invoices_used_current_month INTEGER DEFAULT 0,
  current_period_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id)
);
""")
print("✅ tenant_fiscal_config")

# 3. CFDI_INVOICES
cur.execute("""
CREATE TABLE IF NOT EXISTS cfdi_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  folio_number VARCHAR(50),
  serie VARCHAR(10),
  issuer_rfc VARCHAR(13) NOT NULL,
  issuer_name VARCHAR(255) NOT NULL,
  receiver_rfc VARCHAR(13) NOT NULL,
  receiver_name VARCHAR(255) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  payment_form VARCHAR(2),
  payment_method VARCHAR(3),
  cfdi_use VARCHAR(3),
  provider VARCHAR(20) NOT NULL,
  provider_invoice_id VARCHAR(100),
  xml_url TEXT,
  pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'valid',
  cancelled_at TIMESTAMP,
  cancellation_motive VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ cfdi_invoices")

# 4. USERS
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agente',
  supabase_user_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  email_confirmed BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ users")

# 5. TENANT_INTEGRATIONS
# config es JSONB en Railway (sin encriptar — demo)
# En producción con Supabase se usa TEXT + Fernet (migración 002)
cur.execute("""
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  is_connected BOOLEAN DEFAULT FALSE,
  last_test_at TIMESTAMP,
  last_test_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, provider)
);
""")
print("✅ tenant_integrations")

# 6. PRODUCTS
cur.execute("""
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  ml_item_id VARCHAR(50),
  amazon_asin VARCHAR(20),
  shopify_id VARCHAR(50),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  category VARCHAR(255),
  brand VARCHAR(255),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);
""")
print("✅ products")

# 7. CUSTOMERS
cur.execute("""
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ml_user_id VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  rfc VARCHAR(13),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(2) DEFAULT 'MX',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ customers")

# 8. ORDERS
cur.execute("""
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  ml_order_id VARCHAR(50),
  amazon_order_id VARCHAR(50),
  shopify_order_id VARCHAR(50),
  order_number VARCHAR(50),
  channel VARCHAR(20) DEFAULT 'direct',
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) DEFAULT 0,
  shipping DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ orders")

# 9. ORDER_ITEMS
cur.execute("""
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  name VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
""")
print("✅ order_items")

conn.commit()
cur.close()
conn.close()

print("\n🎉 TABLAS CREADAS - Listo para seed!")
