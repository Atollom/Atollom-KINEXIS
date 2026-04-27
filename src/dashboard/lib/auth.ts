// src/dashboard/lib/auth.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, TenantUser } from '../types';

/**
 * Helper para obtener user + tenant_id + role.
 * Estrategia de lookup:
 *   1. Por supabase_user_id (caso normal post-onboarding)
 *   2. Por email como fallback (usuarios creados antes de ligar supabase_user_id)
 *      → auto-backfill supabase_user_id para futuras llamadas
 */
export async function getAuthenticatedTenant(supabase: SupabaseClient): Promise<TenantUser | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const SELECT = 'tenant_id, role, full_name, tenants(plan, name)';

  // 1. Lookup primario por supabase_user_id
  let { data: profile } = await supabase
    .from('users')
    .select(SELECT)
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  // 2. Fallback por email (usuario existe en `users` pero sin supabase_user_id)
  if (!profile && user.email) {
    const { data: byEmail } = await supabase
      .from('users')
      .select(SELECT)
      .eq('email', user.email)
      .maybeSingle();

    if (byEmail) {
      profile = byEmail;
      // Backfill silencioso para que el próximo login use el lookup rápido
      await supabase
        .from('users')
        .update({ supabase_user_id: user.id })
        .eq('email', user.email);
    }
  }

  if (!profile) return null;

  return {
    id: user.id,
    tenant_id: profile.tenant_id,
    role: profile.role,
    name: profile.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    is_atollom_admin: profile.role === 'atollom_admin',
    plan_id: (profile.tenants as any)?.plan,
    tenant_name: (profile.tenants as any)?.name || 'KINEXIS',
  } as TenantUser;
}

/**
 * Obtiene el rol del usuario — consulta directa sin join.
 */
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return 'viewer';

  // Intenta por supabase_user_id, luego por email
  let data: { role: string } | null = null;

  const byId = await supabase
    .from('users')
    .select('role')
    .eq('supabase_user_id', user.id)
    .maybeSingle();

  data = byId.data;

  if (!data && user.email) {
    const byEmail = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .maybeSingle();
    data = byEmail.data;
  }

  if (!data?.role) return 'viewer';
  return data.role as UserRole;
}

