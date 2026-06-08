import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

async function getAuthenticatedTenant(supabase: ReturnType<typeof createRouteHandlerClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('tenant_users').select('tenant_id, role').eq('user_id', user.id).single()
  return data ? { userId: user.id, tenantId: data.tenant_id, role: data.role } : null
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const tenant = await getAuthenticatedTenant(supabase)
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['owner', 'admin'].includes(tenant.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module')
  const limit = parseInt(searchParams.get('limit') ?? '100')

  let query = supabase
    .from('audit_logs')
    .select('id, user_id, action, module, resource_id, metadata, created_at')
    .eq('tenant_id', tenant.tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (module) query = query.eq('module', module)

  const { data: logs, error } = await query

  if (error) {
    // If audit_logs table doesn't exist yet, return empty list gracefully
    return NextResponse.json({ logs: [], total: 0, modules: [] })
  }

  const modules = [...new Set((logs ?? []).map((l: { module: string }) => l.module))]

  return NextResponse.json({ logs: logs ?? [], total: logs?.length ?? 0, modules })
}
