// src/dashboard/lib/auth.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { TenantUser } from '../types';

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
    .from('user_profiles')
    .select('tenant_id, role, full_name, id, tenants(plan_id)')
    .eq('id', user.id)
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
    plan_id: (profile.tenants as any)?.plan_id
  } as TenantUser;
}
