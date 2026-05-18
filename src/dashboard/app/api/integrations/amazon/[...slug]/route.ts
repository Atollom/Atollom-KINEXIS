import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

async function proxy(req: NextRequest, slug: string[]): Promise<NextResponse> {
  const authorization = req.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const path = slug.join('/')
  const backendUrl = new URL(`${BACKEND_URL}/api/integrations/amazon/${path}`)
  req.nextUrl.searchParams.forEach((v, k) => backendUrl.searchParams.set(k, v))

  const body = req.method !== 'GET' && req.method !== 'DELETE'
    ? await req.text()
    : undefined

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
    return NextResponse.json({ error: 'Backend no disponible', connected: false }, { status: 503 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await params).slug)
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await params).slug)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await params).slug)
}
