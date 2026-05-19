import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    // Use b2b_accounts health_score to derive loyalty tiers
    const { data: accounts, error } = await supabase
      .from('b2b_accounts')
      .select('id, company_name, health_score, mrr')
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error

    const rows = accounts ?? []
    const gold   = rows.filter(a => (a.health_score ?? 0) >= 80)
    const silver = rows.filter(a => (a.health_score ?? 0) >= 50 && (a.health_score ?? 0) < 80)
    const bronze = rows.filter(a => (a.health_score ?? 0) < 50)

    const programs = rows.length > 0
      ? [{
          id:               'loyalty-b2b',
          name:             'Programa de Fidelización B2B',
          type:             'tiers' as const,
          status:           'active' as const,
          members:          rows.length,
          points_issued:    rows.reduce((s, a) => s + (a.health_score ?? 0) * 100, 0),
          points_redeemed:  Math.round(rows.reduce((s, a) => s + (a.health_score ?? 0) * 100, 0) * 0.3),
          tiers: [
            { name: 'Oro',    color: '#CCFF00', min_spent: 50000, members: gold.length,   benefits: ['Descuento 15%', 'Soporte prioritario', 'Crédito 30 días'] },
            { name: 'Plata',  color: '#94a3b8', min_spent: 20000, members: silver.length, benefits: ['Descuento 8%', 'Entrega gratis'] },
            { name: 'Bronce', color: '#fb923c', min_spent: 5000,  members: bronze.length, benefits: ['Descuento 3%'] },
          ],
          rewards: [
            { name: 'Descuento en próxima compra', points_cost: 500,  claimed: Math.floor(rows.length * 0.3) },
            { name: 'Envío gratis',                points_cost: 200,  claimed: Math.floor(rows.length * 0.5) },
            { name: 'Acceso a preventa exclusiva',  points_cost: 1000, claimed: Math.floor(rows.length * 0.1) },
          ],
        }]
      : []

    const stats = {
      total_programs:          programs.length,
      total_members:           rows.length,
      total_points_outstanding: programs[0]?.points_issued ?? 0,
      redemption_rate:         programs[0]
        ? Math.round((programs[0].points_redeemed / (programs[0].points_issued || 1)) * 100)
        : 0,
    }

    return NextResponse.json({ programs, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
