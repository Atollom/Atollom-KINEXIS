import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [wonRes, quotesRes] = await Promise.all([
      supabase.from('leads').select('id, name, company, source, score, estimated_value, updated_at').eq('tenant_id', tenant_id).eq('deal_stage', 'won').order('updated_at', { ascending: false }),
      supabase.from('quotes').select('id, quote_number, lead_id, total, status, created_at').eq('tenant_id', tenant_id).in('status', ['accepted']).order('created_at', { ascending: false }),
    ])

    const leads = wonRes.data || []
    const quotes = quotesRes.data || []
    const quotesByLead = new Map(quotes.map(q => [q.lead_id, q]))

    const deals = leads.map(l => {
      const quote = quotesByLead.get(l.id)
      return {
        id: l.id,
        name: l.name ?? 'Sin nombre',
        company: l.company ?? 'Individual',
        channel: l.source ?? 'web',
        score: l.score ?? 0,
        value: Number(l.estimated_value ?? quote?.total ?? 0),
        quote_number: quote?.quote_number ?? null,
        closed_at: l.updated_at,
      }
    })

    const totalRevenue = deals.reduce((s, d) => s + d.value, 0)
    const avgDealSize = deals.length ? Math.round(totalRevenue / deals.length) : 0

    return NextResponse.json({
      deals,
      stats: {
        total: deals.length,
        total_revenue: totalRevenue,
        avg_deal_size: avgDealSize,
        this_month: deals.filter(d => new Date(d.closed_at) >= new Date(new Date().setDate(1))).length,
      },
    })
  } catch (err: unknown) {
    console.error('[Deals]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
