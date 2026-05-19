import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET() {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, role, phone, created_at, updated_at')
    .eq('supabase_user_id', auth.id)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json() as Record<string, unknown>
    const allowed = ['full_name', 'phone', 'preferences', 'timezone', 'language'] as const
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key]
    }
    update.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('users')
      .update(update)
      .eq('supabase_user_id', auth.id)
      .eq('tenant_id', auth.tenant_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Me PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
