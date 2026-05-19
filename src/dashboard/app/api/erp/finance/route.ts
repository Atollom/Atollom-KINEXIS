import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'month'

  const now = new Date()
  const periodStart = new Date(now)
  periodStart.setDate(period === 'month' ? 1 : now.getDate() - 7)

  try {
    const [snapRes, ordersRes, poRes, prevSnapRes] = await Promise.all([
      // Latest finance snapshot
      supabase
        .from('finance_snapshots')
        .select('revenue, costs, gross_margin, cash_balance, projection_30d, alerts, period_start')
        .eq('tenant_id', auth.tenant_id)
        .gte('period_start', periodStart.toISOString().slice(0, 10))
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // AR: orders that are not yet delivered (accounts receivable)
      supabase
        .from('orders')
        .select('id, total, created_at, status, platform')
        .eq('tenant_id', auth.tenant_id)
        .not('status', 'in', '("DELIVERED","CANCELLED")')
        .order('created_at', { ascending: true }),

      // AP: purchase orders pending/approved (accounts payable)
      supabase
        .from('purchase_orders')
        .select('id, supplier_id, total_estimate, status, created_at, approved_suppliers(name)')
        .eq('tenant_id', auth.tenant_id)
        .not('status', 'in', '("RECEIVED","REJECTED")')
        .order('created_at', { ascending: false })
        .limit(20),

      // Previous period snapshot for growth calc
      supabase
        .from('finance_snapshots')
        .select('revenue')
        .eq('tenant_id', auth.tenant_id)
        .lt('period_start', periodStart.toISOString().slice(0, 10))
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const snap     = snapRes.data
    const orders   = ordersRes.data ?? []
    const pos      = poRes.data ?? []
    const prevSnap = prevSnapRes.data

    const revenue  = Number(snap?.revenue ?? 0)
    const expenses = Number(snap?.costs ?? 0)
    const profit   = Number(snap?.gross_margin ?? revenue - expenses)
    const cash     = Number(snap?.cash_balance ?? profit)
    const prevRev  = Number(prevSnap?.revenue ?? 0)
    const growth   = prevRev > 0
      ? Math.round(((revenue - prevRev) / prevRev) * 1000) / 10
      : 0

    // AR aging — group by days overdue
    const arAging = buildARaging(orders)

    // AP summary — map purchase orders
    const apSummary = pos.map(po => {
      const sup = po.approved_suppliers as unknown
      const supplierName = Array.isArray(sup)
        ? ((sup[0] as { name?: string })?.name ?? 'Proveedor')
        : ((sup as { name?: string } | null)?.name ?? 'Proveedor')

      const createdAt = new Date(po.created_at ?? Date.now())
      const dueDate   = new Date(createdAt.getTime() + 30 * 86_400_000)
      const isOverdue = dueDate < now && po.status !== 'RECEIVED'

      return {
        supplier: supplierName,
        amount:   Number(po.total_estimate ?? 0),
        status:   isOverdue ? 'overdue' : po.status === 'PENDING_APPROVAL' ? 'pending' : 'scheduled',
        due:      dueDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      }
    })

    const arTotal = arAging.reduce((s, a) => s + a.amount, 0)
    const apTotal = apSummary.reduce((s, a) => s + a.amount, 0)

    return NextResponse.json({
      revenue_mtd:    revenue,
      expenses_mtd:   expenses,
      profit_mtd:     profit,
      profit_margin:  revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0,
      ar_total:       arTotal,
      ap_total:       apTotal,
      cash_balance:   cash,
      burn_rate:      expenses,
      growth_vs_prev: growth,
      alerts:         (snap?.alerts as string[]) ?? [],
      ar_aging:       arAging,
      ap_summary:     apSummary,
      source:         snap ? 'supabase' : 'mock',
    })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 })
  }
}

function buildARaging(orders: Array<{ total: unknown; created_at: unknown }>) {
  const now = Date.now()
  const buckets = [
    { range: '0-30 días',  min: 0,   max: 30,  amount: 0, count: 0 },
    { range: '31-60 días', min: 31,  max: 60,  amount: 0, count: 0 },
    { range: '61-90 días', min: 61,  max: 90,  amount: 0, count: 0 },
    { range: '>90 días',   min: 91,  max: 9999, amount: 0, count: 0 },
  ]

  for (const o of orders) {
    const days = Math.floor((now - new Date(String(o.created_at ?? '')).getTime()) / 86_400_000)
    const amt  = Number(o.total ?? 0)
    for (const b of buckets) {
      if (days >= b.min && days <= b.max) {
        b.amount += amt
        b.count  += 1
        break
      }
    }
  }

  return buckets.filter(b => b.count > 0)
}
