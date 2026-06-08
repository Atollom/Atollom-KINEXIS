import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [ordersRes, cfdiRes, movRes] = await Promise.all([
      supabase.from('orders').select('id, external_id, platform, total, status, customer_name, created_at').eq('tenant_id', tenant_id).order('created_at', { ascending: false }).limit(30),
      supabase.from('cfdi_records').select('id, folio, total, iva, subtotal, customer_name, cfdi_type, timbrado_at, status').eq('tenant_id', tenant_id).order('timbrado_at', { ascending: false }).limit(20),
      supabase.from('inventory_movements').select('id, sku, movement_type, qty_change, platform, created_at').eq('tenant_id', tenant_id).order('created_at', { ascending: false }).limit(20),
    ])

    const entries: {
      id: string; date: string; type: string; description: string;
      debit: number; credit: number; reference: string; source: string
    }[] = []

    for (const o of (ordersRes.data || [])) {
      entries.push({
        id: o.id,
        date: o.created_at,
        type: 'Venta',
        description: `Venta ${o.platform.toUpperCase()} — ${o.customer_name || 'Cliente'}`,
        debit: Number(o.total),
        credit: 0,
        reference: o.external_id || o.id.slice(0, 8),
        source: 'orders',
      })
    }

    for (const c of (cfdiRes.data || [])) {
      entries.push({
        id: c.id,
        date: c.timbrado_at || '',
        type: c.cfdi_type === 'E' ? 'Nota de Crédito' : 'Factura',
        description: `CFDI ${c.folio || c.id.slice(0, 8)} — ${c.customer_name}`,
        debit: 0,
        credit: Number(c.total),
        reference: c.folio || c.id.slice(0, 8),
        source: 'cfdi',
      })
    }

    for (const m of (movRes.data || [])) {
      if (m.movement_type === 'sale') {
        entries.push({
          id: m.id,
          date: m.created_at,
          type: 'Salida Inventario',
          description: `Salida SKU ${m.sku} — ${Math.abs(m.qty_change)} uds`,
          debit: 0,
          credit: 0,
          reference: m.sku,
          source: 'inventory',
        })
      }
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ entries: entries.slice(0, 50) })
  } catch (err: unknown) {
    console.error('[Journal]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
