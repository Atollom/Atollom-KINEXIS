import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (auth.role !== 'atollom_admin') {
    return NextResponse.json({ error: 'Acceso restringido' }, { status: 403 })
  }

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, active, created_at, stripe_customer_id, stripe_subscription_id')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error consultando tenants' }, { status: 500 })

  const tenantIds = (tenants ?? []).map(t => t.id)

  const { data: profiles } = tenantIds.length > 0
    ? await supabase
        .from('tenant_profiles')
        .select('tenant_id, plan, business_name, onboarding_complete')
        .in('tenant_id', tenantIds)
    : { data: [] }

  const { data: userCounts } = tenantIds.length > 0
    ? await supabase
        .from('users')
        .select('tenant_id')
        .in('tenant_id', tenantIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.tenant_id, p]))
  const countMap: Record<string, number> = {}
  for (const u of userCounts ?? []) {
    countMap[u.tenant_id] = (countMap[u.tenant_id] ?? 0) + 1
  }

  const result = (tenants ?? []).map(t => ({
    id: t.id,
    name: t.name,
    active: t.active,
    created_at: t.created_at,
    plan: profileMap[t.id]?.plan ?? 'Starter',
    business_name: profileMap[t.id]?.business_name ?? '',
    onboarding_complete: profileMap[t.id]?.onboarding_complete ?? false,
    user_count: countMap[t.id] ?? 0,
    has_stripe: !!t.stripe_subscription_id,
  }))

  return NextResponse.json({ tenants: result })
}
