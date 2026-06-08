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

  const { data: responses } = await supabase
    .from('nps_responses')
    .select('id, score, comment, created_at, category')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = responses ?? []
  const promoters = rows.filter(r => r.score >= 9).length
  const passives = rows.filter(r => r.score >= 7 && r.score < 9).length
  const detractors = rows.filter(r => r.score < 7).length
  const total = rows.length
  const nps_score = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0

  return NextResponse.json({
    responses: rows,
    nps_score,
    promoters,
    passives,
    detractors,
    total,
  })
}
