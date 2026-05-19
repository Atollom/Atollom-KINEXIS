import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { data: accounts, error } = await supabase
      .from('b2b_accounts')
      .select('id, company_name, contact_phone, mrr, health_score, created_at')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const rows = accounts ?? []

    const users = rows.map(a => ({
      id:               a.id,
      company:          a.company_name ?? 'Empresa sin nombre',
      contact_name:     a.company_name ?? '',
      email:            '',
      plan:             a.mrr && a.mrr >= 5000 ? 'enterprise' : a.mrr && a.mrr >= 1000 ? 'premium' : 'basic',
      portal_access:    a.health_score !== null && a.health_score > 0,
      documents_shared: 0,
      open_tickets:     0,
      total_orders:     0,
      total_spent:      Number(a.mrr ?? 0) * 12,
    }))

    const stats = {
      total:        users.length,
      with_access:  users.filter(u => u.portal_access).length,
      no_access:    users.filter(u => !u.portal_access).length,
      open_tickets: 0,
      total_docs:   0,
    }

    return NextResponse.json({ users, stats, source: 'live' })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
