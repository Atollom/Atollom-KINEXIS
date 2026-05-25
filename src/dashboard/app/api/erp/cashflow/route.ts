import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

const MONTH_LABELS: Record<number, { short: string; label: string }> = {
  0:  { short: 'Ene', label: 'Enero' },
  1:  { short: 'Feb', label: 'Febrero' },
  2:  { short: 'Mar', label: 'Marzo' },
  3:  { short: 'Abr', label: 'Abril' },
  4:  { short: 'May', label: 'Mayo' },
  5:  { short: 'Jun', label: 'Junio' },
  6:  { short: 'Jul', label: 'Julio' },
  7:  { short: 'Ago', label: 'Agosto' },
  8:  { short: 'Sep', label: 'Septiembre' },
  9:  { short: 'Oct', label: 'Octubre' },
  10: { short: 'Nov', label: 'Noviembre' },
  11: { short: 'Dic', label: 'Diciembre' },
}

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  try {
    const [ordersRes, snapRes] = await Promise.all([
      supabase
        .from('orders')
        .select('total, created_at')
        .eq('tenant_id', auth.tenant_id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .not('status', 'eq', 'CANCELLED'),
      supabase
        .from('finance_snapshots')
        .select('revenue, costs, cash_balance, period_start')
        .eq('tenant_id', auth.tenant_id)
        .gte('period_start', sixMonthsAgo.toISOString().slice(0, 10))
        .order('period_start', { ascending: false })
        .limit(6),
    ])

    const orders = ordersRes.data ?? []
    const snaps = snapRes.data ?? []

    // Build month buckets for the last 3 months (real) + 3 future months (forecast)
    const months = []
    let runningBalance = 0

    for (let i = -5; i <= 0; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const isForecast = i > -3  // last 3 months are "real", next 3 are forecast

      // Try to find a finance snapshot for this month
      const snapKey = `${y}-${String(m + 1).padStart(2, '0')}`
      const snap = snaps.find(s => s.period_start?.startsWith(snapKey))

      let inflows: number
      let outflows: number

      if (snap) {
        inflows = Number(snap.revenue ?? 0)
        outflows = Number(snap.costs ?? 0)
      } else {
        // Aggregate orders for this month
        const monthOrders = orders.filter(o => {
          const od = new Date(o.created_at)
          return od.getFullYear() === y && od.getMonth() === m
        })
        inflows = monthOrders.reduce((s, o) => s + Number(o.total ?? 0), 0)
        outflows = Math.round(inflows * 0.62)  // 62% expenses estimate
      }

      const net = inflows - outflows
      runningBalance += net

      months.push({
        month: MONTH_LABELS[m].short,
        label: MONTH_LABELS[m].label,
        inflows: Math.round(inflows),
        outflows: Math.round(outflows),
        net: Math.round(net),
        balance: Math.round(runningBalance),
        forecast: isForecast,
      })
    }

    // If all inflows are zero (no orders yet), return seeded data
    const totalInflows = months.reduce((s, m) => s + m.inflows, 0)
    if (totalInflows === 0) {
      return NextResponse.json(buildSeedData(), { headers: { 'X-Source': 'seed' } })
    }

    const currentBalance = months[months.length - 1]?.balance ?? 0
    const netValues = months.map(m => m.net)
    const avgNet = Math.round(netValues.reduce((s, v) => s + v, 0) / netValues.length)
    const minBalance = Math.min(...months.map(m => m.balance))
    const monthsPositive = months.filter(m => m.net >= 0).length

    return NextResponse.json({
      months,
      stats: {
        current_balance: currentBalance,
        avg_monthly_net: avgNet,
        min_balance: minBalance,
        months_positive: monthsPositive,
      },
      source: 'supabase',
    })
  } catch {
    return NextResponse.json(buildSeedData(), { headers: { 'X-Source': 'seed' } })
  }
}

function buildSeedData() {
  return {
    months: [
      { month: 'Mar', label: 'Marzo',  inflows: 456789, outflows: 312456, net: 144333, balance: 456789,  forecast: false },
      { month: 'Abr', label: 'Abril',  inflows: 478368, outflows: 336908, net: 141460, balance: 598249,  forecast: false },
      { month: 'May', label: 'Mayo',   inflows: 540257, outflows: 358775, net: 181482, balance: 779731,  forecast: false },
      { month: 'Jun', label: 'Junio',  inflows: 597000, outflows: 383000, net: 214000, balance: 993731,  forecast: true  },
      { month: 'Jul', label: 'Julio',  inflows: 620000, outflows: 395000, net: 225000, balance: 1218731, forecast: true  },
      { month: 'Ago', label: 'Agosto', inflows: 645000, outflows: 408000, net: 237000, balance: 1455731, forecast: true  },
    ],
    stats: {
      current_balance: 779731,
      avg_monthly_net: 190546,
      min_balance: 456789,
      months_positive: 6,
    },
    source: 'seed',
  }
}
