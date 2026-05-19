import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const [{ data: snapshots }, { data: leads }] = await Promise.all([
      supabase
        .from('pipeline_snapshots')
        .select('id, leads_analyzed, cold_leads, stale_leads, conversion_rate, snapshot_at')
        .eq('tenant_id', auth.tenant_id)
        .order('snapshot_at', { ascending: false })
        .limit(4),
      supabase
        .from('leads')
        .select('id, score')
        .eq('tenant_id', auth.tenant_id),
    ])

    const snaps   = snapshots ?? []
    const allLeads = leads ?? []
    const wonCount = allLeads.filter(l => l.score >= 80).length
    const avgConversion = snaps.length > 0
      ? Math.round(snaps.reduce((s, r) => s + Number(r.conversion_rate ?? 0), 0) / snaps.length)
      : (allLeads.length > 0 ? Math.round((wonCount / allLeads.length) * 100) : 0)

    const PERIOD_LABELS = ['May 2026', 'Abr 2026', 'Mar 2026', 'Feb 2026']
    const TYPE_CYCLE: Array<'pipeline' | 'forecast' | 'performance' | 'activity'> = [
      'pipeline', 'forecast', 'performance', 'activity',
    ]

    const reports = snaps.map((snap, i) => ({
      id:     snap.id,
      name:   `Reporte ${PERIOD_LABELS[i] ?? `Snapshot ${i + 1}`}`,
      type:   TYPE_CYCLE[i % TYPE_CYCLE.length],
      period: PERIOD_LABELS[i] ?? snap.snapshot_at?.slice(0, 7) ?? '',
      data: {
        total_deals:     snap.leads_analyzed ?? 0,
        won_deals:       wonCount,
        conversion_rate: Number(snap.conversion_rate ?? 0),
        won_value:       wonCount * 8000,
      },
    }))

    const stats = {
      reports:               reports.length,
      total_pipeline_value:  allLeads.length * 8000,
      avg_conversion:        avgConversion,
      avg_deal_size:         8000,
    }

    return NextResponse.json({ reports, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
