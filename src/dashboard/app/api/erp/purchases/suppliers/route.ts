import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [suppRes, evalRes, poRes] = await Promise.all([
      supabase.from('approved_suppliers').select('*').eq('tenant_id', tenant_id).order('name'),
      supabase.from('supplier_evaluations').select('supplier_id, score_total, score_precio, score_calidad, score_tiempo, evaluated_at').eq('tenant_id', tenant_id).order('evaluated_at', { ascending: false }),
      supabase.from('purchase_orders').select('supplier_id, total_estimate, status').eq('tenant_id', tenant_id),
    ])

    const suppliers = suppRes.data || []
    const evals = evalRes.data || []
    const orders = poRes.data || []

    // Latest eval per supplier
    const latestEval = new Map<string, typeof evals[0]>()
    for (const e of evals) {
      if (!latestEval.has(e.supplier_id)) latestEval.set(e.supplier_id, e)
    }

    // Total purchases per supplier
    const totalBySupplier = new Map<string, number>()
    for (const po of orders) {
      if (po.supplier_id) {
        totalBySupplier.set(po.supplier_id, (totalBySupplier.get(po.supplier_id) ?? 0) + Number(po.total_estimate))
      }
    }

    const items = suppliers.map(s => {
      const ev = latestEval.get(s.id)
      const total = totalBySupplier.get(s.id) ?? 0
      const score = ev?.score_total ?? 0
      return {
        id: s.id,
        name: s.name,
        email: s.contact_email,
        phone: s.contact_phone,
        categories: s.categories ?? [],
        active: s.active,
        score_total: score,
        score_precio: ev?.score_precio ?? 0,
        score_calidad: ev?.score_calidad ?? 0,
        score_tiempo: ev?.score_tiempo ?? 0,
        incumplimientos: s.incumplimientos_90_dias ?? 0,
        total_purchased: total,
        grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D',
        last_evaluation: ev?.evaluated_at ?? null,
        created_at: s.created_at,
      }
    }).sort((a, b) => b.score_total - a.score_total)

    return NextResponse.json({
      suppliers: items,
      stats: {
        total: items.length,
        active: items.filter(s => s.active).length,
        grade_a: items.filter(s => s.grade === 'A').length,
        avg_score: items.length ? Math.round(items.reduce((s, i) => s + i.score_total, 0) / items.length) : 0,
        total_purchased: items.reduce((s, i) => s + i.total_purchased, 0),
      },
    })
  } catch (err: unknown) {
    console.error('[Suppliers]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
