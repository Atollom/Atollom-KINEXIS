import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function getAuthenticatedTenant(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).single()
  return data ? { userId: user.id, tenantId: data.tenant_id, role: data.role } : null
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const tenant = await getAuthenticatedTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const [ordersResult, posResult] = await Promise.allSettled([
    supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('tenant_id', tenant.tenantId)
      .gte('created_at', sixtyDaysAgo),
    supabase
      .from('purchase_orders')
      .select('id, total_amount, status, created_at, expected_delivery_date')
      .eq('tenant_id', tenant.tenantId)
      .gte('created_at', sixtyDaysAgo),
  ])

  const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data ?? []) : []
  const purchaseOrders = posResult.status === 'fulfilled' ? (posResult.value.data ?? []) : []

  // Inflows = completed/delivered orders in last 30d
  const inflows = orders
    .filter((o: { status: string; created_at: string }) =>
      ['delivered', 'completed', 'shipped'].includes(o.status) &&
      o.created_at >= thirtyDaysAgo
    )
    .reduce((sum: number, o: { total: number }) => sum + (o.total ?? 0), 0)

  // Outflows = approved/sent purchase orders in last 30d
  const outflows = purchaseOrders
    .filter((po: { status: string; created_at: string }) =>
      ['approved', 'sent', 'received'].includes(po.status) &&
      po.created_at >= thirtyDaysAgo
    )
    .reduce((sum: number, po: { total_amount: number }) => sum + (po.total_amount ?? 0), 0)

  // Build daily cashflow for last 30 days
  const days: { date: string; inflow: number; outflow: number; balance: number }[] = []
  let runningBalance = 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const dayInflow = orders
      .filter((o: { status: string; created_at: string }) =>
        ['delivered', 'completed', 'shipped'].includes(o.status) &&
        o.created_at.slice(0, 10) === dateStr
      )
      .reduce((sum: number, o: { total: number }) => sum + (o.total ?? 0), 0)

    const dayOutflow = purchaseOrders
      .filter((po: { status: string; created_at: string }) =>
        ['approved', 'sent', 'received'].includes(po.status) &&
        po.created_at.slice(0, 10) === dateStr
      )
      .reduce((sum: number, po: { total_amount: number }) => sum + (po.total_amount ?? 0), 0)

    runningBalance += dayInflow - dayOutflow
    days.push({ date: dateStr, inflow: dayInflow, outflow: dayOutflow, balance: runningBalance })
  }

  // Upcoming payables
  const upcoming_payables = purchaseOrders
    .filter((po: { status: string; expected_delivery_date: string | null }) =>
      po.status === 'approved' && po.expected_delivery_date
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
}
