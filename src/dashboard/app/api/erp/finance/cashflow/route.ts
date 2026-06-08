import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  try {
    const [ordersResult, posResult] = await Promise.allSettled([
      supabase
        .from('orders')
        .select('id, total, status, created_at')
        .eq('tenant_id', auth.tenant_id)
        .gte('created_at', sixtyDaysAgo),
      supabase
        .from('purchase_orders')
        .select('id, total_amount, status, created_at, expected_delivery_date')
        .eq('tenant_id', auth.tenant_id)
        .gte('created_at', sixtyDaysAgo),
    ])

    const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data ?? []) : []
    const purchaseOrders = posResult.status === 'fulfilled' ? (posResult.value.data ?? []) : []

    const inflows = orders
      .filter((o: { status: string; created_at: string }) =>
        ['DELIVERED', 'delivered', 'completed', 'shipped'].includes(o.status) &&
        o.created_at >= thirtyDaysAgo
      )
      .reduce((sum: number, o: { total: number }) => sum + (o.total ?? 0), 0)

    const outflows = purchaseOrders
      .filter((po: { status: string; created_at: string }) =>
        ['approved', 'sent', 'received', 'APPROVED', 'SENT', 'RECEIVED'].includes(po.status) &&
        po.created_at >= thirtyDaysAgo
      )
      .reduce((sum: number, po: { total_amount: number }) => sum + (po.total_amount ?? 0), 0)

    const days: { date: string; inflow: number; outflow: number; balance: number }[] = []
    let runningBalance = 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)

      const dayInflow = orders
        .filter((o: { status: string; created_at: string }) =>
          ['DELIVERED', 'delivered', 'completed', 'shipped'].includes(o.status) &&
          o.created_at.slice(0, 10) === dateStr
        )
        .reduce((sum: number, o: { total: number }) => sum + (o.total ?? 0), 0)

      const dayOutflow = purchaseOrders
        .filter((po: { status: string; created_at: string }) =>
          ['approved', 'sent', 'received', 'APPROVED', 'SENT', 'RECEIVED'].includes(po.status) &&
          po.created_at.slice(0, 10) === dateStr
        )
        .reduce((sum: number, po: { total_amount: number }) => sum + (po.total_amount ?? 0), 0)

      runningBalance += dayInflow - dayOutflow
      days.push({ date: dateStr, inflow: dayInflow, outflow: dayOutflow, balance: runningBalance })
    }

    const upcoming_payables = purchaseOrders
      .filter((po: { status: string; expected_delivery_date: string | null }) =>
        ['approved', 'APPROVED'].includes(po.status) && po.expected_delivery_date
      )
      .map((po: { id: string; total_amount: number; expected_delivery_date: string }) => ({
        id: po.id,
        amount: po.total_amount,
        due_date: po.expected_delivery_date,
      }))
      .slice(0, 10)

    return NextResponse.json({
      inflows_30d: inflows,
      outflows_30d: outflows,
      net_30d: inflows - outflows,
      current_balance: runningBalance,
      daily_cashflow: days,
      upcoming_payables,
    })
  } catch (err: unknown) {
    console.error('[Cashflow]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
