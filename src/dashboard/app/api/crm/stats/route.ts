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
      .select('id, name, company, deal_stage, estimated_value, score, updated_at, created_at')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const all = leads || []
    const active = all.filter(l => !['won', 'lost'].includes(l.deal_stage ?? ''))
    const won = all.filter(l => l.deal_stage === 'won')

    const pipeline = active.reduce((s, l) => s + Number(l.estimated_value ?? 0), 0)
    const total = all.length
    const close_rate = total > 0 ? Math.round((won.length / total) * 100) : 0

    const stage_counts: Record<string, number> = {}
    const stage_values: Record<string, number> = {}
    for (const l of all) {
      const stage = l.deal_stage ?? 'new'
      stage_counts[stage] = (stage_counts[stage] ?? 0) + 1
      stage_values[stage] = (stage_values[stage] ?? 0) + Number(l.estimated_value ?? 0)
    }

    const recent_activity = all.slice(0, 6).map(l => ({
      id: l.id,
      name: l.name ?? 'Sin nombre',
      company: l.company ?? 'Individual',
      stage: l.deal_stage ?? 'new',
      value: Number(l.estimated_value ?? 0),
      updated_at: l.updated_at,
    }))

    return NextResponse.json({
      active_leads: active.length,
      pipeline_value: pipeline,
      close_rate,
      won_count: won.length,
      total_leads: total,
      stage_counts,
      stage_values,
      recent_activity,
    })
  } catch (err: unknown) {
    console.error('[CRM Stats]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
