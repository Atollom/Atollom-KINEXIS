import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { data: responses, error } = await supabase
      .from('nps_responses')
      .select('id, score, comment, created_at, category')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ responses: [], nps_score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 })
    }

    const rows = responses ?? []
    const promoters = rows.filter(r => r.score >= 9).length
    const passives = rows.filter(r => r.score >= 7 && r.score < 9).length
    const detractors = rows.filter(r => r.score < 7).length
    const total = rows.length
    const nps_score = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0

    return NextResponse.json({ responses: rows, nps_score, promoters, passives, detractors, total })
  } catch (err: unknown) {
    console.error('[NPS]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
