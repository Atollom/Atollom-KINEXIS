import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (auth.role !== 'owner') {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 })
  }

  try {
    const [tenantResult, usersResult] = await Promise.allSettled([
      supabase
        .from('tenants')
        .select('id, name, plan, status, created_at')
        .eq('id', auth.tenant_id)
        .single(),
      supabase
        .from('users')
        .select('id, full_name, email, role, created_at')
        .eq('tenant_id', auth.tenant_id)
        .order('created_at', { ascending: false }),
    ])

    const tenant = tenantResult.status === 'fulfilled' ? tenantResult.value.data : null
    const users = usersResult.status === 'fulfilled' ? (usersResult.value.data ?? []) : []

    return NextResponse.json({ tenant, users, user_count: users.length })
  } catch (err: unknown) {
    console.error('[Admin Tenants]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
