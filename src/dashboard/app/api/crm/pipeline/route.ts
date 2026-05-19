import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, email, phone, source, score, type, created_at')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const rows = leads ?? []

    // Map leads → deal format expected by the pipeline Kanban UI
    const deals = rows.map(l => {
      let stage: string
      if (l.score >= 80)      stage = 'negotiation'
      else if (l.score >= 60) stage = 'proposal'
      else if (l.score >= 40) stage = 'qualified'
      else                    stage = 'lead'

      return {
        id:                  l.id,
        title:               l.name ?? 'Lead sin nombre',
        company:             l.name ?? '',
        value:               l.score * 500,
        stage,
        probability:         l.score,
        source:              (l.source ?? 'website') as string,
        expected_close_date: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        contact: {
          name:  l.name ?? '',
          email: l.email ?? '',
          phone: l.phone ?? '',
        },
        notes: null,
      }
    })

    const total_pipeline_value = deals.reduce((s, d) => s + d.value, 0)
    const won  = deals.filter(d => d.stage === 'closed_won')
    const stats = {
      total_deals:          deals.length,
      total_pipeline_value,
      won_value_month:      won.reduce((s, d) => s + d.value, 0),
      conversion_rate:      deals.length > 0
        ? Math.round((won.length / deals.length) * 100)
        : 0,
    }

    return NextResponse.json({ deals, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
