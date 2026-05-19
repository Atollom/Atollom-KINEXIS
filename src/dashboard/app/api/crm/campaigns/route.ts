import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Derive campaign metrics from NPS surveys (closest analog to email campaigns)
    const { data: nps, error } = await supabase
      .from('nps_responses')
      .select('id, score, sent_at, responded_at')
      .eq('tenant_id', auth.tenant_id)
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const rows = nps ?? []
    const responded = rows.filter(r => r.responded_at !== null)

    // Map NPS surveys → campaign-like entries
    const campaigns = rows.length > 0
      ? [{
          id:          'nps-campaign-1',
          subject:     'Encuesta de Satisfacción — NPS',
          segment:     'Todos los clientes',
          status:      'sent' as const,
          sent_count:  rows.length,
          open_rate:   responded.length > 0 ? Math.round((responded.length / rows.length) * 100) : 0,
          click_rate:  0,
          revenue:     0,
          sent_at:     rows[0]?.sent_at ?? null,
        }]
      : []

    const stats = {
      total:           campaigns.length,
      sent:            campaigns.filter(c => c.status === 'sent').length,
      draft:           0,
      scheduled:       0,
      avg_open_rate:   campaigns.length > 0 ? campaigns[0].open_rate : 0,
      avg_click_rate:  0,
      total_revenue:   0,
    }

    return NextResponse.json({ campaigns, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
