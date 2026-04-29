-- ============================================================
-- SEED: Órdenes Mercado Libre - Kap Tools Demo
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Descripción: 15 órdenes demo con status variados para demo.
--   - 5  pending        (urgente surtir)
--   - 4  ready_to_ship  (urgente enviar)
--   - 3  shipped        (en tránsito)
--   - 2  delivered      (completas)
--   - 1  cancelled      (cancelada)
-- Referencia SKUs de seed_ml_products.sql
-- ============================================================

BEGIN;

INSERT INTO ml_orders (
  tenant_id,
  ml_order_id,
  buyer_nickname,
  buyer_email,
  total_amount,
  status,
  shipping_method,
  items_json,
  created_at
) VALUES

-- ════════════════════════════════════════════════════════════
-- PENDING (5) — Urgente: requieren surtido/confirmación
-- ════════════════════════════════════════════════════════════

-- Orden 1 · Taladro percutor x2 · $2,598
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084751320',
  'ROBERTO_HDEZ_MX',
  'roberto.hdez.mx@gmail.com',
  2598.00,
  'pending',
  'mercadoenvios',
  '[{"sku":"TAL-001","title":"Taladro Percutor 13mm 650W Kap Tools KT-650P","qty":2,"unit_price":1299.00}]',
  NOW() - INTERVAL '2 days'
),

-- Orden 2 · Amoladora 4-1/2" x1 + Lijadora orbital x1 · $1,779
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084839201',
  'FERRETERIA_SAN_JOSE',
  'compras@ferreteriastjose.com.mx',
  1779.00,
  'pending',
  'mercadoenvios',
  '[{"sku":"AMO-001","title":"Amoladora Angular 4-1/2\" 850W KT-AMO850","qty":1,"unit_price":799.00},{"sku":"MUL-002","title":"Lijadora Orbital Aleatoria 5\" 310W KT-LIJORB","qty":1,"unit_price":980.00}]',
  NOW() - INTERVAL '1 day 18 hours'
),

-- Orden 3 · Sierra de calar x1 · $1,150
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084901574',
  'MARIO_CONSTRUCCIONES',
  'mario.const2024@hotmail.com',
  1150.00,
  'pending',
  'mercadoenvios',
  '[{"sku":"SIE-002","title":"Sierra De Calar 800W Velocidad Variable KT-SC800","qty":1,"unit_price":1150.00}]',
  NOW() - INTERVAL '1 day 4 hours'
),

-- Orden 4 · Compresor 24L x1 · $2,999
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084966830',
  'TALLER_VELAZQUEZ_QRO',
  'tallervlzqz@outlook.com',
  2999.00,
  'pending',
  'mercadoenvios',
  '[{"sku":"COM-001","title":"Compresor De Aire 24L 2HP 8 Bar KT-COM24","qty":1,"unit_price":2999.00}]',
  NOW() - INTERVAL '22 hours'
),

-- Orden 5 · Rotomartillo SDS x1 + Amoladora 5" x1 · $5,298
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2085012390',
  'CONSTRUCTORA_OLMECA',
  'adquisiciones@olmecagroup.mx',
  5298.00,
  'pending',
  'mercadoenvios',
  '[{"sku":"TAL-004","title":"Rotomartillo SDS Plus 800W KT-SDS800","qty":1,"unit_price":4199.00},{"sku":"AMO-001","title":"Amoladora Angular 4-1/2\" 850W KT-AMO850","qty":1,"unit_price":799.00},{"sku":"MUL-002","title":"Lijadora Orbital Aleatoria 5\" 310W KT-LIJORB","qty":1,"unit_price":300.00}]',
  NOW() - INTERVAL '8 hours'
),

-- ════════════════════════════════════════════════════════════
-- READY_TO_SHIP (4) — Urgente: paquete listo, falta envío
-- ════════════════════════════════════════════════════════════

-- Orden 6 · Taladro inalámbrico 20V x1 · $2,850
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084623117',
  'JUAN_PABLO_REYES',
  'jp.reyes.obras@gmail.com',
  2850.00,
  'ready_to_ship',
  'mercadoenvios',
  '[{"sku":"TAL-002","title":"Taladro Inalámbrico 20V 2 Baterías KT-20V","qty":1,"unit_price":2850.00}]',
  NOW() - INTERVAL '4 days'
),

-- Orden 7 · Sierra circular x1 · $1,899
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084688455',
  'CARPINTERIA_LUNA_CDM',
  'ventas@carpinterialuna.mx',
  1899.00,
  'ready_to_ship',
  'mercadoenvios',
  '[{"sku":"SIE-001","title":"Sierra Circular 7-1/4\" 1600W KT-SC1600","qty":1,"unit_price":1899.00}]',
  NOW() - INTERVAL '3 days 12 hours'
),

-- Orden 8 · Amoladora de banco x1 + Esmeriladora recta x1 · $3,650
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084710882',
  'METALMECANICA_PUEBLA',
  'compras@metalmecpuebla.com',
  3650.00,
  'ready_to_ship',
  'mercadoenvios',
  '[{"sku":"AMO-003","title":"Amoladora De Banco 8\" 600W KT-BANCO8","qty":1,"unit_price":2200.00},{"sku":"AMO-004","title":"Esmeriladora Recta 500W KT-ESM500","qty":1,"unit_price":1450.00}]',
  NOW() - INTERVAL '3 days'
),

-- Orden 9 · Martillo rotativo SDS Plus x1 · $3,799
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084738294',
  'GERARDO_MONTOYA_GDL',
  'gerardo.montoya.gdl@proton.me',
  3799.00,
  'ready_to_ship',
  'mercadoenvios',
  '[{"sku":"MAR-003","title":"Martillo Rotativo SDS Plus 1100W KT-ROT1100","qty":1,"unit_price":3799.00}]',
  NOW() - INTERVAL '2 days 6 hours'
),

-- ════════════════════════════════════════════════════════════
-- SHIPPED (3) — En tránsito con Mercado Envíos
-- ════════════════════════════════════════════════════════════

-- Orden 10 · Compresor silencioso 50L x1 · $5,800
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084412760',
  'AUTO_PINTURA_NAYARIT',
  'taller.pintura.nay@gmail.com',
  5800.00,
  'shipped',
  'mercadoenvios',
  '[{"sku":"COM-002","title":"Compresor Silencioso 50L 2HP Oil-Free KT-SILEN50","qty":1,"unit_price":5800.00}]',
  NOW() - INTERVAL '8 days'
),

-- Orden 11 · Taladro de impacto 18V x2 · $6,998
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084489033',
  'CONSTRUCTORA_SOL_MTY',
  'logistica@constructorasol.mx',
  6998.00,
  'shipped',
  'mercadoenvios',
  '[{"sku":"TAL-003","title":"Taladro De Impacto Inalámbrico 18V KT-IMPACT18","qty":2,"unit_price":3499.00}]',
  NOW() - INTERVAL '6 days'
),

-- Orden 12 · Herramienta oscilante x1 + Amoladora 5" x1 · $2,799
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084556190',
  'BRICOLAJE_FLORES_AGS',
  'bricoflores@yahoo.com.mx',
  2799.00,
  'shipped',
  'mercadoenvios',
  '[{"sku":"MUL-001","title":"Herramienta Oscilante Multifunción 300W KT-MULTI","qty":1,"unit_price":1699.00},{"sku":"AMO-002","title":"Amoladora Angular 5\" 1200W KT-AMO1200","qty":1,"unit_price":1099.00},{"sku":"MUL-002","title":"Lijadora Orbital Aleatoria 5\" 310W KT-LIJORB","qty":1,"unit_price":1.00}]',
  NOW() - INTERVAL '5 days'
),

-- ════════════════════════════════════════════════════════════
-- DELIVERED (2) — Entregadas y completadas
-- ════════════════════════════════════════════════════════════

-- Orden 13 · Sierra ingletadora 10" x1 · $8,500
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084198774',
  'MADERAS_Y_MAS_TOLUCA',
  'pedidos@maderasmas.com.mx',
  8500.00,
  'delivered',
  'mercadoenvios',
  '[{"sku":"SIE-003","title":"Sierra Ingletadora 10\" 1800W KT-ING10","qty":1,"unit_price":8500.00}]',
  NOW() - INTERVAL '18 days'
),

-- Orden 14 · Martillo demoledor x1 + Amoladora 4-1/2" x2 · $7,798
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084271503',
  'REMODELACIONES_VARGAS',
  'a.vargas.remodelaciones@gmail.com',
  7798.00,
  'delivered',
  'mercadoenvios',
  '[{"sku":"MAR-001","title":"Martillo Demoledor 1500W 45J KT-DEM1500","qty":1,"unit_price":6200.00},{"sku":"AMO-001","title":"Amoladora Angular 4-1/2\" 850W KT-AMO850","qty":2,"unit_price":799.00}]',
  NOW() - INTERVAL '14 days'
),

-- ════════════════════════════════════════════════════════════
-- CANCELLED (1) — Cancelada por el comprador
-- ════════════════════════════════════════════════════════════

-- Orden 15 · Sierra de mesa 10" x1 · $12,500 — Cancelada
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  '2084345912',
  'INDUSTRIAS_BELTRAN_SA',
  'compras@industriasbeltran.com.mx',
  12500.00,
  'cancelled',
  'mercadoenvios',
  '[{"sku":"SIE-004","title":"Sierra De Mesa Banco 10\" 2000W KT-SM2000","qty":1,"unit_price":12500.00}]',
  NOW() - INTERVAL '22 days'
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-INSERT
-- ============================================================
-- Ejecuta para confirmar las 15 órdenes con distribución correcta:
--
-- SELECT
--   status,
--   COUNT(*) AS total,
--   SUM(total_amount) AS monto_total
-- FROM ml_orders
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- GROUP BY status
-- ORDER BY status;
--
-- Resultado esperado:
--   cancelled      | 1 |  12,500.00
--   delivered      | 2 |  16,298.00
--   pending        | 5 |  13,824.00
--   ready_to_ship  | 4 |  12,198.00
--   shipped        | 3 |  15,597.00
-- ============================================================
