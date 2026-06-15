import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
const ALLOWED = new Set(['ml', 'meta', 'amazon'])

export async function DELETE(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform') ?? ''
  if (!ALLOWED.has(platform)) {
    return NextResponse.json({ error: 'platform inválido' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const resp = await fetch(`${BACKEND}/api/integrations/${platform}/disconnect`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  const data = await resp.json()
  return NextResponse.json(data, { status: resp.status })
}
