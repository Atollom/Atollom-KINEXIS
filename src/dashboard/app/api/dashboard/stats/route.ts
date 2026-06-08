import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [ordersRes, leadsRes, cfdiRes, invRes, ticketsRes] = await Promise.all([
      supabase.from('orders').select('id, total, status, created_at').eq('tenant_id', tenant_id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('leads').select('id, deal_stage, estimated_value, score').eq('tenant_id', tenant_id),
      supabase.from('cfdi_records').select('id, total, status').eq('tenant_id', tenant_id).gte('issued_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from('inventory').select('id, quantity, low_stock_threshold').eq('tenant_id', tenant_id),
      supabase.from('support_tickets').select('id, status').eq('tenant_id', tenant_id).eq('status', 'open'),
    ])

    const orders = ordersRes.data ?? []
    const leads = leadsRes.data ?? []
    const cfdi = cfdiRes.data ?? []
    const inventory = invRes.data ?? []
    const tickets = ticketsRes.data ?? []

    const revenue30d = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total ?? 0), 0)
    const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.deal_stage ?? '')).length
    const pipeline = leads.filter(l => !['won', 'lost'].includes(l.deal_stage ?? '')).reduce((s, l) => s + Number(l.estimated_value ?? 0), 0)
    const lowStock = inventory.filter(i => i.quantity <= (i.low_stock_threshold ?? 5)).length
    const cfdiTotal = cfdi.filter(c => c.status !== 'cancelled').reduce((s, c) => s + Number(c.total ?? 0), 0)

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
    const recentOrders = orders.filter(o => o.created_at >= sevenDaysAgo).length

    return NextResponse.json({
      revenue_30d: revenue30d,
      orders_30d: orders.length,
      orders_7d: recentOrders,
      active_leads: activeLeads,
      pipeline_value: pipeline,
      cfdi_total_30d: cfdiTotal,
      cfdi_count_30d: cfdi.length,
      low_stock_alerts: lowStock,
      open_tickets: tickets.length,
      avg_lead_score: leads.length ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length) : 0,
    })
  } catch (err: unknown) {
    console.error('[Dashboard Stats]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
