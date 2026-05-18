import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'
import { mockConversations, mockInboxStats } from '@/lib/mockData'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Try Supabase wa_inbox first (when Meta is certified and real data exists)
  try {
    const { data: rows, error } = await supabase
      .from('wa_inbox')
      .select('*')
      .eq('tenant_id', auth.tenant_id)
      .order('last_message_at', { ascending: false })
      .limit(50)

    if (!error && rows && rows.length > 0) {
      const conversations = rows.map((row: any) => ({
        id: row.id,
        platform: row.platform,
        customer: {
          name: row.customer_name,
          phone: row.customer_phone ?? undefined,
          username: row.customer_username ?? undefined,
        },
        status: row.status,
        priority: row.priority,
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
        avg_response_time: row_avg_response_time(rows),
      }

      return NextResponse.json({ conversations, stats, source: 'live' })
    }
  } catch {
    // fall through to sandbox
  }

  // Sandbox: return demo conversations (same shape as live data)
  return NextResponse.json({
    conversations: mockConversations,
    stats: mockInboxStats,
    source: 'sandbox',
  })
}

function row_avg_response_time(rows: any[]): string {
  const times = rows
    .filter((r: any) => r.avg_response_seconds)
    .map((r: any) => r.avg_response_seconds as number)
  if (times.length === 0) return '< 5m'
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  return avg < 60 ? `${Math.round(avg)}s` : `${Math.round(avg / 60)}m`
}
