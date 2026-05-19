import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const [{ data: orders }, { data: leads }, { data: b2b }] = await Promise.all([
    supabase
      .from('orders')
      .select('customer_name, total, platform, created_at')
      .eq('tenant_id', auth.tenant_id)
      .neq('status', 'CANCELLED'),
    supabase
      .from('leads')
      .select('id, score, type, created_at')
      .eq('tenant_id', auth.tenant_id)
      .gte('created_at', since30),
    supabase
      .from('b2b_accounts')
      .select('id, health_score, mrr')
      .eq('tenant_id', auth.tenant_id),
  ])

  const allOrders = orders ?? []
  const allLeads = leads ?? []
  const allB2B = b2b ?? []

  const uniqueCustomers = new Set(allOrders.map(o => o.customer_name).filter(Boolean))
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const avgLTV = uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0

  const newLeads30d = allLeads.length
  const hotLeads = allLeads.filter(l => (l.score ?? 0) >= 70).length

  const avgB2BHealth = allB2B.length > 0
    ? allB2B.reduce((s, a) => s + (a.health_score ?? 0), 0) / allB2B.length
    : 0
  const b2bMRR = allB2B.reduce((s, a) => s + (a.mrr ?? 0), 0)

  const platformBreakdown: Record<string, number> = {}
  for (const o of allOrders) {
    platformBreakdown[o.platform] = (platformBreakdown[o.platform] ?? 0) + 1
  }

  return NextResponse.json({
    kpis: {
      total_customers: uniqueCustomers.size,
      avg_ltv: avgLTV,
      new_leads_30d: newLeads30d,
      hot_leads: hotLeads,
      b2b_accounts: allB2B.length,
      b2b_mrr: b2bMRR,
      avg_b2b_health: Math.round(avgB2BHealth),
    },
    by_platform: Object.entries(platformBreakdown).map(([platform, count]) => ({ platform, count })),
  })
}
