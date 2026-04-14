-- ══════════════════════════════════════════════════════════════════════════════
-- scripts/seed_ortho_cardio.sql
-- KINEXIS — Cliente de Prueba: Comercializadora Ortho Cardio
-- Idempotente: ON CONFLICT DO NOTHING en todo
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    -- IDs FIJOS para Ortho Cardio
    v_tenant_id UUID := 'd0e84000-e29b-41d4-a716-446655440002';
    v_owner_id  UUID := '550e8400-e29b-41d4-a716-446655440001';
    
    -- ID FIJO para Atollom / Kap Tools
    v_atollom_tenant_id UUID := '40446806-0107-6201-9311-000000000001';
    v_atollom_admin_id  UUID; -- Se buscará por email
    
    -- Variables auxiliares
    v_order_id     UUID;
    v_lead_id      UUID;
    v_supplier_id  UUID;
    v_b2b_id       UUID;
    v_i            INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando Seed de Comercializadora Ortho Cardio...';

    -- ─────────────────────────────────────────────────────────────────────────
    -- 1. TENANT & PROFILES
    -- ─────────────────────────────────────────────────────────────────────────
    
    INSERT INTO tenants (id, name)
    VALUES (v_tenant_id, 'Comercializadora Ortho Cardio')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO tenant_profiles (
        tenant_id, business_name, rfc, plan, active_modules, onboarding_complete
    )
    VALUES (
        v_tenant_id, 
        'COMERCIALIZADORA ORTHO CARDIO SA DE CV', 
        'OCA220101BC0', 
        'Pro', 
        ARRAY['ecommerce','erp','crm'],
        TRUE
    )
    ON CONFLICT (tenant_id) DO NOTHING;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 2. USUARIOS (AUTH & PROFILES)
    -- ─────────────────────────────────────────────────────────────────────────
    
    -- demo@orthocardio.mx
    -- Security: Si el SQL Editor tiene permisos sobre schema 'auth'
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, role, aud, confirmation_token
        ) VALUES (
            v_owner_id,
            '00000000-0000-0000-0000-000000000000',
            'orthocardio@prueba.com',
            extensions.crypt('Atollom', extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Demo Owner OrthoCardio"}',
            'authenticated',
            'authenticated',
            'token'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    INSERT INTO user_profiles (id, tenant_id, full_name, role, display_name, email)
    VALUES (v_owner_id, v_tenant_id, 'Demo Owner OrthoCardio', 'owner', 'Ortho Admin', 'orthocardio@prueba.com')
    ON CONFLICT (id) DO NOTHING;

    -- contacto@atollom.com (Admin Global)
    -- Asumimos que ya existe en auth.users, pero si no, creamos uno con Atollom2026
    SELECT id INTO v_atollom_admin_id FROM auth.users WHERE email = 'contacto@atollom.com' LIMIT 1;
    
    IF v_atollom_admin_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        v_atollom_admin_id := '40446806-0107-6201-9311-000000000002';
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, role, aud, confirmation_token
        ) VALUES (
            v_atollom_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'contacto@atollom.com',
            extensions.crypt('Atollom2026', extensions.gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Atollom Admin"}',
            'authenticated',
            'authenticated',
            'token'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;

    IF v_atollom_admin_id IS NOT NULL THEN
        INSERT INTO user_profiles (id, tenant_id, full_name, role, display_name, email)
        VALUES (v_atollom_admin_id, v_atollom_tenant_id, 'Atollom Admin', 'atollom_admin', 'Atollom HQ', 'contacto@atollom.com')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 3. PRODUCTOS & INVENTARIO (12 SKUs)
    -- ─────────────────────────────────────────────────────────────────────────
    
    -- Categoría: Surgical Supplies
    INSERT INTO products (tenant_id, sku, name, cost, base_price, category) VALUES
    (v_tenant_id, 'OC-CATH-NIT-01', 'Catéter de Nitinol Guía 0.014"', 1200.00, 4500.00, 'Cardio'),
    (v_tenant_id, 'OC-STENT-COB', 'Stent de Cromo-Cobalto 3.0x18mm', 8500.00, 22000.00, 'Cardio'),
    (v_tenant_id, 'OC-GLOVE-STER-M', 'Guantes Quirúrgicos Estériles (Par) - M', 15.00, 45.00, 'Surgical'),
    (v_tenant_id, 'OC-GLOVE-STER-L', 'Guantes Quirúrgicos Estériles (Par) - L', 15.00, 45.00, 'Surgical'),
    (v_tenant_id, 'OC-GAUZE-10X10', 'Gasas Estériles 10x10cm (Caja 100)', 85.00, 180.00, 'Basic'),
    (v_tenant_id, 'OC-SYR-5ML-LUER', 'Jeringa 5ml Luer Lock (Caja 100)', 210.00, 450.00, 'Basic'),
    (v_tenant_id, 'OC-SCALPEL-11', 'Bisturí Desechable #11 (Caja 10)', 140.00, 320.00, 'Surgical'),
    (v_tenant_id, 'OC-SUT-NYL-3-0', 'Sutura Nylon 3-0 Aguja FS-2', 45.00, 110.00, 'Surgical'),
    (v_tenant_id, 'OC-MASK-N95-SURG', 'Cubrebocas N95 Quirúrgico (Caja 20)', 300.00, 850.00, 'Basic'),
    (v_tenant_id, 'OC-GEL-US-5L', 'Gel Ultrasonido 5L EcoGal', 180.00, 420.00, 'Imaging'),
    (v_tenant_id, 'OC-CANE-ALUM-ADJ', 'Bastón de Aluminio Ajustable', 150.00, 580.00, 'Ortho'),
    (v_tenant_id, 'OC-KNEE-BRACE-M', 'Rodillera Mecánica Ajustable - M', 850.00, 2450.00, 'Ortho')
    ON CONFLICT (tenant_id, sku) DO NOTHING;

    INSERT INTO inventory (tenant_id, sku, stock, days_remaining) VALUES
    (v_tenant_id, 'OC-CATH-NIT-01', 45, 120),
    (v_tenant_id, 'OC-STENT-COB', 8, 5), -- CRÍTICO
    (v_tenant_id, 'OC-GLOVE-STER-M', 1200, 90),
    (v_tenant_id, 'OC-GLOVE-STER-L', 50, 4),  -- CRÍTICO
    (v_tenant_id, 'OC-GAUZE-10X10', 300, 60),
    (v_tenant_id, 'OC-SYR-5ML-LUER', 150, 45),
    (v_tenant_id, 'OC-SCALPEL-11', 12, 15),
    (v_tenant_id, 'OC-SUT-NYL-3-0', 200, 180),
    (v_tenant_id, 'OC-MASK-N95-SURG', 5, 2),   -- CRÍTICO
    (v_tenant_id, 'OC-GEL-US-5L', 80, 50),
    (v_tenant_id, 'OC-CANE-ALUM-ADJ', 35, 90),
    (v_tenant_id, 'OC-KNEE-BRACE-M', 15, 60)
    ON CONFLICT (tenant_id, sku) DO UPDATE SET 
        stock = EXCLUDED.stock, 
        days_remaining = EXCLUDED.days_remaining;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 4. B2B ACCOUNTS & LEADS
    -- ─────────────────────────────────────────────────────────────────────────

    INSERT INTO b2b_accounts (tenant_id, company_name, contact_phone, health_score, mrr) VALUES
    (v_tenant_id, 'Hospital Ángeles Puebla', '2221234567', 95, 45000.00),
    (v_tenant_id, 'Médica Sur CDMX', '5551234567', 88, 120000.00),
    (v_tenant_id, 'Clínica Los Olivos', '3331234567', 70, 15000.00),
    (v_tenant_id, 'Sanitario San José', '8111234567', 92, 28000.00),
    (v_tenant_id, 'Centro Médico de Occidente', '3339876543', 60, 55000.00),
    (v_tenant_id, 'Hospital Star Médica', '4421234567', 85, 32000.00)
    ON CONFLICT DO NOTHING;

    INSERT INTO leads (tenant_id, name, score, type, deal_stage, company) VALUES
    (v_tenant_id, 'Dr. Armenta - Ortopedia', 20, 'b2b', 'new', 'Clínica Armenta'),
    (v_tenant_id, 'Lic. Martha Ruiz - Compras', 45, 'b2b', 'discovery', 'Hospital del Prado'),
    (v_tenant_id, 'Ing. Carlos Slim (Hospitales)', 70, 'b2b', 'proposal', 'Grupo Salud'),
    (v_tenant_id, 'Dra. Elena Poniatoska', 90, 'b2b', 'negotiation', 'Clínica Central')
    ON CONFLICT DO NOTHING;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 5. ÓRDENES (30 ÚLTIMOS DÍAS)
    -- ─────────────────────────────────────────────────────────────────────────
    
    FOR v_i IN 0..29 LOOP
        INSERT INTO orders (
            tenant_id, external_id, platform, status, customer_name, total, created_at
        ) VALUES (
            v_tenant_id,
            'ORD-' || (1000 + v_i),
            'b2b',
            CASE 
                WHEN v_i % 5 = 0 THEN 'APPROVED'
                WHEN v_i % 7 = 0 THEN 'SENT'
                ELSE 'DELIVERED'
            END,
            'Cliente Recurrente #' || v_i,
            500.00 + (v_i * 150.00),
            now() - (v_i || ' days')::interval
        ) RETURNING id INTO v_order_id;
        
        INSERT INTO order_items (tenant_id, order_id, sku, quantity, unit_price)
        VALUES (v_tenant_id, v_order_id, 'OC-GAUZE-10X10', 2, 180.00);
    END LOOP;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 6. WHATSAPP MESSAGES (15)
    -- ─────────────────────────────────────────────────────────────────────────
    
    INSERT INTO whatsapp_messages (tenant_id, from_number, to_number, direction, message_text, intent, processed) VALUES
    (v_tenant_id, '5212221002001', 'system', 'inbound', 'Hola, tienen catéteres de nitinol?', 'consulta_producto', TRUE),
    (v_tenant_id, 'system', '5212221002001', 'outbound', 'Hola! Sí, contamos con el Catéter de Nitinol Guía 0.014" en stock.', 'system', TRUE),
    (v_tenant_id, '5212221002001', 'system', 'inbound', 'Qué precio tiene la caja?', 'consulta_producto', TRUE),
    (v_tenant_id, 'system', '5212221002001', 'outbound', 'El precio base es de $4,500.00 MXN. Deseas una cotización formal?', 'system', TRUE),
    (v_tenant_id, '5212221002001', 'system', 'inbound', 'Sí, por favor para 10 piezas.', 'cotizacion_b2b', TRUE),
    (v_tenant_id, 'system', '5212221002001', 'outbound', 'Perfecto. Generando cotización... Me podrías pasar tu RFC para registrarte?', 'system', TRUE),
    (v_tenant_id, '5212221223344', 'system', 'inbound', 'Necesito mi factura de ayer', 'solicitud_factura', TRUE),
    (v_tenant_id, 'system', '5212221223344', 'outbound', 'Claro, con gusto. ¿A qué RFC facturamos?', 'system', TRUE),
    (v_tenant_id, '5212221223344', 'system', 'inbound', 'Es BEMB850101XYZ', 'solicitud_factura', TRUE),
    (v_tenant_id, 'system', '5212221223344', 'outbound', 'Gracias. Factura en proceso.', 'system', TRUE),
    (v_tenant_id, '525550001234', 'system', 'inbound', 'Tienen guantes L?', 'consulta_producto', TRUE),
    (v_tenant_id, 'system', '525550001234', 'outbound', 'Tenemos pocas unidades, ¿cuántas necesitas?', 'system', TRUE),
    (v_tenant_id, '525550001234', 'system', 'inbound', '50 cajas', 'consulta_producto', TRUE),
    (v_tenant_id, 'system', '525550001234', 'outbound', 'Te contacto con un agente para validar stock de bodega.', 'system', TRUE),
    (v_tenant_id, '525550001234', 'system', 'inbound', 'Ok gracias', 'otro', TRUE)
    ON CONFLICT DO NOTHING;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 7. CFDIs (2 RECORDS)
    -- ─────────────────────────────────────────────────────────────────────────
    
    INSERT INTO cfdi_records (tenant_id, uuid, folio, customer_rfc, customer_name, total, status) VALUES
    (v_tenant_id, uuid_generate_v4(), 'F-501', 'HAP900101XYZ', 'Hospital Ángeles Puebla', 15600.00, 'TIMBRADO'),
    (v_tenant_id, uuid_generate_v4(), 'F-502', 'MSU850101ABC', 'Médica Sur CDMX', 42000.00, 'TIMBRADO')
    ON CONFLICT DO NOTHING;

    -- ─────────────────────────────────────────────────────────────────────────
    -- 8. PROCUREMENT (PO)
    -- ─────────────────────────────────────────────────────────────────────────
    
    INSERT INTO approved_suppliers (tenant_id, name, contact_email, active)
    VALUES (v_tenant_id, 'Insumos Médicos Globales', 'ventas@globalmed.com', TRUE)
    ON CONFLICT DO NOTHING RETURNING id INTO v_supplier_id;

    IF v_supplier_id IS NOT NULL THEN
        INSERT INTO purchase_orders (tenant_id, supplier_id, status, total_estimate, items)
        VALUES (
            v_tenant_id, 
            v_supplier_id, 
            'PENDING_APPROVAL', 
            25000.00, 
            '[{"sku": "OC-STENT-COB", "qty": 5, "price": 5000}]'::jsonb
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RAISE NOTICE 'Seed finalizado exitosamente.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- QUERY DE VERIFICACIÓN
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 
  'Tenants' as concept, count(*) as count FROM tenants WHERE id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'User Profiles', count(*) FROM user_profiles WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Products', count(*) FROM products WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Inventory (All)', count(*) FROM inventory WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Inventory (Critical)', count(*) FROM inventory WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002' AND days_remaining < 7
UNION ALL
SELECT 'B2B Accounts', count(*) FROM b2b_accounts WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Leads', count(*) FROM leads WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Orders (Last 30d)', count(*) FROM orders WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'WA Messages', count(*) FROM whatsapp_messages WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'CFDIs', count(*) FROM cfdi_records WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002'
UNION ALL
SELECT 'Purchase Orders', count(*) FROM purchase_orders WHERE tenant_id = 'd0e84000-e29b-41d4-a716-446655440002';
