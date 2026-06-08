import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('id, lead_id, total_amount, status, items, created_at, updated_at')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ quotes: [], stats: { total: 0, pending: 0, total_sent: 0, total_accepted: 0, acceptance_rate: 0 } })
    }

    const rows = quotes ?? []
    const total_sent = rows.filter(q => q.status === 'sent').reduce((s, q) => s + (q.total_amount ?? 0), 0)
    const total_accepted = rows.filter(q => q.status === 'accepted').reduce((s, q) => s + (q.total_amount ?? 0), 0)
    const acceptance_rate = rows.length > 0
      ? Math.round((rows.filter(q => q.status === 'accepted').length / rows.length) * 100)
      : 0

    return NextResponse.json({
      quotes: rows,
      stats: {
        total: rows.length,
        pending: rows.filter(q => ['draft', 'sent'].includes(q.status)).length,
        total_sent,
        total_accepted,
        acceptance_rate,
      },
    })
  } catch (err: unknown) {
    console.error('[Quotes]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
