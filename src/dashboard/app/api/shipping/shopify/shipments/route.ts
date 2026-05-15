import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  if (!token) {
    return NextResponse.json({ detail: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND}/api/shipping/shopify/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error de red' }, { status: 502 })
  }
}
