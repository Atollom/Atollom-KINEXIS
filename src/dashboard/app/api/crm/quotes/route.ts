import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function getAuthenticatedTenant(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).single()
  return data ? { userId: user.id, tenantId: data.tenant_id, role: data.role } : null
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const tenant = await getAuthenticatedTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, lead_id, total_amount, status, items, created_at, updated_at')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = quotes ?? []
  const total_sent = rows.filter(q => q.status === 'sent').reduce((s, q) => s + (q.total_amount ?? 0), 0)
  const total_accepted = rows.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.total_amount ?? 0), 0)
  const acceptance_rate = rows.length > 0
    ? Math.round((rows.filter(q => q.status === 'accepted').length / rows.length) * 100)
    : 0

  return NextResponse.json({
    quotes: rows,
    stats: {
      total: rows.length,
      pending: rows.filter(q => q.status === 'draft' || q.status === 'sent').length,
      total_sent,
      total_accepted,
      acceptance_rate,
    },
  })
}
