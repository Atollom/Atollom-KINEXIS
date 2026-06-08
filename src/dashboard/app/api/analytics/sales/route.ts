import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '30')

    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total, status, channel, created_at')
      .eq('tenant_id', tenant_id)
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (error) throw error

    const valid = (orders ?? []).filter(o => o.status !== 'cancelled')
    const total_revenue = valid.reduce((s, o) => s + Number(o.total ?? 0), 0)
    const total_orders = valid.length
    const avg_order = total_orders > 0 ? Math.round(total_revenue / total_orders) : 0
    const cancelled = (orders ?? []).filter(o => o.status === 'cancelled').length

    // Group by day
    const byDay: Record<string, { revenue: number; orders: number }> = {}
    for (const o of valid) {
      const day = o.created_at.slice(0, 10)
      if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 }
      byDay[day].revenue += Number(o.total ?? 0)
      byDay[day].orders += 1
    }
    const daily = Object.entries(byDay).map(([date, v]) => ({ date, ...v }))

    // By channel
    const byChannel: Record<string, number> = {}
    for (const o of valid) {
      const ch = o.channel ?? 'web'
      byChannel[ch] = (byChannel[ch] ?? 0) + Number(o.total ?? 0)
    }

    // By status
    const byStatus: Record<string, number> = {}
    for (const o of orders ?? []) {
      byStatus[o.status ?? 'unknown'] = (byStatus[o.status ?? 'unknown'] ?? 0) + 1
    }

    return NextResponse.json({
      stats: { total_revenue, total_orders, avg_order, cancelled, period_days: days },
      daily,
      by_channel: byChannel,
      by_status: byStatus,
    })
  } catch (err: unknown) {
    console.error('[Analytics Sales]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
