import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { error } = await supabase.from('tenants').select('id').limit(1)
    if (error) throw error
    return NextResponse.json({ connected: true, status: 'healthy', message: 'Database connection OK' })
  } catch (err: any) {
    return NextResponse.json({ connected: false, status: 'unhealthy', error: err.message }, { status: 503 })
  }
}
