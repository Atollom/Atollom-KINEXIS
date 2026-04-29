-- ============================================================
-- SEED: Productos Mercado Libre - Kap Tools Demo
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Descripción: 20 productos demo de herramientas eléctricas y de
--              construcción publicados en Mercado Libre (MX).
-- ============================================================

-- NOTA: Ajusta el nombre de la tabla/columnas si difieren del schema.
-- Asegúrate de que la tabla ml_products exista antes de ejecutar.

BEGIN;

INSERT INTO ml_products (
  tenant_id,
  sku,
  title,
  price,
  available_quantity,
  condition,
  category_id,
  listing_type_id,
  status,
  description,
  created_at
) VALUES

-- ── TALADROS ──────────────────────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'TAL-001',
  'Taladro Percutor 13mm 650W Kap Tools KT-650P',
  1299.00,
  15,
  'new',
  'MLA1499',
  'gold_special',
  'active',
  'Taladro percutor profesional 650W con mandril de 13mm, velocidad variable y reversa. Ideal para concreto, madera y metal. Incluye maletín.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'TAL-002',
  'Taladro Inalámbrico 20V 2 Baterías KT-20V',
  2850.00,
  8,
  'new',
  'MLA1499',
  'gold_pro',
  'active',
  'Taladro atornillador inalámbrico 20V con 2 baterías de litio 2Ah, cargador rápido, maletín y 16 puntas incluidas.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'TAL-003',
  'Taladro De Impacto Inalámbrico 18V KT-IMPACT18',
  3499.00,
  3,
  'new',
  'MLA1499',
  'gold_special',
  'active',
  'Taladro de impacto 18V con 210 Nm de torque, 3 velocidades y luz LED integrada. Bajo en stock.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'TAL-004',
  'Rotomartillo SDS Plus 800W KT-SDS800',
  4199.00,
  22,
  'new',
  'MLA1499',
  'gold_pro',
  'active',
  'Rotomartillo SDS Plus 800W, 3 funciones (perforación, percusión y cincelado), energía de impacto 3.2J, incluye set de brocas.',
  NOW()
),

-- ── SIERRAS ───────────────────────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'SIE-001',
  'Sierra Circular 7-1/4" 1600W KT-SC1600',
  1899.00,
  12,
  'new',
  'MLA430276',
  'gold_special',
  'active',
  'Sierra circular 1600W con disco de 7-1/4", guía láser, bisel ajustable 0-45°, tabla de corte de aluminio. Incluye disco carburo.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'SIE-002',
  'Sierra De Calar 800W Velocidad Variable KT-SC800',
  1150.00,
  18,
  'new',
  'MLA430276',
  'gold_special',
  'active',
  'Sierra de calar 800W, velocidad variable 0-3000 spm, movimiento pendular 4 posiciones, base de aluminio. Corta madera, metal y cerámica.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'SIE-003',
  'Sierra Ingletadora 10" 1800W KT-ING10',
  8500.00,
  4,
  'new',
  'MLA430276',
  'gold_pro',
  'active',
  'Sierra ingletadora 10" 1800W, doble bisel, corte de inglete 45°-45°, giro 60°, mesa extensible. Precisa para molduras y marcos.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'SIE-004',
  'Sierra De Mesa Banco 10" 2000W KT-SM2000',
  12500.00,
  2,
  'new',
  'MLA430276',
  'gold_pro',
  'active',
  'Sierra de banco 10" 2000W con guía paralela y de inglete, altura de corte 90mm, inclinación 45°. Ideal para carpintería profesional.',
  NOW()
),

-- ── COMPRESORES ───────────────────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'COM-001',
  'Compresor De Aire 24L 2HP 8 Bar KT-COM24',
  2999.00,
  10,
  'new',
  'MLA432010',
  'gold_special',
  'active',
  'Compresor de pistón 24L, motor 2HP 8 bar, arranque fácil en frío, válvula de seguridad, manómetros duales. Ideal para taller doméstico.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'COM-002',
  'Compresor Silencioso 50L 2HP Oil-Free KT-SILEN50',
  5800.00,
  6,
  'new',
  'MLA432010',
  'gold_pro',
  'active',
  'Compresor silencioso libre de aceite 50L 2HP, nivel de ruido 56 dB, máx. 8 bar, ideal para aerógrafo, pistola de pintura y herramientas neumáticas.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'COM-003',
  'Compresor Industrial 100L 3HP 10 Bar KT-IND100',
  9900.00,
  3,
  'new',
  'MLA432010',
  'gold_pro',
  'active',
  'Compresor industrial 100L 3HP 10 bar, motor de inducción, válvulas de bronce, tubería de cobre interna. Para uso industrial continuo.',
  NOW()
),

-- ── MARTILLOS / DEMOLEDORES ───────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'MAR-001',
  'Martillo Demoledor 1500W 45J KT-DEM1500',
  6200.00,
  7,
  'new',
  'MLA422460',
  'gold_pro',
  'active',
  'Martillo demoledor eléctrico 1500W, energía de impacto 45J, 1500 rpm, empuñadura antivibración, incluye cincel plano y puntero.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'MAR-002',
  'Martillo Combinado SDS Max 1300W KT-SMAX13',
  7800.00,
  5,
  'new',
  'MLA422460',
  'gold_pro',
  'active',
  'Martillo combinado SDS Max 1300W, 3 funciones, energía 8J, perforación hasta 38mm en concreto. Control de velocidad electrónico.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'MAR-003',
  'Martillo Rotativo SDS Plus 1100W KT-ROT1100',
  3799.00,
  14,
  'new',
  'MLA422460',
  'gold_special',
  'active',
  'Martillo rotativo SDS Plus 1100W, 4J de energía, perforación Ø32mm en concreto, 3 modos de trabajo, clutch de seguridad.',
  NOW()
),

-- ── AMOLADORAS ────────────────────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'AMO-001',
  'Amoladora Angular 4-1/2" 850W KT-AMO850',
  799.00,
  30,
  'new',
  'MLA422460',
  'gold_special',
  'active',
  'Amoladora angular 4-1/2" 850W, 11000 rpm, disco de desbaste incluido, protector ajustable, switch de bloqueo.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'AMO-002',
  'Amoladora Angular 5" 1200W KT-AMO1200',
  1099.00,
  20,
  'new',
  'MLA422460',
  'gold_special',
  'active',
  'Amoladora angular 5" 1200W, 9000 rpm, freno electrónico de disco, reinicio suave, cubierta de seguridad metálica.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'AMO-003',
  'Amoladora De Banco 8" 600W KT-BANCO8',
  2200.00,
  9,
  'new',
  'MLA422460',
  'gold_pro',
  'active',
  'Amoladora de banco doble 8" 600W, dos piedras (gruesa y fina), luz de trabajo LED, soporte de herramienta ajustable, protectores de ojo incluidos.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'AMO-004',
  'Esmeriladora Recta 500W KT-ESM500',
  1450.00,
  1,
  'new',
  'MLA422460',
  'gold_special',
  'active',
  'Esmeriladora recta (die grinder) 500W, 30000 rpm, cuello delgado de 43mm, ideal para trabajo en espacios reducidos. ¡Últimas unidades!',
  NOW()
),

-- ── MULTITOOL / ACCESORIOS ────────────────────────────────────────────
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'MUL-001',
  'Herramienta Oscilante Multifunción 300W KT-MULTI',
  1699.00,
  11,
  'new',
  'MLA432010',
  'gold_special',
  'active',
  'Herramienta oscilante 300W, velocidad variable 10000-21000 opm, compatible con accesorios universal OIS. Set 32 accesorios incluido.',
  NOW()
),
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'MUL-002',
  'Lijadora Orbital Aleatoria 5" 310W KT-LIJORB',
  980.00,
  25,
  'new',
  'MLA432010',
  'gold_special',
  'active',
  'Lijadora orbital aleatoria 5" 310W, 12000 rpm, bolsa de polvo incluida, base de goma esponjosa, compatible con discos velcro estándar.',
  NOW()
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-INSERT
-- ============================================================
-- Ejecuta esta consulta para confirmar la inserción:
--
-- SELECT
--   sku,
--   title,
--   price,
--   available_quantity,
--   category_id,
--   status
-- FROM ml_products
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- ORDER BY sku;
--
-- Deberías ver 20 filas.
-- ============================================================
