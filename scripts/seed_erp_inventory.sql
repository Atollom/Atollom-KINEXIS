-- ============================================================
-- SEED: Inventario ERP Centralizado - Kap Tools Demo
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Almacenes : WH-MATRIZ | WH-SUCURSAL-A | WH-SUCURSAL-B
-- SKUs      : Consolidados de ML + Amazon + Shopify
-- ⚠️  Alertas: filas donde quantity_available <= reorder_point
-- ============================================================

BEGIN;

INSERT INTO erp_inventory (
  tenant_id,
  sku,
  product_name,
  warehouse_id,
  quantity_available,
  quantity_reserved,
  reorder_point,
  cost_per_unit,
  created_at
) VALUES

-- ════════════════ TAL-001 · Taladro Percutor 13mm 650W ════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-001','Taladro Percutor 13mm 650W KT-650P','WH-MATRIZ',    18, 5, 10, 950.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-001','Taladro Percutor 13mm 650W KT-650P','WH-SUCURSAL-A', 3, 2,  5, 950.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-001','Taladro Percutor 13mm 650W KT-650P','WH-SUCURSAL-B', 7, 1,  5, 950.00, NOW()),

-- ════════════════ TAL-002 · Taladro Inalámbrico 20V ══════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-002','Taladro Inalámbrico 20V 2 Baterías KT-20V','WH-MATRIZ',    10, 3,  8, 2100.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-002','Taladro Inalámbrico 20V 2 Baterías KT-20V','WH-SUCURSAL-A', 2, 2,  4, 2100.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-002','Taladro Inalámbrico 20V 2 Baterías KT-20V','WH-SUCURSAL-B', 5, 0,  4, 2100.00, NOW()),

-- ════════════════ TAL-003 · Taladro De Impacto 18V ═══════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-003','Taladro De Impacto Inalámbrico 18V KT-IMPACT18','WH-MATRIZ',     4, 2,  6, 2600.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-003','Taladro De Impacto Inalámbrico 18V KT-IMPACT18','WH-SUCURSAL-A', 1, 1,  3, 2600.00, NOW()),  -- 🔴 CRÍTICO
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-003','Taladro De Impacto Inalámbrico 18V KT-IMPACT18','WH-SUCURSAL-B', 2, 0,  3, 2600.00, NOW()),  -- ⚠️ BAJO

-- ════════════════ TAL-004 · Rotomartillo SDS Plus 800W ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-004','Rotomartillo SDS Plus 800W KT-SDS800','WH-MATRIZ',    14, 3,  8, 3100.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-004','Rotomartillo SDS Plus 800W KT-SDS800','WH-SUCURSAL-A', 6, 1,  4, 3100.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','TAL-004','Rotomartillo SDS Plus 800W KT-SDS800','WH-SUCURSAL-B', 5, 0,  4, 3100.00, NOW()),

-- ════════════════ SIE-001 · Sierra Circular 7-1/4" 1600W ═════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-001','Sierra Circular 7-1/4" 1600W KT-SC1600','WH-MATRIZ',    12, 2,  6, 1380.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-001','Sierra Circular 7-1/4" 1600W KT-SC1600','WH-SUCURSAL-A', 4, 1,  3, 1380.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-001','Sierra Circular 7-1/4" 1600W KT-SC1600','WH-SUCURSAL-B', 5, 0,  3, 1380.00, NOW()),

-- ════════════════ SIE-002 · Sierra De Calar 800W ═════════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-002','Sierra De Calar 800W KT-SC800','WH-MATRIZ',    20, 4,  8, 840.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-002','Sierra De Calar 800W KT-SC800','WH-SUCURSAL-A', 6, 0,  4, 840.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-002','Sierra De Calar 800W KT-SC800','WH-SUCURSAL-B', 8, 2,  4, 840.00, NOW()),

-- ════════════════ SIE-003 · Sierra Ingletadora 10" ═══════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-003','Sierra Ingletadora 10" 1800W KT-ING10','WH-MATRIZ',    5, 2,  4, 6200.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-003','Sierra Ingletadora 10" 1800W KT-ING10','WH-SUCURSAL-A', 1, 1,  2, 6200.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-003','Sierra Ingletadora 10" 1800W KT-ING10','WH-SUCURSAL-B', 2, 0,  2, 6200.00, NOW()),

-- ════════════════ SIE-004 · Sierra De Mesa Banco 10" ═════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-004','Sierra De Mesa Banco 10" 2000W KT-SM2000','WH-MATRIZ',    3, 1,  3, 9100.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-004','Sierra De Mesa Banco 10" 2000W KT-SM2000','WH-SUCURSAL-A', 0, 0,  2, 9100.00, NOW()),  -- 🔴 SIN STOCK
('0ac40357-b96c-4a32-929e-ae810875d6b0','SIE-004','Sierra De Mesa Banco 10" 2000W KT-SM2000','WH-SUCURSAL-B', 1, 0,  2, 9100.00, NOW()),  -- 🔴 CRÍTICO

-- ════════════════ COM-001 · Compresor 24L 2HP ════════════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-001','Compresor De Aire 24L 2HP KT-COM24','WH-MATRIZ',    14, 3,  6, 2190.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-001','Compresor De Aire 24L 2HP KT-COM24','WH-SUCURSAL-A', 3, 1,  3, 2190.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-001','Compresor De Aire 24L 2HP KT-COM24','WH-SUCURSAL-B', 5, 0,  3, 2190.00, NOW()),

-- ════════════════ COM-002 · Compresor Silencioso 50L ═════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-002','Compresor Silencioso 50L Oil-Free KT-SILEN50','WH-MATRIZ',    7, 2,  4, 4250.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-002','Compresor Silencioso 50L Oil-Free KT-SILEN50','WH-SUCURSAL-A', 2, 1,  3, 4250.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-002','Compresor Silencioso 50L Oil-Free KT-SILEN50','WH-SUCURSAL-B', 3, 0,  3, 4250.00, NOW()),

-- ════════════════ COM-003 · Compresor Industrial 100L ════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-003','Compresor Industrial 100L 3HP KT-IND100','WH-MATRIZ',    5, 2,  4, 7200.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-003','Compresor Industrial 100L 3HP KT-IND100','WH-SUCURSAL-A', 1, 1,  2, 7200.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','COM-003','Compresor Industrial 100L 3HP KT-IND100','WH-SUCURSAL-B', 2, 0,  2, 7200.00, NOW()),

-- ════════════════ MAR-001 · Martillo Demoledor 1500W ═════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-001','Martillo Demoledor 1500W 45J KT-DEM1500','WH-MATRIZ',    9, 2,  5, 4500.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-001','Martillo Demoledor 1500W 45J KT-DEM1500','WH-SUCURSAL-A', 3, 1,  3, 4500.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-001','Martillo Demoledor 1500W 45J KT-DEM1500','WH-SUCURSAL-B', 4, 0,  3, 4500.00, NOW()),

-- ════════════════ MAR-002 · Martillo Combinado SDS Max ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-002','Martillo Combinado SDS Max 1300W KT-SMAX13','WH-MATRIZ',    6, 1,  4, 5700.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-002','Martillo Combinado SDS Max 1300W KT-SMAX13','WH-SUCURSAL-A', 2, 0,  2, 5700.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-002','Martillo Combinado SDS Max 1300W KT-SMAX13','WH-SUCURSAL-B', 3, 1,  2, 5700.00, NOW()),

-- ════════════════ MAR-003 · Martillo Rotativo SDS Plus ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-003','Martillo Rotativo SDS Plus 1100W KT-ROT1100','WH-MATRIZ',    16, 3,  6, 2780.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-003','Martillo Rotativo SDS Plus 1100W KT-ROT1100','WH-SUCURSAL-A',  5, 1,  3, 2780.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MAR-003','Martillo Rotativo SDS Plus 1100W KT-ROT1100','WH-SUCURSAL-B',  6, 0,  3, 2780.00, NOW()),

-- ════════════════ AMO-001 · Amoladora 4-1/2" 850W ════════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-001','Amoladora Angular 4-1/2" 850W KT-AMO850','WH-MATRIZ',    35, 8, 15, 580.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-001','Amoladora Angular 4-1/2" 850W KT-AMO850','WH-SUCURSAL-A', 12, 2,  8, 580.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-001','Amoladora Angular 4-1/2" 850W KT-AMO850','WH-SUCURSAL-B', 14, 3,  8, 580.00, NOW()),

-- ════════════════ AMO-002 · Amoladora 5" 1200W ═══════════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-002','Amoladora Angular 5" 1200W KT-AMO1200','WH-MATRIZ',    22, 4, 10, 800.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-002','Amoladora Angular 5" 1200W KT-AMO1200','WH-SUCURSAL-A',  7, 1,  5, 800.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-002','Amoladora Angular 5" 1200W KT-AMO1200','WH-SUCURSAL-B',  8, 2,  5, 800.00, NOW()),

-- ════════════════ AMO-003 · Amoladora De Banco 8" ════════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-003','Amoladora De Banco 8" 600W KT-BANCO8','WH-MATRIZ',    10, 2,  5, 1600.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-003','Amoladora De Banco 8" 600W KT-BANCO8','WH-SUCURSAL-A',  3, 1,  3, 1600.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-003','Amoladora De Banco 8" 600W KT-BANCO8','WH-SUCURSAL-B',  4, 0,  3, 1600.00, NOW()),

-- ════════════════ AMO-004 · Esmeriladora Recta 500W ══════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-004','Esmeriladora Recta 500W KT-ESM500','WH-MATRIZ',    3, 1,  4, 1060.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-004','Esmeriladora Recta 500W KT-ESM500','WH-SUCURSAL-A', 0, 0,  2, 1060.00, NOW()),  -- 🔴 SIN STOCK
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMO-004','Esmeriladora Recta 500W KT-ESM500','WH-SUCURSAL-B', 1, 0,  2, 1060.00, NOW()),  -- 🔴 CRÍTICO

-- ════════════════ MUL-001 · Herramienta Oscilante 300W ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-001','Herramienta Oscilante Multifunción 300W KT-MULTI','WH-MATRIZ',    13, 3,  6, 1240.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-001','Herramienta Oscilante Multifunción 300W KT-MULTI','WH-SUCURSAL-A',  4, 1,  3, 1240.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-001','Herramienta Oscilante Multifunción 300W KT-MULTI','WH-SUCURSAL-B',  5, 0,  3, 1240.00, NOW()),

-- ════════════════ MUL-002 · Lijadora Orbital 5" 310W ═════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-002','Lijadora Orbital Aleatoria 5" 310W KT-LIJORB','WH-MATRIZ',    28, 5, 10, 715.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-002','Lijadora Orbital Aleatoria 5" 310W KT-LIJORB','WH-SUCURSAL-A',  8, 2,  5, 715.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','MUL-002','Lijadora Orbital Aleatoria 5" 310W KT-LIJORB','WH-SUCURSAL-B', 10, 1,  5, 715.00, NOW()),

-- ════════════════ AMZ-NIVEL-01 · Nivel Láser 3 Líneas ════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-NIVEL-01','Nivel Láser Autonivelante 3 Líneas KT-LASER3L','WH-MATRIZ',    14, 2,  6, 1820.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-NIVEL-01','Nivel Láser Autonivelante 3 Líneas KT-LASER3L','WH-SUCURSAL-A',  3, 1,  3, 1820.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-NIVEL-01','Nivel Láser Autonivelante 3 Líneas KT-LASER3L','WH-SUCURSAL-B',  4, 0,  3, 1820.00, NOW()),

-- ════════════════ AMZ-SOLD-01 · Soldadora Inversora 160A ══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-SOLD-01','Soldadora Inversora MMA 160A KT-WELD160','WH-MATRIZ',    8, 2,  4, 3540.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-SOLD-01','Soldadora Inversora MMA 160A KT-WELD160','WH-SUCURSAL-A', 2, 1,  2, 3540.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-SOLD-01','Soldadora Inversora MMA 160A KT-WELD160','WH-SUCURSAL-B', 3, 0,  2, 3540.00, NOW()),

-- ════════════════ AMZ-HIDRO-01 · Hidrolavadora 150 Bar ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-HIDRO-01','Hidrolavadora Eléctrica 1800W 150 Bar KT-WASH150','WH-MATRIZ',    17, 3,  6, 2400.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-HIDRO-01','Hidrolavadora Eléctrica 1800W 150 Bar KT-WASH150','WH-SUCURSAL-A',  5, 1,  3, 2400.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-HIDRO-01','Hidrolavadora Eléctrica 1800W 150 Bar KT-WASH150','WH-SUCURSAL-B',  7, 2,  3, 2400.00, NOW()),

-- ════════════════ AMZ-TERMO-01 · Cámara Termográfica ═════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-TERMO-01','Cámara Termográfica 256x192 KT-THERM256','WH-MATRIZ',    3, 1,  3, 5760.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-TERMO-01','Cámara Termográfica 256x192 KT-THERM256','WH-SUCURSAL-A', 1, 0,  2, 5760.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','AMZ-TERMO-01','Cámara Termográfica 256x192 KT-THERM256','WH-SUCURSAL-B', 0, 0,  2, 5760.00, NOW()),  -- 🔴 SIN STOCK

-- ════════════════ SHP-HEAT-01 · Pistola de Calor 2000W ═══════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-HEAT-01','Pistola de Calor Industrial 2000W KT-HEAT2000','WH-MATRIZ',    16, 2,  6, 910.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-HEAT-01','Pistola de Calor Industrial 2000W KT-HEAT2000','WH-SUCURSAL-A',  5, 0,  3, 910.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-HEAT-01','Pistola de Calor Industrial 2000W KT-HEAT2000','WH-SUCURSAL-B',  6, 1,  3, 910.00, NOW()),

-- ════════════════ SHP-BRAD-01 · Clavadora Neumática Brad ═════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BRAD-01','Clavadora Neumática Brad Nailer 18GA KT-BRAD18','WH-MATRIZ',    10, 2,  5, 1380.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BRAD-01','Clavadora Neumática Brad Nailer 18GA KT-BRAD18','WH-SUCURSAL-A',  2, 1,  3, 1380.00, NOW()),  -- ⚠️ BAJO
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BRAD-01','Clavadora Neumática Brad Nailer 18GA KT-BRAD18','WH-SUCURSAL-B',  4, 0,  3, 1380.00, NOW()),

-- ════════════════ SHP-BANCO-120 · Banco Trabajo 120cm ════════════
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BANCO-120','Banco de Trabajo Plegable 120cm 300kg','WH-MATRIZ',    9, 1,  4, 2550.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BANCO-120','Banco de Trabajo Plegable 120cm 300kg','WH-SUCURSAL-A', 3, 0,  2, 2550.00, NOW()),
('0ac40357-b96c-4a32-929e-ae810875d6b0','SHP-BANCO-120','Banco de Trabajo Plegable 120cm 300kg','WH-SUCURSAL-B', 4, 1,  2, 2550.00, NOW());

COMMIT;

-- ============================================================
-- VERIFICACIÓN: ALERTAS DE STOCK BAJO
-- ============================================================
-- Filas donde quantity_available <= reorder_point:
--
-- SELECT
--   sku,
--   warehouse_id,
--   quantity_available  AS disponible,
--   quantity_reserved   AS reservado,
--   reorder_point       AS punto_reorden,
--   CASE
--     WHEN quantity_available = 0            THEN '🔴 SIN STOCK'
--     WHEN quantity_available <= reorder_point THEN '⚠️ BAJO'
--     ELSE '✅ OK'
--   END AS alerta
-- FROM erp_inventory
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
--   AND quantity_available <= reorder_point
-- ORDER BY quantity_available ASC, sku;
--
-- Resumen por almacén:
--
-- SELECT
--   warehouse_id,
--   COUNT(*)                            AS total_skus,
--   SUM(quantity_available)             AS unidades_disponibles,
--   SUM(quantity_available * cost_per_unit) AS valor_inventario
-- FROM erp_inventory
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- GROUP BY warehouse_id;
-- ============================================================
