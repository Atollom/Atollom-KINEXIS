import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data: inventory }, { data: movements }] = await Promise.all([
    supabase
      .from('inventory')
      .select('sku, quantity, min_stock, cost, location')
      .eq('tenant_id', auth.tenant_id),
    supabase
      .from('inventory_movements')
      .select('sku, quantity, movement_type, created_at')
      .eq('tenant_id', auth.tenant_id)
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const items = inventory ?? []
  const moves = movements ?? []

  const totalValue = items.reduce((s, i) => s + (i.quantity ?? 0) * (i.cost ?? 0), 0)
  const lowStock = items.filter(i => (i.quantity ?? 0) <= (i.min_stock ?? 0) && (i.quantity ?? 0) > 0)
  const outOfStock = items.filter(i => (i.quantity ?? 0) === 0)

  const movesByDay: Record<string, { date: string; in: number; out: number }> = {}
  for (const m of moves) {
    const day = m.created_at.slice(0, 10)
    if (!movesByDay[day]) movesByDay[day] = { date: day, in: 0, out: 0 }
    if (m.movement_type === 'in') movesByDay[day].in += m.quantity ?? 0
    else movesByDay[day].out += Math.abs(m.quantity ?? 0)
  }

  return NextResponse.json({
    kpis: {
      total_value: totalValue,
      total_skus: items.length,
      low_stock_count: lowStock.length,
      out_of_stock_count: outOfStock.length,
    },
    low_stock_items: lowStock.slice(0, 10).map(i => ({
      sku: i.sku,
      quantity: i.quantity,
      min_stock: i.min_stock,
      location: i.location,
    })),
    movement_trend: Object.values(movesByDay).sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
  })
}
