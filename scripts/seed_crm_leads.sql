-- ============================================================
-- SEED: CRM Leads + Pipeline - Kap Tools Demo
-- Tenant ID : 0ac40357-b96c-4a32-929e-ae810875d6b0
-- Generado  : 2026-04-27
-- Descripción: 20 leads distribuidos en pipeline de ventas B2B.
--   - 6  nuevo        (recién llegados)
--   - 5  calificado   (interesados activos)
--   - 4  propuesta    (cotización enviada)
--   - 3  negociacion  (cerrando trato)
--   - 2  ganado       (clientes convertidos)
-- Lead score generado por Agente 31 (Samantha AI).
-- Fuentes: whatsapp, instagram, web, referido, linkedin
-- ============================================================

BEGIN;

INSERT INTO crm_leads (
  tenant_id,
  company_name,
  contact_name,
  email,
  phone,
  source,
  stage,
  estimated_value,
  lead_score,
  notes,
  created_at
) VALUES

-- ════════════════════════════════════════════════════════════
-- NUEVO (6) — Recién llegados, sin calificar
-- ════════════════════════════════════════════════════════════

-- Lead 1
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Constructora Pedroza & Asociados',
  'Ing. Ramón Pedroza',
  'ramon.pedroza@constructorapedroza.mx',
  '5512340001',
  'whatsapp',
  'nuevo',
  18000.00,
  42,
  'Preguntó por precio de rotomartillos y amoladoras en volumen. Envió foto de obra en construcción. Sin respuesta a seguimiento 24h.',
  NOW() - INTERVAL '1 day 6 hours'
),

-- Lead 2
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Ferretería El Tornillo Dorado',
  'Sra. Patricia Nájera',
  'pnajera@tornillodorado.com.mx',
  '3312340002',
  'instagram',
  'nuevo',
  9500.00,
  38,
  'Comentó en post de amoladoras Angular 5". Solicitó catálogo mayoreo por DM. Primer contacto hace 18h, pendiente calificación.',
  NOW() - INTERVAL '18 hours'
),

-- Lead 3
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Grupo Constructor Norteño SA de CV',
  'Lic. Ernesto Villanueva',
  'evillanueva@gcnorteno.mx',
  '8112340003',
  'web',
  'nuevo',
  32000.00,
  55,
  'Formulario web: "necesitamos equipar 3 cuadrillas con herramientas eléctricas". Empresa verificada en LinkedIn. Alta oportunidad.',
  NOW() - INTERVAL '2 days'
),

-- Lead 4
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Taller Mecánico Los Compadres',
  'Sr. Aurelio Sandoval',
  'aurelio.sandoval.tmc@gmail.com',
  '5512340004',
  'whatsapp',
  'nuevo',
  7200.00,
  29,
  'Preguntó si hay crédito a 12 meses. Interesado en compresor 50L y pistola de pintura. Taller pequeño, potencial recurrente.',
  NOW() - INTERVAL '3 days'
),

-- Lead 5
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Remodelar MX',
  'Arq. Claudia Rincón',
  'claudia.rincon@remodelarmx.com',
  '4412340005',
  'referido',
  'nuevo',
  14000.00,
  61,
  'Referido por cliente Remodelaciones Vargas (orden #2084271503). Busca kit de herramientas para equipo de 5 personas. Cita pendiente.',
  NOW() - INTERVAL '1 day'
),

-- Lead 6
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Importadora Hández & Soto',
  'Mtro. Gerardo Soto',
  'g.soto@importadorahs.com',
  '5512340006',
  'linkedin',
  'nuevo',
  45000.00,
  48,
  'Contacto frío LinkedIn. Distribuidor regional en Bajío. Interés en convertirse en revendedor autorizado. Reunión virtual solicitada.',
  NOW() - INTERVAL '4 hours'
),

-- ════════════════════════════════════════════════════════════
-- CALIFICADO (5) — Interés confirmado, presupuesto validado
-- ════════════════════════════════════════════════════════════

-- Lead 7
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Constructora Olmeca Group',
  'Ing. Beatriz Olmedo',
  'b.olmedo@olmecagroup.mx',
  '9992340007',
  'web',
  'calificado',
  28000.00,
  74,
  'Empresa calificada: 50+ empleados, proyectos residenciales. Necesita taladros inalámbricos x10 y amoladoras x8 en Q2. Presupuesto confirmado.',
  NOW() - INTERVAL '7 days'
),

-- Lead 8
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Carpintería Industrial Luna CDM',
  'Sr. Felipe Luna',
  'fluna@carpinterialunaCDM.mx',
  '5512340008',
  'instagram',
  'calificado',
  12500.00,
  68,
  'DM Instagram → llamada de 20 min. Verificado: taller establecido 8 años. Requiere sierra mesa 10" y sierra ingletadora. Demo solicitada.',
  NOW() - INTERVAL '5 days'
),

-- Lead 9
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Auto Pintura Express Nayarit',
  'Sr. Tomás Vega',
  't.vega@autopinturaexpress.mx',
  '3112340009',
  'whatsapp',
  'calificado',
  8800.00,
  71,
  'Taller de pintura de autos. Calificado: factura, RFC vigente. Necesita compresor silencioso 50L + pistola profesional. Financiamiento OK.',
  NOW() - INTERVAL '6 days'
),

-- Lead 10
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Metalmecanica Puebla Industrial',
  'Ing. Sofía Restrepo',
  's.restrepo@mmpuebla.com',
  '2222340010',
  'referido',
  'calificado',
  21000.00,
  79,
  'Referido por distribuidor. Gran empresa. Requiere 4 soldadoras MIG y 6 amoladoras banco. Decisión Q2. Visita a planta programada.',
  NOW() - INTERVAL '9 days'
),

-- Lead 11
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Bricolaje & Hogar Flores AGS',
  'Sra. Mónica Flores',
  'monica.flores@bricohogares.mx',
  '4492340011',
  'web',
  'calificado',
  6500.00,
  58,
  'Tienda de bricolaje en Aguascalientes. Calificada: 2 sucursales, venta minorista. Quiere surtir sección herramientas eléctricas. Visita confirmada.',
  NOW() - INTERVAL '10 days'
),

-- ════════════════════════════════════════════════════════════
-- PROPUESTA (4) — Cotización enviada, esperando respuesta
-- ════════════════════════════════════════════════════════════

-- Lead 12
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Constructora Sol Monterrey',
  'Ing. Daniel Morales',
  'd.morales@constructorasol.mx',
  '8182340012',
  'web',
  'propuesta',
  35000.00,
  82,
  'Propuesta enviada 2026-04-20. 15 taladros inalámbricos 20V + 10 rotomartillos. Precio especial -7% por volumen. Follow-up pendiente el lunes.',
  NOW() - INTERVAL '14 days'
),

-- Lead 13
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Ferretería San José Bajío',
  'Sr. Andrés Gutiérrez',
  'andres@ferreteriastjose.com.mx',
  '4772340013',
  'instagram',
  'propuesta',
  16500.00,
  77,
  'Propuesta enviada 2026-04-18. Surtido mixto: 20 amoladoras 4-1/2" + 10 sierras circular. Pidió plazo de pago 30 días. En revisión con dueño.',
  NOW() - INTERVAL '18 days'
),

-- Lead 14
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Taller Velázquez Querétaro',
  'Sr. Luis Velázquez',
  'l.velazquez@tallervelazquez.mx',
  '4422340014',
  'whatsapp',
  'propuesta',
  9200.00,
  65,
  'Propuesta enviada 2026-04-22. Compresor 100L industrial + martillo demoledor + amoladora banco. Esperando validación de crédito interna.',
  NOW() - INTERVAL '12 days'
),

-- Lead 15
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Industrias Beltrán SA de CV',
  'Lic. Rodrigo Beltrán',
  'r.beltran@industriasbeltran.com.mx',
  '5512340015',
  'referido',
  'propuesta',
  48000.00,
  88,
  'Lead hot. Propuesta enviada 2026-04-15. Kit completo 3 líneas de producción: sierras, taladros, compresores, bancos de trabajo. Director ya revisó.',
  NOW() - INTERVAL '22 days'
),

-- ════════════════════════════════════════════════════════════
-- NEGOCIACION (3) — Trato activo, condiciones en discusión
-- ════════════════════════════════════════════════════════════

-- Lead 16
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Grupo Remodelaciones Vargas CDMX',
  'Sr. Alejandro Vargas',
  'a.vargas@grupovargas.mx',
  '5512340016',
  'referido',
  'negociacion',
  22000.00,
  91,
  'Negociando condiciones. Cliente recompra (ya tuvo orden #2084271503). Pide 10% descuento por volumen + crédito 45 días. Decisión esta semana.',
  NOW() - INTERVAL '25 days'
),

-- Lead 17
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Distribuidora Herramientas del Norte',
  'Lic. Carmen Ibarra',
  'c.ibarra@herramientasnorte.mx',
  '6142340017',
  'linkedin',
  'negociacion',
  50000.00,
  93,
  'Distribuidor regional Sonora/Chihuahua. Negociando precio de lista mayorista y exclusividad regional. Contrato en revisión legal. Cierre próximo.',
  NOW() - INTERVAL '30 days'
),

-- Lead 18
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Maderas y Más Toluca SC',
  'Ing. Valentina Cruz',
  'v.cruz@maderasymastoluca.mx',
  '7222340018',
  'web',
  'negociacion',
  13500.00,
  86,
  'Discutiendo inclusión de garantía extendida 2 años. Ya compraron (orden #2084198774). Ahora buscan contrato anual de suministro. Casi cerrado.',
  NOW() - INTERVAL '20 days'
),

-- ════════════════════════════════════════════════════════════
-- GANADO (2) — Clientes convertidos ✅
-- ════════════════════════════════════════════════════════════

-- Lead 19
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Auto Pintura Nayarit (Cliente)',
  'Sr. Tomás Vega',
  't.vega@autopinturaexpress.mx',
  '3112340019',
  'whatsapp',
  'ganado',
  5800.00,
  95,
  'GANADO ✅ 2026-04-10. Compró compresor silencioso 50L KT-SILEN50. Orden ML #2084412760 (shipped). Seguimiento postventa programado.',
  NOW() - INTERVAL '45 days'
),

-- Lead 20
(
  '0ac40357-b96c-4a32-929e-ae810875d6b0',
  'Remodelaciones Vargas (Cliente)',
  'Sr. Alejandro Vargas',
  'a.vargas.remodelaciones@gmail.com',
  '5512340020',
  'referido',
  'ganado',
  7798.00,
  97,
  'GANADO ✅ 2026-04-13. Compró martillo demoledor + 2 amoladoras 4-1/2". Orden ML #2084271503 (delivered). Lead activo para recompra (ver lead #16).',
  NOW() - INTERVAL '40 days'
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN POST-INSERT
-- ============================================================
-- 1. Resumen de pipeline por etapa:
--
-- SELECT
--   stage,
--   COUNT(*)                       AS leads,
--   ROUND(AVG(lead_score), 1)      AS score_promedio,
--   SUM(estimated_value)           AS valor_pipeline,
--   MIN(created_at)::DATE          AS lead_mas_antiguo,
--   MAX(created_at)::DATE          AS lead_mas_reciente
-- FROM crm_leads
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
-- GROUP BY stage
-- ORDER BY
--   CASE stage
--     WHEN 'nuevo'       THEN 1
--     WHEN 'calificado'  THEN 2
--     WHEN 'propuesta'   THEN 3
--     WHEN 'negociacion' THEN 4
--     WHEN 'ganado'      THEN 5
--   END;
--
-- Resultado esperado:
--   nuevo       | 6 | ~45.5 | 125,700
--   calificado  | 5 | ~70.0 | 77,300
--   propuesta   | 4 | ~78.0 | 108,700
--   negociacion | 3 | ~90.0 | 85,500
--   ganado      | 2 | ~96.0 | 13,598
--
-- 2. Leads hot (score ≥ 85):
--
-- SELECT company_name, contact_name, stage, lead_score, estimated_value
-- FROM crm_leads
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
--   AND lead_score >= 85
-- ORDER BY lead_score DESC;
--
-- 3. Valor total del pipeline activo (excluyendo ganado):
--
-- SELECT SUM(estimated_value) AS pipeline_activo
-- FROM crm_leads
-- WHERE tenant_id = '0ac40357-b96c-4a32-929e-ae810875d6b0'
--   AND stage NOT IN ('ganado','perdido');
-- ============================================================
