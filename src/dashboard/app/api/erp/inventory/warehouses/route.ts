import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('sku, stock, days_remaining, products(name)')
      .eq('tenant_id', tenant_id)

    if (error) throw error

    // KINEXIS currently tracks one primary warehouse per tenant
    // Group by warehouse (defaulting to "Almacén Principal")
    const items = (inventory || [])
    const totalItems = items.length
    const totalStock = items.reduce((s, i) => s + (i.stock ?? 0), 0)
    const lowStockItems = items.filter(i => (i.days_remaining ?? 999) < 15)
    const outOfStock = items.filter(i => (i.stock ?? 0) === 0)

    const warehouses = [
      {
        id: 'wh-main',
        name: 'Almacén Principal',
        location: 'CDMX',
        sku_count: totalItems,
        total_units: totalStock,
        low_stock_skus: lowStockItems.length,
        out_of_stock_skus: outOfStock.length,
        capacity_pct: Math.min(100, Math.round((totalStock / Math.max(totalStock * 1.5, 1)) * 100)),
        status: outOfStock.length > totalItems * 0.2 ? 'critical' : lowStockItems.length > 0 ? 'warning' : 'healthy',
        top_skus: items
          .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
          .slice(0, 5)
          .map(i => ({
            sku: i.sku,
            name: ((i.products as unknown) as { name: string } | null)?.name ?? i.sku,
            stock: i.stock ?? 0,
            days_remaining: i.days_remaining ?? 0,
          })),
      },
    ]

    return NextResponse.json({ warehouses, stats: { total_warehouses: 1, total_skus: totalItems, total_units: totalStock } })
  } catch (err: unknown) {
    console.error('[Warehouses]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
