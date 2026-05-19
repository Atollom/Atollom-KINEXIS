import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, external_id, platform, status, customer_name, total, created_at')
    .eq('tenant_id', auth.tenant_id)
    .in('status', ['APPROVED', 'DRAFT'])
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Error consultando órdenes' }, { status: 500 })

  const rows = orders ?? []
  const byStatus: Record<string, number> = {}
  for (const o of rows) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1
  }

  return NextResponse.json({
    orders: rows,
    stats: {
      total_pending: rows.length,
      by_status: byStatus,
      by_platform: rows.reduce((acc: Record<string, number>, o) => {
        acc[o.platform] = (acc[o.platform] ?? 0) + 1
        return acc
      }, {}),
    },
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (!['owner', 'admin', 'agente', 'almacenista'].includes(auth.role)) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  try {
    const { order_id, status } = await req.json() as { order_id: string; status: string }
    const allowed = ['DRAFT', 'APPROVED', 'SENT', 'DELIVERED', 'CANCELLED']
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order_id)
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Fulfillment PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
