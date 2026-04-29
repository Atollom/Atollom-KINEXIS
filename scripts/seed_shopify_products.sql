-- ============================================================
-- SEED: Productos Shopify - Kap Tools Demo (B2B)
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Descripción: 12 productos en tienda Shopify B2B mayoreo.
--   - Precios de lista mayoreo (paquetes y volumen)
--   - Variants por voltaje, potencia, paquete, color
--   - Handles SEO-friendly en español
--   - Mix de productos compartidos ML/Amazon y exclusivos B2B
-- ============================================================

BEGIN;

INSERT INTO shopify_products (
  tenant_id,
  shopify_product_id,
  handle,
  title,
  vendor,
  product_type,
  tags,
  status,
  variants_json,
  inventory_quantity,
  created_at
) VALUES

-- ════════════════════════════════════════════════════════════
-- TALADROS (3)
-- ════════════════════════════════════════════════════════════

-- 1 · Taladro Percutor 13mm — compartido ML/AMZ (TAL-001)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560001',
  'taladro-percutor-13mm-650w-kap-tools',
  'Taladro Percutor 13mm 650W Kap Tools – Mayoreo',
  'Kap Tools',
  'Herramientas Eléctricas',
  'taladro,percutor,650w,mayoreo,construccion',
  'active',
  '[
    {"variant_id":"V-TAL001-U1","sku":"TAL-001","title":"Pieza individual","price":1400.00,"compare_at_price":1299.00,"inventory_quantity":12},
    {"variant_id":"V-TAL001-C6","sku":"TAL-001-C6","title":"Caja 6 piezas","price":7500.00,"compare_at_price":7794.00,"inventory_quantity":4},
    {"variant_id":"V-TAL001-C12","sku":"TAL-001-C12","title":"Caja 12 piezas","price":13800.00,"compare_at_price":15588.00,"inventory_quantity":2}
  ]',
  18,
  NOW() - INTERVAL '90 days'
),

-- 2 · Taladro Inalámbrico 20V — compartido ML/AMZ (TAL-002)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560002',
  'taladro-inalambrico-20v-2-baterias-kap-tools',
  'Taladro Atornillador Inalámbrico 20V Kit Completo – Mayoreo',
  'Kap Tools',
  'Herramientas Eléctricas',
  'taladro,inalambrico,20v,bateria,litio,mayoreo',
  'active',
  '[
    {"variant_id":"V-TAL002-U1","sku":"TAL-002","title":"Kit individual (2 baterías)","price":3100.00,"compare_at_price":2850.00,"inventory_quantity":7},
    {"variant_id":"V-TAL002-C4","sku":"TAL-002-C4","title":"Caja 4 kits","price":11600.00,"compare_at_price":12400.00,"inventory_quantity":2}
  ]',
  9,
  NOW() - INTERVAL '85 days'
),

-- 3 · Rotomartillo SDS Plus — compartido ML/AMZ (TAL-004)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560003',
  'rotomartillo-sds-plus-800w-kap-tools',
  'Rotomartillo SDS Plus 800W 3 Funciones Kap Tools – Mayoreo',
  'Kap Tools',
  'Herramientas Eléctricas',
  'rotomartillo,sds,percutor,concreto,mayoreo',
  'active',
  '[
    {"variant_id":"V-TAL004-U1","sku":"TAL-004","title":"Pieza individual","price":4500.00,"compare_at_price":4199.00,"inventory_quantity":10},
    {"variant_id":"V-TAL004-C4","sku":"TAL-004-C4","title":"Caja 4 piezas","price":16800.00,"compare_at_price":18000.00,"inventory_quantity":3}
  ]',
  13,
  NOW() - INTERVAL '80 days'
),

-- ════════════════════════════════════════════════════════════
-- SIERRAS (2)
-- ════════════════════════════════════════════════════════════

-- 4 · Sierra Circular 7-1/4" — compartida ML/AMZ (SIE-001)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560004',
  'sierra-circular-7-1-4-1600w-kap-tools',
  'Sierra Circular 7-1/4" 1600W Guía Láser Kap Tools – Mayoreo',
  'Kap Tools',
  'Herramientas de Corte',
  'sierra,circular,1600w,madera,laser,mayoreo',
  'active',
  '[
    {"variant_id":"V-SIE001-U1","sku":"SIE-001","title":"Pieza individual","price":2050.00,"compare_at_price":1899.00,"inventory_quantity":8},
    {"variant_id":"V-SIE001-C4","sku":"SIE-001-C4","title":"Caja 4 piezas","price":7600.00,"compare_at_price":8200.00,"inventory_quantity":2}
  ]',
  10,
  NOW() - INTERVAL '75 days'
),

-- 5 · Sierra Ingletadora 10" — compartida ML (SIE-003) — exclusiva B2B en AMZ
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560005',
  'sierra-ingletadora-10-pulgadas-doble-bisel',
  'Sierra Ingletadora 10" Doble Bisel 1800W Kap Tools – Profesional B2B',
  'Kap Tools',
  'Herramientas de Corte',
  'sierra,ingletadora,10pulgadas,doble-bisel,carpinteria,b2b',
  'active',
  '[
    {"variant_id":"V-SIE003-U1","sku":"SIE-003","title":"Unidad con base","price":9200.00,"compare_at_price":8500.00,"inventory_quantity":4},
    {"variant_id":"V-SIE003-STAND","sku":"SIE-003-ST","title":"Unidad + Stand de piso","price":12500.00,"compare_at_price":null,"inventory_quantity":1}
  ]',
  5,
  NOW() - INTERVAL '70 days'
),

-- ════════════════════════════════════════════════════════════
-- AMOLADORAS (2)
-- ════════════════════════════════════════════════════════════

-- 6 · Amoladora Angular — Pack surtido 4-1/2" y 5" (AMO-001 + AMO-002)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560006',
  'amoladora-angular-kap-tools-4-5-pulgadas',
  'Amoladora Angular Kap Tools – Selección Mayoreo',
  'Kap Tools',
  'Herramientas Eléctricas',
  'amoladora,angular,850w,1200w,mayoreo,construccion',
  'active',
  '[
    {"variant_id":"V-AMO001-U1","sku":"AMO-001","title":"4-1/2\" 850W – Pieza","price":870.00,"compare_at_price":799.00,"inventory_quantity":22},
    {"variant_id":"V-AMO001-C10","sku":"AMO-001-C10","title":"4-1/2\" 850W – Caja 10 pzas","price":7900.00,"compare_at_price":8700.00,"inventory_quantity":4},
    {"variant_id":"V-AMO002-U1","sku":"AMO-002","title":"5\" 1200W – Pieza","price":1200.00,"compare_at_price":1099.00,"inventory_quantity":16},
    {"variant_id":"V-AMO002-C6","sku":"AMO-002-C6","title":"5\" 1200W – Caja 6 pzas","price":6600.00,"compare_at_price":7200.00,"inventory_quantity":3}
  ]',
  45,
  NOW() - INTERVAL '65 days'
),

-- 7 · Amoladora de Banco 8" — compartida ML (AMO-003)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560007',
  'amoladora-banco-8-pulgadas-doble-piedra',
  'Amoladora de Banco 8" Doble Piedra 600W Kap Tools – Taller',
  'Kap Tools',
  'Herramientas de Banco',
  'amoladora,banco,8pulgadas,esmeril,taller,b2b',
  'active',
  '[
    {"variant_id":"V-AMO003-U1","sku":"AMO-003","title":"Unidad estándar","price":2400.00,"compare_at_price":2200.00,"inventory_quantity":7},
    {"variant_id":"V-AMO003-PROTO","sku":"AMO-003-PRO","title":"Unidad + Soporte flexible + Luz extra","price":3200.00,"compare_at_price":null,"inventory_quantity":2}
  ]',
  9,
  NOW() - INTERVAL '60 days'
),

-- ════════════════════════════════════════════════════════════
-- COMPRESORES (1)
-- ════════════════════════════════════════════════════════════

-- 8 · Compresor Silencioso 50L — compartido ML/AMZ (COM-002)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560008',
  'compresor-silencioso-50l-oil-free-kap-tools',
  'Compresor Silencioso 50L Oil-Free 2HP Kap Tools – Pintores y Talleres',
  'Kap Tools',
  'Compresores y Neumáticos',
  'compresor,silencioso,oil-free,50l,pintura,mayoreo',
  'active',
  '[
    {"variant_id":"V-COM002-U1","sku":"COM-002","title":"Unidad individual","price":6200.00,"compare_at_price":5800.00,"inventory_quantity":5},
    {"variant_id":"V-COM002-KIT","sku":"COM-002-KIT","title":"Kit compresor + pistola pintura + manguera 10m","price":8500.00,"compare_at_price":null,"inventory_quantity":2}
  ]',
  7,
  NOW() - INTERVAL '55 days'
),

-- ════════════════════════════════════════════════════════════
-- EXCLUSIVOS SHOPIFY B2B (4) — sin presencia en ML ni Amazon
-- ════════════════════════════════════════════════════════════

-- 9 · Kit Ferretería Construcción (bundle exclusivo B2B)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560009',
  'kit-construccion-profesional-kap-tools-5-piezas',
  'Kit Construcción Profesional Kap Tools 5 en 1 – Exclusivo Mayoreo',
  'Kap Tools',
  'Kits y Paquetes',
  'kit,paquete,construccion,5en1,mayoreo,exclusivo-shopify',
  'active',
  '[
    {"variant_id":"V-KIT-CONS-A","sku":"KIT-CONS-A","title":"Kit A: Taladro + Circular + Amoladora + Maletín","price":4999.00,"compare_at_price":5847.00,"inventory_quantity":6},
    {"variant_id":"V-KIT-CONS-B","sku":"KIT-CONS-B","title":"Kit B: Taladro + Rotomartillo + 2 Amoladoras + Maletín Pro","price":8200.00,"compare_at_price":9496.00,"inventory_quantity":3}
  ]',
  9,
  NOW() - INTERVAL '45 days'
),

-- 10 · Pistola de Calor Industrial 2000W (exclusivo Shopify B2B)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560010',
  'pistola-calor-industrial-2000w-kap-tools',
  'Pistola de Calor Industrial 2000W Kap Tools – Temperatura Variable',
  'Kap Tools',
  'Herramientas Eléctricas',
  'pistola,calor,heat-gun,2000w,encogido,piso,b2b',
  'active',
  '[
    {"variant_id":"V-HEAT-U1","sku":"SHP-HEAT-01","title":"Unidad individual","price":1250.00,"compare_at_price":null,"inventory_quantity":14},
    {"variant_id":"V-HEAT-C5","sku":"SHP-HEAT-01-C5","title":"Caja 5 piezas","price":5750.00,"compare_at_price":6250.00,"inventory_quantity":4}
  ]',
  18,
  NOW() - INTERVAL '40 days'
),

-- 11 · Ensambladora Neumática Brad Nailer 18GA (exclusivo Shopify B2B)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560011',
  'clavadora-neumatica-brad-nailer-18ga-kap-tools',
  'Clavadora Neumática Brad Nailer 18GA Kap Tools – Carpintería Fina',
  'Kap Tools',
  'Herramientas Neumáticas',
  'clavadora,neumatica,brad-nailer,18ga,carpinteria,b2b,mayoreo',
  'active',
  '[
    {"variant_id":"V-BRAD-U1","sku":"SHP-BRAD-01","title":"Unidad individual","price":1890.00,"compare_at_price":null,"inventory_quantity":9},
    {"variant_id":"V-BRAD-KIT","sku":"SHP-BRAD-KIT","title":"Kit: Clavadora + compas + 3 cajas clavos","price":2750.00,"compare_at_price":null,"inventory_quantity":5}
  ]',
  14,
  NOW() - INTERVAL '35 days'
),

-- 12 · Banco de Trabajo Plegable 300kg (exclusivo Shopify B2B)
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '7891034560012',
  'banco-trabajo-plegable-300kg-kap-tools',
  'Banco de Trabajo Plegable Kap Tools 300kg – Acero Laminado',
  'Kap Tools',
  'Mobiliario de Taller',
  'banco,trabajo,plegable,taller,acero,b2b,mayoreo',
  'active',
  '[
    {"variant_id":"V-BANCO-120","sku":"SHP-BANCO-120","title":"120 cm – Individual","price":3500.00,"compare_at_price":null,"inventory_quantity":8},
    {"variant_id":"V-BANCO-150","sku":"SHP-BANCO-150","title":"150 cm – Individual","price":4200.00,"compare_at_price":null,"inventory_quantity":5},
    {"variant_id":"V-BANCO-120-C2","sku":"SHP-BANCO-120-C2","title":"120 cm – Pack 2 unidades","price":6500.00,"compare_at_price":7000.00,"inventory_quantity":3}
  ]',
  16,
  NOW() - INTERVAL '28 days'
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-INSERT
-- ============================================================
-- 1. Conteo y stock por tipo de producto:
--
-- SELECT
--   product_type,
--   COUNT(*)                  AS productos,
--   SUM(inventory_quantity)   AS stock_total
-- FROM shopify_products
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- GROUP BY product_type
-- ORDER BY stock_total DESC;
--
-- 2. Productos con variantes multi-precio (útil para demo B2B):
--
-- SELECT
--   handle,
--   title,
--   jsonb_array_length(variants_json::jsonb) AS num_variants,
--   inventory_quantity
-- FROM shopify_products
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- ORDER BY num_variants DESC;
--
-- Deberías ver 12 filas; AMO y BANCO con 4 y 3 variantes resp.
-- ============================================================
