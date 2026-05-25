import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const returnTo = req.nextUrl.searchParams.get('return_to') ?? 'settings'
  const marketplaceId = req.nextUrl.searchParams.get('marketplace_id') ?? 'A1AM78C64UM0Y8'

  const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  try {
    const res = await fetch(
      `${backendUrl}/api/integrations/amazon/connect?return_to=${returnTo}&marketplace_id=${marketplaceId}`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: AbortSignal.timeout(10000),
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
