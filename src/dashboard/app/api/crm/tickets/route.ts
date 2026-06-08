import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('id, title, description, status, priority, channel, customer_name, created_at, updated_at')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const items = (tickets || []).map(t => ({
      id: t.id,
      title: t.title ?? 'Sin título',
      description: t.description ?? '',
      status: t.status ?? 'open',
      priority: t.priority ?? 'medium',
      channel: t.channel ?? 'web',
      customer_name: t.customer_name ?? 'Cliente',
      created_at: t.created_at,
      updated_at: t.updated_at,
    }))

    return NextResponse.json({
      tickets: items,
      stats: {
        total: items.length,
        open: items.filter(t => t.status === 'open').length,
        escalated: items.filter(t => t.status === 'escalated').length,
        resolved: items.filter(t => t.status === 'resolved').length,
      },
    })
  } catch (err: unknown) {
    console.error('[Tickets]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { ticket_id, status } = await req.json()
    if (!ticket_id || !status) return NextResponse.json({ error: 'ticket_id y status requeridos' }, { status: 400 })

    const validStatuses = ['open', 'escalated', 'resolved', 'closed']
    if (!validStatuses.includes(status)) return NextResponse.json({ error: 'status inválido' }, { status: 400 })

    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticket_id)
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[Tickets PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
