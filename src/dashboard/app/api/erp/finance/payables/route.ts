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
        approved_suppliers (name, contact_email, contact_phone)
      `)
      .eq('tenant_id', tenant_id)
      .not('status', 'eq', 'CANCELLED')
      .order('created_at', { ascending: false })

    if (error) throw error

    const items = (pos || []).map(po => {
      const supplier = (po.approved_suppliers as unknown) as { name: string; contact_email: string } | null
      const daysPending = Math.floor((Date.now() - new Date(po.created_at).getTime()) / 86400000)
      const itemCount = Array.isArray(po.items) ? po.items.length : 0
      return {
        id: po.id,
        folio: `OC-${po.id.slice(0, 6).toUpperCase()}`,
        supplier: supplier?.name || 'Proveedor sin nombre',
        supplier_email: supplier?.contact_email || null,
        status: po.status,
        total: Number(po.total_estimate) || 0,
        items_count: itemCount,
        days_pending: daysPending,
        overdue: daysPending > 45 && !['RECEIVED', 'CANCELLED'].includes(po.status),
        created_at: po.created_at,
      }
    })

    const stats = {
      total_payable: items.filter(i => i.status !== 'RECEIVED').reduce((s, i) => s + i.total, 0),
      total_received: items.filter(i => i.status === 'RECEIVED').reduce((s, i) => s + i.total, 0),
      overdue_count: items.filter(i => i.overdue).length,
      pending_approval: items.filter(i => i.status === 'PENDING_APPROVAL').length,
    }

    return NextResponse.json({ items, stats })
  } catch (err: unknown) {
    console.error('[Payables]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
