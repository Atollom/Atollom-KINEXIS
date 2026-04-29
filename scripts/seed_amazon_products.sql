-- ============================================================
-- SEED: Productos Amazon - Kap Tools Demo
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Descripción: 15 productos en Amazon Seller Central.
--   - 10 compartidos con Mercado Libre (mismo SKU)
--   - 5  exclusivos Amazon (SKU prefix AMZ-)
--   - Precios diferenciados vs ML (Amazon suele ser +3-8%)
--   - Mix FBA (Fulfillment by Amazon) y FBM (Fulfilled by Merchant)
-- Referencia SKUs de seed_ml_products.sql donde aplique.
-- ============================================================

BEGIN;

INSERT INTO amazon_products (
  tenant_id,
  asin,
  sku,
  title,
  price,
  quantity_available,
  fulfillment_channel,
  condition,
  status,
  marketplace,
  created_at
) VALUES

-- ════════════════════════════════════════════════════════════
-- PRODUCTOS COMPARTIDOS CON ML (SKU idéntico) — 10 registros
-- Precios Amazon entre +3% y +8% vs precio ML
-- ════════════════════════════════════════════════════════════

-- 1 · TAL-001 · Taladro Percutor 13mm (ML $1,299 → AMZ $1,349)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B09KXT4P1R',
  'TAL-001',
  'Kap Tools KT-650P Taladro Percutor 13mm 650W con Maletín – Velocidad Variable y Reversa',
  1349.00,
  8,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '60 days'
),

-- 2 · TAL-002 · Taladro Inalámbrico 20V (ML $2,850 → AMZ $2,999)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B09LMN8Q2S',
  'TAL-002',
  'Kap Tools KT-20V Taladro Atornillador Inalámbrico 20V – 2 Baterías Litio + Cargador Rápido',
  2999.00,
  5,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '55 days'
),

-- 3 · TAL-004 · Rotomartillo SDS Plus (ML $4,199 → AMZ $4,399)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0BVJD3K7W',
  'TAL-004',
  'Kap Tools KT-SDS800 Rotomartillo SDS Plus 800W 3 Funciones – Set Brocas Incluido',
  4399.00,
  12,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '50 days'
),

-- 4 · SIE-001 · Sierra Circular 7-1/4" (ML $1,899 → AMZ $1,969)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0C2RS9P4N',
  'SIE-001',
  'Kap Tools KT-SC1600 Sierra Circular 7-1/4" 1600W con Guía Láser y Base Aluminio',
  1969.00,
  9,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '48 days'
),

-- 5 · SIE-002 · Sierra de Calar 800W (ML $1,150 → AMZ $1,199)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0C4TW2H6M',
  'SIE-002',
  'Kap Tools KT-SC800 Sierra Caladora 800W Velocidad Variable – Movimiento Pendular 4 Posiciones',
  1199.00,
  14,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '45 days'
),

-- 6 · COM-001 · Compresor 24L 2HP (ML $2,999 → AMZ $3,149)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0BRK5JP9Q',
  'COM-001',
  'Kap Tools KT-COM24 Compresor de Aire 24L 2HP 8 Bar – Válvula de Seguridad Manómetros Duales',
  3149.00,
  6,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '42 days'
),

-- 7 · AMO-001 · Amoladora 4-1/2" 850W (ML $799 → AMZ $829)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B09QHY7L3T',
  'AMO-001',
  'Kap Tools KT-AMO850 Amoladora Angular 4-1/2" 850W 11000 RPM – Protector Ajustable',
  829.00,
  28,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '40 days'
),

-- 8 · AMO-002 · Amoladora 5" 1200W (ML $1,099 → AMZ $1,149)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0C1WZ4R8V',
  'AMO-002',
  'Kap Tools KT-AMO1200 Amoladora Angular 5" 1200W – Freno Electrónico y Reinicio Suave',
  1149.00,
  17,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '38 days'
),

-- 9 · MAR-001 · Martillo Demoledor 1500W (ML $6,200 → AMZ $6,499)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0BXMF6D2P',
  'MAR-001',
  'Kap Tools KT-DEM1500 Martillo Demoledor Eléctrico 1500W 45J – Empuñadura Antivibración',
  6499.00,
  3,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '35 days'
),

-- 10 · MUL-001 · Herramienta Oscilante 300W (ML $1,699 → AMZ $1,779)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0C3NP1K5J',
  'MUL-001',
  'Kap Tools KT-MULTI Herramienta Oscilante Multifunción 300W – Set 32 Accesorios Universal OIS',
  1779.00,
  10,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '30 days'
),

-- ════════════════════════════════════════════════════════════
-- EXCLUSIVOS AMAZON (SKU prefix AMZ-) — 5 registros
-- Productos sin presencia en ML / exclusividad Amazon
-- ════════════════════════════════════════════════════════════

-- 11 · AMZ-NIVEL · Nivel Láser Autonivelante 3 Líneas
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0C8PT3V2X',
  'AMZ-NIVEL-01',
  'Kap Tools KT-LASER3L Nivel Láser Autonivelante 3 Líneas 30m – Trípode y Estuche Incluidos',
  2499.00,
  11,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '25 days'
),

-- 12 · AMZ-SOLD · Soldadora Inversora MMA 160A
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0B9QW7M4H',
  'AMZ-SOLD-01',
  'Kap Tools KT-WELD160 Soldadora Inversora MMA 160A IGBT – Panel Digital, Arranque en Frío',
  4850.00,
  7,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '22 days'
),

-- 13 · AMZ-HIDRO · Hidrolavadora 1800W 150 Bar
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0CDRT5S9L',
  'AMZ-HIDRO-01',
  'Kap Tools KT-WASH150 Hidrolavadora Eléctrica 1800W 150 Bar – Lanza Turbo y Detergente Incluido',
  3299.00,
  15,
  'FBA',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '20 days'
),

-- 14 · AMZ-ROUTER · Router / Fresadora 2200W con Guía
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0CF2HN6P7',
  'AMZ-ROUTE-01',
  'Kap Tools KT-ROUT2200 Fresadora Router 2200W Velocidad Variable 8000-24000 RPM – Set Fresas',
  3999.00,
  4,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '18 days'
),

-- 15 · AMZ-TERMO · Cámara Termográfica Industrial 256×192
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'B0CGJK8Q1N',
  'AMZ-TERMO-01',
  'Kap Tools KT-THERM256 Cámara Termográfica 256×192 IR – Pantalla 3.2" Medición -20°C a 550°C',
  7900.00,
  2,
  'FBM',
  'new',
  'active',
  'Amazon.com.mx',
  NOW() - INTERVAL '15 days'
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-INSERT
-- ============================================================
-- 1. Conteo por canal de fulfillment:
--
-- SELECT
--   fulfillment_channel,
--   COUNT(*)            AS productos,
--   AVG(price)::NUMERIC(10,2) AS precio_promedio,
--   SUM(quantity_available)   AS stock_total
-- FROM amazon_products
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- GROUP BY fulfillment_channel;
--
-- Resultado esperado:
--   FBA | 8 | ...
--   FBM | 7 | ...
--
-- 2. Productos compartidos con ML (cross-channel):
--
-- SELECT a.sku, a.price AS price_amz, m.price AS price_ml,
--        ROUND((a.price - m.price) / m.price * 100, 1) AS delta_pct
-- FROM amazon_products a
-- JOIN ml_products m USING (sku, tenant_id)
-- WHERE a.tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- ORDER BY a.sku;
--
-- Deberías ver 10 filas con delta entre +3% y +8%.
-- ============================================================
