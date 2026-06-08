import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    // Orders that are delivered but may not have been invoiced (accounts receivable)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, external_id, platform, status, customer_name, customer_rfc, total, shipping_cost, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .in('status', ['APPROVED', 'SENT', 'DELIVERED'])
      .order('created_at', { ascending: false })

    if (error) throw error

    // CFDIs already issued (paid/invoiced)
    const { data: cfdis } = await supabase
      .from('cfdi_records')
      .select('order_id, total, status, timbrado_at')
      .eq('tenant_id', tenant_id)
      .eq('status', 'TIMBRADO')

    const invoicedOrderIds = new Set((cfdis || []).map(c => c.order_id).filter(Boolean))

    const items = (orders || []).map(o => {
      const isInvoiced = invoicedOrderIds.has(o.external_id) || invoicedOrderIds.has(o.id)
      const daysPending = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000)
      return {
        id: o.id,
        folio: o.external_id || o.id.slice(0, 8).toUpperCase(),
        platform: o.platform,
        customer: o.customer_name || 'Sin nombre',
        rfc: o.customer_rfc || '—',
        total: Number(o.total) || 0,
        status: o.status,
        invoiced: isInvoiced,
        days_pending: daysPending,
        overdue: daysPending > 30,
        created_at: o.created_at,
      }
    })

    const stats = {
      total_receivable: items.filter(i => !i.invoiced).reduce((s, i) => s + i.total, 0),
      total_invoiced: items.filter(i => i.invoiced).reduce((s, i) => s + i.total, 0),
      overdue_count: items.filter(i => i.overdue && !i.invoiced).length,
      pending_count: items.filter(i => !i.invoiced).length,
    }

    return NextResponse.json({ items, stats })
  } catch (err: unknown) {
    console.error('[Receivables]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
