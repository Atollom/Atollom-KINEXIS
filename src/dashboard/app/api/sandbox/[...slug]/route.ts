import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

const DEV_FALLBACK: Record<string, unknown> = {
  mode: 'SANDBOX',
  integrations: {
    mercadolibre: { status: 'connected', last_sync: new Date().toISOString(), api_calls_today: 0, rate_limit: 1000 },
    amazon:       { status: 'connected', last_sync: new Date().toISOString(), api_calls_today: 0, rate_limit: 500 },
    shopify:      { status: 'connected', last_sync: new Date().toISOString(), api_calls_today: 0, rate_limit: 2000 },
    meta:         { status: 'connected', last_sync: new Date().toISOString(), api_calls_today: 0, rate_limit: 5000 },
  },
  sync_log_count: 0,
  sandbox: true,
  _dev: 'backend offline',
}

async function proxy(req: NextRequest, slug: string[]): Promise<NextResponse> {
  const authorization = req.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const path = slug.join('/')
  const backendUrl = new URL(`${BACKEND_URL}/api/sandbox/${path}`)
  req.nextUrl.searchParams.forEach((v, k) => backendUrl.searchParams.set(k, v))

  const body = req.method !== 'GET' ? await req.text() : undefined

  try {
    const res = await fetch(backendUrl.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(DEV_FALLBACK)
    }
    return NextResponse.json({ error: 'Backend no disponible' }, { status: 503 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}
export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  return proxy(req, params.slug)
}
