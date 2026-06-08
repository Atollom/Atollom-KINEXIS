import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: labels, error } = await supabase
      .from('skydrop_labels')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const items = (labels || []).map(l => ({
      id: l.id,
      tracking: l.tracking_number,
      carrier: l.carrier ?? 'Skydropx',
      order_ref: l.shopify_order_id ?? '—',
      label_url: l.label_url ?? null,
      shipment_id: l.shipment_id,
      expires_at: l.expires_at,
      expired: l.expires_at ? new Date(l.expires_at) < new Date() : false,
      created_at: l.created_at,
    }))

    const byCarrier: Record<string, number> = {}
    for (const i of items) {
      byCarrier[i.carrier] = (byCarrier[i.carrier] ?? 0) + 1
    }

    return NextResponse.json({
      shipments: items,
      stats: {
        total: items.length,
        active: items.filter(i => !i.expired).length,
        by_carrier: byCarrier,
      },
    })
  } catch (err: unknown) {
    console.error('[Logistics Shipping]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
