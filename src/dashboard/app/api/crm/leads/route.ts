import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth
    const { searchParams } = new URL(req.url)
    const stage = searchParams.get('stage')

    let query = supabase
      .from('leads')
      .select('id, name, company, source, score, deal_stage, estimated_value, notes, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('score', { ascending: false })

    if (stage && stage !== 'all') {
      query = query.eq('deal_stage', stage)
    }

    const { data: leads, error } = await query.limit(200)
    if (error) throw error

    const items = (leads || []).map(l => ({
      id: l.id,
      name: l.name ?? 'Sin nombre',
      company: l.company ?? 'Individual',
      source: l.source ?? 'web',
      score: l.score ?? 0,
      stage: l.deal_stage ?? 'new',
      estimated_value: Number(l.estimated_value ?? 0),
      notes: l.notes ?? null,
      created_at: l.created_at,
      updated_at: l.updated_at,
    }))

    return NextResponse.json({ leads: items, total: items.length })
  } catch (err: unknown) {
    console.error('[CRM Leads]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
