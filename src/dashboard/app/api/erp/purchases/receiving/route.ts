import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: pos, error } = await supabase
      .from('purchase_orders')
      .select(`
        id, status, items, total_estimate, created_at, updated_at,
        approved_suppliers (name, contact_phone)
      `)
      .eq('tenant_id', tenant_id)
      .in('status', ['APPROVED', 'SENT', 'RECEIVED'])
      .order('updated_at', { ascending: false })

    if (error) throw error

    const items = (pos || []).map(po => {
      const supplier = po.approved_suppliers as { name: string; contact_phone: string } | null
      const poItems = Array.isArray(po.items) ? po.items as { sku: string; qty: number; unit_cost: number }[] : []
      return {
        id: po.id,
        folio: `OC-${po.id.slice(0, 6).toUpperCase()}`,
        supplier: supplier?.name ?? 'Sin proveedor',
        supplier_phone: supplier?.contact_phone ?? null,
        status: po.status,
        total: Number(po.total_estimate),
        items: poItems,
        items_count: poItems.length,
        received: po.status === 'RECEIVED',
        created_at: po.created_at,
        updated_at: po.updated_at,
      }
    })

    return NextResponse.json({
      items,
      stats: {
        pending: items.filter(i => i.status === 'SENT').length,
        received: items.filter(i => i.status === 'RECEIVED').length,
        approved: items.filter(i => i.status === 'APPROVED').length,
      },
    })
  } catch (err: unknown) {
    console.error('[Receiving]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { po_id } = await req.json()
    if (!po_id) return NextResponse.json({ error: 'po_id requerido' }, { status: 400 })

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'RECEIVED', updated_at: new Date().toISOString() })
      .eq('id', po_id)
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[Receiving PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
