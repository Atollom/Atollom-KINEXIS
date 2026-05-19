import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: inventory, error } = await supabase
    .from('inventory')
    .select('sku, quantity, min_stock, cost, location, updated_at')
    .eq('tenant_id', auth.tenant_id)
    .order('quantity', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error consultando inventario' }, { status: 500 })

  const items = inventory ?? []

  const byLocation: Record<string, { location: string; sku_count: number; total_units: number; total_value: number }> = {}
  for (const i of items) {
    const loc = i.location ?? 'Sin ubicación'
    if (!byLocation[loc]) byLocation[loc] = { location: loc, sku_count: 0, total_units: 0, total_value: 0 }
    byLocation[loc].sku_count++
    byLocation[loc].total_units += i.quantity ?? 0
    byLocation[loc].total_value += (i.quantity ?? 0) * (i.cost ?? 0)
  }

  return NextResponse.json({
    items: items.map(i => ({
      sku: i.sku,
      quantity: i.quantity,
      min_stock: i.min_stock,
      cost: i.cost,
      location: i.location ?? 'Sin ubicación',
      value: (i.quantity ?? 0) * (i.cost ?? 0),
      status: (i.quantity ?? 0) === 0 ? 'out' : (i.quantity ?? 0) <= (i.min_stock ?? 0) ? 'low' : 'ok',
      updated_at: i.updated_at,
    })),
    by_location: Object.values(byLocation),
    kpis: {
      total_skus: items.length,
      total_units: items.reduce((s, i) => s + (i.quantity ?? 0), 0),
      total_value: items.reduce((s, i) => s + (i.quantity ?? 0) * (i.cost ?? 0), 0),
      locations: Object.keys(byLocation).length,
    },
  })
}
