-- Migration 040: Seed initial memories for Kap Tools pilot user
-- Run manually in Supabase SQL editor.
-- Idempotent: skips if session_id = 'initial_seed' already exists for this user.
--
-- Prerequisites:
--   - Migration 039 must have run (samantha_memories table must exist)
--   - The user must exist in the users table (supabase_user_id lookup required)
--
-- Usage:
--   Replace SUPABASE_USER_ID below with the actual auth.uid() for the pilot user,
--   then run this script. The DO block resolves users.id automatically.

DO $$
DECLARE
    v_supabase_user_id UUID := '0aea6e5b-021e-4bee-9575-d45f99c7e8b3';
    v_tenant_id        UUID;
    v_user_id          UUID;  -- internal users.id PK (NOT supabase_user_id)
    v_existing         INT;
BEGIN
    -- Resolve internal user ID and tenant
    SELECT id, tenant_id
    INTO v_user_id, v_tenant_id
    FROM users
    WHERE supabase_user_id = v_supabase_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with supabase_user_id % not found in users table', v_supabase_user_id;
    END IF;

    -- Idempotency guard
    SELECT COUNT(*) INTO v_existing
    FROM samantha_memories
    WHERE tenant_id = v_tenant_id
      AND user_id   = v_user_id
      AND session_id = 'initial_seed';

    IF v_existing > 0 THEN
        RAISE NOTICE 'Initial seed already applied for user % — skipping', v_user_id;
        RETURN;
    END IF;

    -- Memory 1: Communication preference (importance 9)
    INSERT INTO samantha_memories
        (tenant_id, user_id, content, summary, importance, tags, agent_source, session_id)
    VALUES (
        v_tenant_id,
        v_user_id,
        'El usuario prefiere comunicación formal y directa. Sin emojis. Respuestas concisas y accionables.',
        'Preferencia de comunicación: formal, directa, sin emojis, respuestas cortas.',
        9,
        ARRAY['preferencia', 'comunicación', 'estilo'],
        'seed',
        'initial_seed'
    );

    -- Memory 2: Main client (importance 8)
    INSERT INTO samantha_memories
        (tenant_id, user_id, content, summary, importance, tags, agent_source, session_id)
    VALUES (
        v_tenant_id,
        v_user_id,
        'Cliente principal de Kap Tools: Constructora ABC. Realizan pedidos de taladros y brocas cada mes.',
        'Cliente principal: Constructora ABC — pedidos mensuales de taladros y brocas.',
        8,
        ARRAY['cliente', 'patrón', 'ventas'],
        'seed',
        'initial_seed'
    );

    -- Memory 3: Critical product alert (importance 8)
    INSERT INTO samantha_memories
        (tenant_id, user_id, content, summary, importance, tags, agent_source, session_id)
    VALUES (
        v_tenant_id,
        v_user_id,
        'El producto TAL-003 (taladro percutor 850W) genera alertas de stock crítico frecuentemente. Mantener mínimo 10 unidades en almacén.',
        'TAL-003 genera alertas de stock crítico. Stock mínimo recomendado: 10 unidades.',
        8,
        ARRAY['inventario', 'urgencia', 'TAL-003'],
        'seed',
        'initial_seed'
    );

    RAISE NOTICE 'Seeded 3 initial memories for user % (tenant %)', v_user_id, v_tenant_id;
END $$;
