-- CFDI Multi-Tenant Tables
-- Autor: Carlos Cortés (Atollom Labs)
-- Fecha: 2026-04-21

-- ─────────────────────────────────────────────────────────────────────────────
-- Configuración fiscal por tenant (un registro por cliente de Atollom)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE tenant_fiscal_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,

  -- Datos fiscales del CLIENTE (emisor de sus propias facturas)
  rfc VARCHAR(13) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  regimen_fiscal VARCHAR(3) NOT NULL,   -- Clave SAT: 601, 612, 626, etc.
  codigo_postal VARCHAR(5) NOT NULL,

  -- Certificados CSD (Certificado de Sello Digital del tenant)
  cer_file TEXT,
  key_file TEXT,
  key_password_encrypted TEXT,

  -- Facturama Profile ID (cache para evitar lookups repetidos)
  facturama_profile_id VARCHAR(50),

  -- Control de cuota mensual
  invoice_limit_monthly INTEGER NOT NULL DEFAULT 500,
  invoices_used_current_month INTEGER NOT NULL DEFAULT 0,
  current_period_start DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW()),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fiscal_config_tenant ON tenant_fiscal_config(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Facturas emitidas (registro histórico inmutable)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE cfdi_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Identificadores SAT
  uuid VARCHAR(36) UNIQUE NOT NULL,     -- UUID del timbre SAT
  folio_number VARCHAR(50),
  serie VARCHAR(10),

  -- Emisor (el tenant)
  issuer_rfc VARCHAR(13) NOT NULL,
  issuer_name VARCHAR(255) NOT NULL,

  -- Receptor (cliente del tenant)
  receiver_rfc VARCHAR(13) NOT NULL,
  receiver_name VARCHAR(255) NOT NULL,

  -- Montos
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',

  -- Claves SAT
  payment_form VARCHAR(2),       -- 01-30
  payment_method VARCHAR(3),     -- PUE | PPD
  cfdi_use VARCHAR(3),           -- G01-P01

  -- Provider utilizado
  provider VARCHAR(20) NOT NULL,         -- 'facturama' | 'facturapi'
  provider_invoice_id VARCHAR(100),      -- ID interno del provider

  -- Archivos
  xml_url TEXT,
  pdf_url TEXT,

  -- Status y cancelación
  status VARCHAR(20) NOT NULL DEFAULT 'valid',  -- valid | cancelled | error
  cancelled_at TIMESTAMPTZ,
  cancellation_motive VARCHAR(2),               -- 01-04 (clave SAT)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cfdi_tenant     ON cfdi_invoices(tenant_id);
CREATE INDEX idx_cfdi_uuid       ON cfdi_invoices(uuid);
CREATE INDEX idx_cfdi_created    ON cfdi_invoices(created_at DESC);
CREATE INDEX idx_cfdi_status     ON cfdi_invoices(status);
CREATE INDEX idx_cfdi_issuer_rfc ON cfdi_invoices(issuer_rfc);
CREATE INDEX idx_cfdi_receiver   ON cfdi_invoices(receiver_rfc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: resetear contador mensual cuando cambia el período
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_monthly_invoice_count()
RETURNS TRIGGER AS $$
BEGIN
  IF DATE_TRUNC('month', NEW.current_period_start) < DATE_TRUNC('month', NOW()) THEN
    NEW.invoices_used_current_month := 0;
    NEW.current_period_start := DATE_TRUNC('month', NOW())::DATE;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_invoice_count
  BEFORE UPDATE ON tenant_fiscal_config
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_invoice_count();

-- Trigger para updated_at en cfdi_invoices
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cfdi_updated_at
  BEFORE UPDATE ON cfdi_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Vista: dashboard de uso mensual por tenant
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW cfdi_usage_by_tenant AS
SELECT
  tfc.tenant_id,
  tfc.rfc,
  tfc.razon_social,
  tfc.invoice_limit_monthly                                   AS quota_limit,
  tfc.invoices_used_current_month                             AS quota_used,
  (tfc.invoice_limit_monthly - tfc.invoices_used_current_month)
                                                              AS quota_remaining,
  ROUND(
    tfc.invoices_used_current_month::DECIMAL /
    NULLIF(tfc.invoice_limit_monthly, 0) * 100, 1
  )                                                           AS usage_pct,
  tfc.current_period_start,
  (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE    AS period_reset_date,
  (
    (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE - NOW()::DATE
  )                                                           AS days_until_reset
FROM tenant_fiscal_config tfc;

-- ─────────────────────────────────────────────────────────────────────────────
-- Vista: últimas facturas por tenant (útil para listados en dashboard)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW cfdi_recent_invoices AS
SELECT
  ci.tenant_id,
  ci.uuid,
  ci.folio_number,
  ci.issuer_rfc,
  ci.receiver_rfc,
  ci.receiver_name,
  ci.total,
  ci.currency,
  ci.status,
  ci.provider,
  ci.pdf_url,
  ci.created_at
FROM cfdi_invoices ci
WHERE ci.status != 'error'
ORDER BY ci.created_at DESC;
