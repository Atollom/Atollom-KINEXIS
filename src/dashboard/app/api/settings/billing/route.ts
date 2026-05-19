import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('tenant_profiles')
    .select('plan, active_modules, created_at')
    .eq('tenant_id', auth.tenant_id)
    .maybeSingle()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, stripe_customer_id, stripe_subscription_id')
    .eq('id', auth.tenant_id)
    .maybeSingle()

  const planPrices: Record<string, number> = { Starter: 6500, Growth: 10500, Pro: 16500 }
  const plan = profile?.plan ?? 'Starter'

  return NextResponse.json({
    plan,
    price: planPrices[plan] ?? 6500,
    active_modules: profile?.active_modules ?? [],
    has_stripe: !!tenant?.stripe_subscription_id,
    stripe_customer_id: tenant?.stripe_customer_id ?? null,
    tenant_name: tenant?.name ?? '',
    member_since: profile?.created_at ?? null,
  })
}
