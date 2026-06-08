import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const module = searchParams.get('module')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

  try {
    let query = supabase
      .from('audit_logs')
      .select('id, user_id, action, module, resource_id, metadata, created_at')
      .eq('tenant_id', auth.tenant_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (module) query = query.eq('module', module)

    const { data: logs, error } = await query

    if (error) {
      // Table may not exist yet — return empty list gracefully
      return NextResponse.json({ logs: [], total: 0, modules: [] })
    }

    const modules = [...new Set((logs ?? []).map((l: { module: string }) => l.module))]
    return NextResponse.json({ logs: logs ?? [], total: logs?.length ?? 0, modules })
  } catch {
    return NextResponse.json({ logs: [], total: 0, modules: [] })
  }
}
