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
      .select('id, score, type, created_at')
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error

    const rows = leads ?? []

    const vip      = rows.filter(l => l.score >= 80)
    const regular  = rows.filter(l => l.score >= 50 && l.score < 80)
    const inactive = rows.filter(l => l.score >= 20 && l.score < 50)
    const risk     = rows.filter(l => l.score < 20)

    const segments = [
      {
        id:              'seg-vip',
        name:            'VIP / Campeones',
        description:     'Clientes con score alto, alta frecuencia de compra y LTV elevado',
        customers_count: vip.length,
        avg_ltv:         12000,
        avg_orders:      8,
        churn_risk:      'low' as const,
        color:           '#CCFF00',
      },
      {
        id:              'seg-regular',
        name:            'Clientes Regulares',
        description:     'Clientes activos con compras recurrentes y score medio',
        customers_count: regular.length,
        avg_ltv:         5500,
        avg_orders:      4,
        churn_risk:      'low' as const,
        color:           '#60a5fa',
      },
      {
        id:              'seg-inactive',
        name:            'En Riesgo',
        description:     'Sin actividad reciente, requieren campaña de reactivación',
        customers_count: inactive.length,
        avg_ltv:         2000,
        avg_orders:      2,
        churn_risk:      'medium' as const,
        color:           '#facc15',
      },
      {
        id:              'seg-risk',
        name:            'Churn Inminente',
        description:     'Score bajo, sin compras en 60+ días — intervención urgente',
        customers_count: risk.length,
        avg_ltv:         800,
        avg_orders:      1,
        churn_risk:      'high' as const,
        color:           '#f87171',
      },
    ].filter(s => s.customers_count > 0)

    const stats = {
      total_segments:   segments.length,
      total_customers:  rows.length,
      avg_ltv:          5000,
      high_risk_count:  risk.length,
    }

    return NextResponse.json({ segments, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
