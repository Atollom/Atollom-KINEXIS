import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'
import { mockConversations, mockInboxStats } from '@/lib/mockData'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { tenant_id } = auth

  // 1. Try wa_inbox (aggregated view if it exists)
  try {
    const { data: rows, error } = await supabase
      .from('wa_inbox')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('last_message_at', { ascending: false })
      .limit(50)

    if (!error && rows && rows.length > 0) {
      const conversations = rows.map((row: any) => ({
        id: row.id,
        platform: row.platform ?? 'whatsapp',
        customer: {
          name: row.customer_name,
          phone: row.customer_phone ?? undefined,
          username: row.customer_username ?? undefined,
        },
        status: row.status,
        priority: row.priority ?? 'medium',
        assigned_to: row.assigned_to ?? null,
        tags: row.tags ?? [],
        last_message: row.last_message,
        last_message_at: row.last_message_at,
        unread_count: row.unread_count ?? 0,
        messages: row.messages ?? [],
      }))
      const stats = {
        total_conversations: conversations.length,
        open: conversations.filter((c: any) => c.status === 'open').length,
        pending: conversations.filter((c: any) => c.status === 'pending').length,
        avg_response_time: _avgResponseTime(rows),
      }
      return NextResponse.json({ conversations, stats, source: 'live' })
    }
  } catch { /* fall through */ }

  // 2. Try whatsapp_messages table (populated by the webhook)
  try {
    const { data: msgs, error } = await supabase
      .from('whatsapp_messages')
      .select('wa_id, sender_name, body, received_at, direction')
      .eq('tenant_id', tenant_id)
      .order('received_at', { ascending: false })
      .limit(200)

    if (!error && msgs && msgs.length > 0) {
      // Group by wa_id (one conversation per contact)
      const byContact = new Map<string, any[]>()
      for (const m of msgs) {
        if (!byContact.has(m.wa_id)) byContact.set(m.wa_id, [])
        byContact.get(m.wa_id)!.push(m)
      }

      const conversations = Array.from(byContact.entries()).map(([wa_id, ms], idx) => {
        const latest = ms[0]
        return {
          id: wa_id,
          platform: 'whatsapp',
          customer: { name: latest.sender_name || wa_id, phone: wa_id },
          status: 'open',
          priority: 'medium',
          assigned_to: null,
          tags: [],
          last_message: latest.body ?? '',
          last_message_at: latest.received_at,
          unread_count: ms.filter((m: any) => m.direction === 'inbound').length,
          messages: ms.slice(0, 30).reverse().map((m: any, i: number) => ({
            id: `${wa_id}-${i}`,
            sender: m.direction === 'inbound' ? 'customer' : 'bot',
            sender_name: m.direction === 'inbound' ? (m.sender_name || wa_id) : 'Samantha',
            content: m.body ?? '',
            timestamp: m.received_at,
          })),
        }
      })

      const stats = {
        total_conversations: conversations.length,
        open: conversations.length,
        pending: 0,
        avg_response_time: '< 5m',
      }
      return NextResponse.json({ conversations, stats, source: 'whatsapp_messages' })
    }
  } catch { /* fall through */ }

  // 3. Sandbox fallback
  return NextResponse.json({
    conversations: mockConversations,
    stats: mockInboxStats,
    source: 'sandbox',
  })
}

function _avgResponseTime(rows: any[]): string {
  const times = rows
    .filter((r: any) => r.avg_response_seconds)
    .map((r: any) => r.avg_response_seconds as number)
  if (times.length === 0) return '< 5m'
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  return avg < 60 ? `${Math.round(avg)}s` : `${Math.round(avg / 60)}m`
}
