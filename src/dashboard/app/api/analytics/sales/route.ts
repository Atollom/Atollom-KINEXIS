import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, platform, total, status, created_at')
    .eq('tenant_id', auth.tenant_id)
    .neq('status', 'CANCELLED')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error consultando órdenes' }, { status: 500 })

  const rows = orders ?? []

  const totalRevenue = rows.reduce((s, o) => s + (o.total ?? 0), 0)
  const totalOrders = rows.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const byPlatform: Record<string, { orders: number; revenue: number }> = {}
  for (const o of rows) {
    if (!byPlatform[o.platform]) byPlatform[o.platform] = { orders: 0, revenue: 0 }
    byPlatform[o.platform].orders++
    byPlatform[o.platform].revenue += o.total ?? 0
  }

  const byDay: Record<string, { date: string; revenue: number; orders: number }> = {}
  for (const o of rows) {
    const day = o.created_at.slice(0, 10)
    if (!byDay[day]) byDay[day] = { date: day, revenue: 0, orders: 0 }
    byDay[day].revenue += o.total ?? 0
    byDay[day].orders++
  }

  return NextResponse.json({
    kpis: {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      avg_order_value: avgOrderValue,
    },
    by_platform: Object.entries(byPlatform).map(([platform, v]) => ({ platform, ...v })),
    daily_trend: Object.values(byDay),
  })
}
