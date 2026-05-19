import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (auth.role !== 'atollom_admin') {
    return NextResponse.json({ error: 'Acceso restringido' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('config_change_log')
    .select('id, tenant_id, field, previous_value, new_value, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Error consultando logs' }, { status: 500 })

  const tenantIds = [...new Set((data ?? []).map(l => l.tenant_id).filter(Boolean))]

  const { data: tenants } = tenantIds.length > 0
    ? await supabase.from('tenants').select('id, name').in('id', tenantIds)
    : { data: [] }

  const tenantMap = Object.fromEntries((tenants ?? []).map(t => [t.id, t.name]))

  const logs = (data ?? []).map(l => ({
    ...l,
    tenant_name: tenantMap[l.tenant_id] ?? l.tenant_id?.slice(0, 8),
  }))

  return NextResponse.json({ logs })
}
