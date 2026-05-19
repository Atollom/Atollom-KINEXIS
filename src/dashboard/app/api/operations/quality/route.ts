import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const [{ data: returns }, { data: tickets }] = await Promise.all([
    supabase
      .from('returns')
      .select('id, sku, reason, status, created_at')
      .eq('tenant_id', auth.tenant_id)
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('support_tickets')
      .select('id, subject, status, priority, created_at')
      .eq('tenant_id', auth.tenant_id)
      .gte('created_at', since30)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const allReturns = returns ?? []
  const allTickets = tickets ?? []

  const returnsByReason: Record<string, number> = {}
  for (const r of allReturns) {
    const key = r.reason ?? 'Sin especificar'
    returnsByReason[key] = (returnsByReason[key] ?? 0) + 1
  }

  const ticketsByStatus: Record<string, number> = {}
  for (const t of allTickets) {
    ticketsByStatus[t.status ?? 'open'] = (ticketsByStatus[t.status ?? 'open'] ?? 0) + 1
  }

  return NextResponse.json({
    returns: allReturns,
    tickets: allTickets,
    kpis: {
      total_returns: allReturns.length,
      pending_returns: allReturns.filter(r => r.status === 'pending').length,
      total_tickets: allTickets.length,
      open_tickets: allTickets.filter(t => t.status === 'open').length,
      high_priority: allTickets.filter(t => t.priority === 'high').length,
    },
    returns_by_reason: Object.entries(returnsByReason).map(([reason, count]) => ({ reason, count })),
    tickets_by_status: Object.entries(ticketsByStatus).map(([status, count]) => ({ status, count })),
  })
}
