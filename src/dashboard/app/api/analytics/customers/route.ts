import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [leadsRes, b2bRes] = await Promise.all([
      supabase.from('leads').select('id, name, company, source, score, deal_stage, estimated_value, created_at').eq('tenant_id', tenant_id).order('score', { ascending: false }),
      supabase.from('b2b_accounts').select('id, name, industry, contact_name, contact_email, monthly_volume, status, created_at').eq('tenant_id', tenant_id).order('monthly_volume', { ascending: false }),
    ])

    const leads = leadsRes.data ?? []
    const b2b = b2bRes.data ?? []

    const sourceBreakdown: Record<string, number> = {}
    for (const l of leads) {
      const src = l.source ?? 'web'
      sourceBreakdown[src] = (sourceBreakdown[src] ?? 0) + 1
    }

    const stageBreakdown: Record<string, number> = {}
    for (const l of leads) {
      const st = l.deal_stage ?? 'new'
      stageBreakdown[st] = (stageBreakdown[st] ?? 0) + 1
    }

    const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / leads.length) : 0
    const hotLeads = leads.filter(l => (l.score ?? 0) >= 70).length

    return NextResponse.json({
      leads: leads.slice(0, 50).map(l => ({
        id: l.id,
        name: l.name ?? 'Sin nombre',
        company: l.company ?? 'Individual',
        source: l.source ?? 'web',
        score: l.score ?? 0,
        stage: l.deal_stage ?? 'new',
        value: Number(l.estimated_value ?? 0),
        created_at: l.created_at,
      })),
      b2b: b2b.slice(0, 20).map(a => ({
        id: a.id,
        name: a.name,
        industry: a.industry,
        contact: a.contact_name,
        email: a.contact_email,
        monthly_volume: Number(a.monthly_volume ?? 0),
        status: a.status,
        created_at: a.created_at,
      })),
      stats: {
        total_leads: leads.length,
        hot_leads: hotLeads,
        avg_score: avgScore,
        by_source: sourceBreakdown,
        by_stage: stageBreakdown,
        b2b_accounts: b2b.length,
        b2b_active: b2b.filter(a => a.status === 'active').length,
      },
    })
  } catch (err: unknown) {
    console.error('[Analytics Customers]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
