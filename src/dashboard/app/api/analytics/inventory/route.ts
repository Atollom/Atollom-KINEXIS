import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [invRes, movRes] = await Promise.all([
      supabase.from('inventory').select('id, sku, quantity, low_stock_threshold, warehouse_location, cost_price').eq('tenant_id', tenant_id),
      supabase.from('inventory_movements').select('type, quantity, created_at').eq('tenant_id', tenant_id).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ])

    const inventory = invRes.data ?? []
    const movements = movRes.data ?? []

    const total_skus = inventory.length
    const total_units = inventory.reduce((s, i) => s + (i.quantity ?? 0), 0)
    const low_stock = inventory.filter(i => (i.quantity ?? 0) <= (i.low_stock_threshold ?? 5))
    const out_of_stock = inventory.filter(i => (i.quantity ?? 0) === 0)
    const total_value = inventory.reduce((s, i) => s + (i.quantity ?? 0) * Number(i.cost_price ?? 0), 0)

    const entries_30d = movements.filter(m => m.type === 'entry').reduce((s, m) => s + (m.quantity ?? 0), 0)
    const exits_30d = movements.filter(m => m.type === 'exit').reduce((s, m) => s + (m.quantity ?? 0), 0)

    const byWarehouse: Record<string, { skus: number; units: number }> = {}
    for (const i of inventory) {
      const wh = i.warehouse_location ?? 'Principal'
      if (!byWarehouse[wh]) byWarehouse[wh] = { skus: 0, units: 0 }
      byWarehouse[wh].skus++
      byWarehouse[wh].units += i.quantity ?? 0
    }

    return NextResponse.json({
      stats: {
        total_skus,
        total_units,
        low_stock_count: low_stock.length,
        out_of_stock_count: out_of_stock.length,
        total_value,
        entries_30d,
        exits_30d,
        net_movement_30d: entries_30d - exits_30d,
      },
      low_stock_items: low_stock.slice(0, 20).map(i => ({
        sku: i.sku,
        quantity: i.quantity,
        threshold: i.low_stock_threshold,
        warehouse: i.warehouse_location ?? 'Principal',
      })),
      by_warehouse: byWarehouse,
    })
  } catch (err: unknown) {
    console.error('[Analytics Inventory]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
