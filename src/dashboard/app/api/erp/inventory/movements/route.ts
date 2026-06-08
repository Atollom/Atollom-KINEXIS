import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth
    const url = new URL(req.url)
    const sku = url.searchParams.get('sku')
    const type = url.searchParams.get('type')

    let query = supabase
      .from('inventory_movements')
      .select('id, sku, movement_type, qty_change, qty_before, qty_after, platform, reference_id, notes, created_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (sku) query = query.eq('sku', sku)
    if (type) query = query.eq('movement_type', type)

    const { data, error } = await query
    if (error) throw error

    const typeLabels: Record<string, string> = {
      sale: 'Venta', receipt: 'Recepción', adjustment: 'Ajuste',
      return: 'Devolución', sync_correction: 'Corrección Sync',
    }

    const movements = (data || []).map(m => ({
      id: m.id,
      sku: m.sku,
      type: m.movement_type,
      type_label: typeLabels[m.movement_type] ?? m.movement_type,
      qty_change: m.qty_change,
      qty_before: m.qty_before,
      qty_after: m.qty_after,
      platform: m.platform,
      reference: m.reference_id,
      notes: m.notes,
      created_at: m.created_at,
    }))

    const stats = {
      total_entries: movements.length,
      sales: movements.filter(m => m.type === 'sale').reduce((s, m) => s + Math.abs(m.qty_change), 0),
      receipts: movements.filter(m => m.type === 'receipt').reduce((s, m) => s + m.qty_change, 0),
      adjustments: movements.filter(m => m.type === 'adjustment').length,
    }

    return NextResponse.json({ movements, stats })
  } catch (err: unknown) {
    console.error('[Inventory Movements]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
