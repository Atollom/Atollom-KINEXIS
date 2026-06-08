import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [invRes, prodRes] = await Promise.all([
      supabase.from('inventory').select('sku, stock, days_remaining').eq('tenant_id', tenant_id),
      supabase.from('products').select('sku, name, cost, base_price, category').eq('tenant_id', tenant_id),
    ])

    const inventory = invRes.data || []
    const products = prodRes.data || []
    const productMap = new Map(products.map(p => [p.sku, p]))

    const items = inventory.map(inv => {
      const product = productMap.get(inv.sku)
      const cost = Number(product?.cost ?? 0)
      const price = Number(product?.base_price ?? 0)
      const stock = inv.stock ?? 0
      return {
        sku: inv.sku,
        name: product?.name ?? inv.sku,
        category: product?.category ?? 'General',
        stock,
        cost,
        price,
        cost_total: cost * stock,
        price_total: price * stock,
        margin_pct: price > 0 ? Math.round(((price - cost) / price) * 100) : 0,
        days_remaining: inv.days_remaining ?? 0,
      }
    }).sort((a, b) => b.cost_total - a.cost_total)

    const totalCostValue = items.reduce((s, i) => s + i.cost_total, 0)
    const totalPriceValue = items.reduce((s, i) => s + i.price_total, 0)
    const avgMargin = items.length > 0
      ? Math.round(items.reduce((s, i) => s + i.margin_pct, 0) / items.length)
      : 0

    return NextResponse.json({
      items,
      stats: {
        total_cost_value: totalCostValue,
        total_price_value: totalPriceValue,
        avg_margin_pct: avgMargin,
        total_skus: items.length,
      },
    })
  } catch (err: unknown) {
    console.error('[Valuation]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
