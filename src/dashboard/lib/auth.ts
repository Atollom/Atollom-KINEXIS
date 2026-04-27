// src/dashboard/lib/auth.ts
import { SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, TenantUser } from '../types';

/**
 * Helper para obtener user + tenant_id + role
 * El tenant_id SIEMPRE viene del user_profiles en la BD
 */
export async function getAuthenticatedTenant(supabase: SupabaseClient): Promise<TenantUser | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('tenant_id, role, full_name, tenants(plan, name)')
    .eq('supabase_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: user.id,
    tenant_id: profile.tenant_id,
    role: profile.role,
    name: profile.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    is_atollom_admin: profile.role === 'atollom_admin',
    plan_id: (profile.tenants as any)?.plan,
    tenant_name: (profile.tenants as any)?.name || 'KINEXIS'
  } as TenantUser;
}

/**
 * Obtiene el rol del usuario — consulta directa sin join para evitar fallos silenciosos
 * si la tabla tenants no tiene la fila correspondiente.
 */
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return 'viewer';

  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data?.role) return 'viewer';
  return data.role as UserRole;
}

