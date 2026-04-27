import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

const MOCK_USAGE = {
  limit: 500,
  used: 127,
  remaining: 373,
  percentage: 25.4,
  status: 'ok' as const,
}

export async function GET(request: NextRequest) {
  // TODO: read tenant_id from session/JWT — hardcoded for dev
  const tenantId = request.headers.get('x-tenant-id') ?? 'mock_tenant_id'

  try {
    const res = await fetch(`${BACKEND_URL}/api/cfdi/usage/${tenantId}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) throw new Error(`Backend ${res.status}`)

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/cfdi/usage]', err)

    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(MOCK_USAGE)
    }

    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
