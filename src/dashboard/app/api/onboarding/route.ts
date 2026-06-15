import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  // Forward to Python backend
  const resp = await fetch(`${BACKEND}/api/onboarding`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await resp.json()
  if (!resp.ok) return NextResponse.json(data, { status: resp.status })

  // Seed Samantha memories with real company context (fire & forget)
  const seedPayload = {
    tenant_id:      data.tenant_id,
    supabase_user_id: session.user.id,
    company_name:   body.company?.name,
    owner_name:     body.users?.[0]?.full_name ?? session.user.email?.split('@')[0],
    owner_email:    body.users?.[0]?.email ?? session.user.email,
    rfc:            body.billing?.rfc,
    razon_social:   body.billing?.razon_social,
    regimen_fiscal: body.billing?.regimen_fiscal,
    industry:       body.company?.industry,
    company_size:   body.company?.company_size,
    platforms:      body.platforms ?? [],
  }

  fetch(`${BACKEND}/api/samantha/memory/seed`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(seedPayload),
  }).catch((e) => console.warn('[onboarding] memory seed failed:', e))

  return NextResponse.json(data)
}
