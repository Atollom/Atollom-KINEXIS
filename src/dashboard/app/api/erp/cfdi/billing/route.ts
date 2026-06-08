import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: records, error } = await supabase
      .from('cfdi_records')
      .select('id, folio, series, uuid, receptor_name, receptor_rfc, total, status, type, issued_at, xml_url, pdf_url')
      .eq('tenant_id', tenant_id)
      .order('issued_at', { ascending: false })
      .limit(200)

    if (error) throw error

    const invoices = (records || []).map(r => ({
      id: r.id,
      folio: r.folio ?? String(r.id).slice(0, 6),
      series: r.series ?? null,
      uuid: r.uuid ?? null,
      receptor_name: r.receptor_name ?? 'Sin nombre',
      receptor_rfc: r.receptor_rfc ?? 'XAXX010101000',
      total: Number(r.total ?? 0),
      status: (r.status === 'cancelled' ? 'cancelled' : r.uuid ? 'valid' : 'pending') as 'valid' | 'cancelled' | 'pending',
      type: r.type ?? 'I',
      issued_at: r.issued_at,
      xml_url: r.xml_url ?? null,
      pdf_url: r.pdf_url ?? null,
    }))

    const totalInvoiced = invoices.filter(i => i.status === 'valid').reduce((s, i) => s + i.total, 0)

    return NextResponse.json({
      invoices,
      stats: {
        total: invoices.length,
        valid: invoices.filter(i => i.status === 'valid').length,
        cancelled: invoices.filter(i => i.status === 'cancelled').length,
        pending: invoices.filter(i => i.status === 'pending').length,
        total_invoiced: totalInvoiced,
      },
    })
  } catch (err: unknown) {
    console.error('[CFDI Billing]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
