import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { data: queue, error } = await supabase
      .from('followup_queue')
      .select('id, agent_id, status, scheduled_at, executed_at, context')
      .eq('tenant_id', auth.tenant_id)
      .order('scheduled_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const rows = queue ?? []

    // Derive virtual automation rules from followup_queue agent_id patterns
    const agentGroups = rows.reduce<Record<string, typeof rows>>((acc, r) => {
      const key = r.agent_id ?? 'unknown'
      acc[key] = acc[key] ?? []
      acc[key].push(r)
      return acc
    }, {})

    const automations = Object.entries(agentGroups).map(([agentId, items]) => {
      const executed = items.filter(i => i.status === 'executed')
      return {
        id:               agentId,
        name:             `Automatización ${agentId}`,
        status:           items.some(i => i.status === 'pending') ? 'active' as const : 'paused' as const,
        trigger: {
          type:      'activity' as const,
          condition: `agent_id = ${agentId}`,
        },
        actions: [{ type: 'task' as const, label: 'Follow-up automático' }],
        success_rate:    executed.length > 0
          ? Math.round((executed.length / items.length) * 100)
          : 100,
        deals_affected:  items.length,
        created_at:      items[0]?.scheduled_at ?? new Date().toISOString(),
      }
    })

    const active = automations.filter(a => a.status === 'active').length
    const stats = {
      total:                automations.length,
      active,
      paused:               automations.length - active,
      total_deals_affected: rows.length,
      avg_success_rate:     automations.length > 0
        ? Math.round(automations.reduce((s, a) => s + a.success_rate, 0) / automations.length)
        : 100,
    }

    return NextResponse.json({ automations, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json() as { id?: string; status?: string }
    if (!body.id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    // Toggle all followup_queue entries for this agent_id
    const newStatus = body.status === 'active' ? 'pending' : 'cancelled'
    await supabase
      .from('followup_queue')
      .update({ status: newStatus })
      .eq('tenant_id', auth.tenant_id)
      .eq('agent_id', body.id)
      .eq('status', newStatus === 'pending' ? 'cancelled' : 'pending')

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
