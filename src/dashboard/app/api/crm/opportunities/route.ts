import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, company, source, score, deal_stage, estimated_value, updated_at, created_at')
      .eq('tenant_id', tenant_id)
      .in('deal_stage', ['contacted', 'quote_sent', 'negotiating'])
      .order('score', { ascending: false })

    if (error) throw error

    const stageWeights: Record<string, number> = {
      contacted: 0.15, quote_sent: 0.45, negotiating: 0.75,
    }
    const stageLabels: Record<string, string> = {
      contacted: 'Contactado', quote_sent: 'Cotización Enviada', negotiating: 'Negociando',
    }

    const opportunities = (leads || []).map(l => {
      const weight = stageWeights[l.deal_stage ?? ''] ?? 0.1
      const value = Number(l.estimated_value ?? 0)
      const daysSinceUpdate = Math.floor((Date.now() - new Date(l.updated_at).getTime()) / 86400000)
      return {
        id: l.id,
        name: l.name ?? 'Sin nombre',
        company: l.company ?? 'Individual',
        channel: l.source ?? 'web',
        score: l.score ?? 0,
        stage: l.deal_stage,
        stage_label: stageLabels[l.deal_stage ?? ''] ?? l.deal_stage,
        value,
        weighted_value: Math.round(value * weight),
        close_probability: Math.round(weight * 100),
        days_stale: daysSinceUpdate,
        at_risk: daysSinceUpdate > 14,
        created_at: l.created_at,
        updated_at: l.updated_at,
      }
    })

    const pipeline = opportunities.reduce((s, o) => s + o.value, 0)
    const weighted = opportunities.reduce((s, o) => s + o.weighted_value, 0)

    return NextResponse.json({
      opportunities,
      stats: {
        total: opportunities.length,
        pipeline_value: pipeline,
        weighted_value: weighted,
        at_risk: opportunities.filter(o => o.at_risk).length,
        by_stage: {
          contacted: opportunities.filter(o => o.stage === 'contacted').length,
          quote_sent: opportunities.filter(o => o.stage === 'quote_sent').length,
          negotiating: opportunities.filter(o => o.stage === 'negotiating').length,
        },
      },
    })
  } catch (err: unknown) {
    console.error('[Opportunities]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
