import { NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.PYTHON_BACKEND_URL ??
  process.env.BACKEND_URL ??
  'http://localhost:8000'

export async function POST(request: Request) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 })
  }

  try {
    const { company, ecommerce, messaging, users } = body as {
      company: Record<string, unknown>
      ecommerce: Record<string, unknown>
      messaging: Record<string, unknown>
      users: unknown[]
    }
    let billing = body.billing as Record<string, unknown> ?? {}

    // Fast client-side pre-validation
    if (!(company?.name as string | undefined)?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre de empresa requerido' },
        { status: 400 }
      )
    }

    // Accept billing.rfc_emisor | billing.rfc | company.rfc as the RFC source
    const resolvedRfc = billing?.rfc_emisor ?? billing?.rfc ?? company?.rfc
    if (!resolvedRfc) {
      return NextResponse.json(
        { success: false, error: 'RFC requerido (introdúcelo en Paso 1 o en Datos Fiscales)' },
        { status: 400 }
      )
    }

    // Normalise: ensure billing carries the resolved RFC before sending to backend
    billing = { ...billing, rfc: resolvedRfc }
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos un usuario' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('Authorization') ?? ''
    const { stripe_session_id, stripe_plan } = body as {
      stripe_session_id?: string; stripe_plan?: string
    }

    // Delegate to Python backend (OnboardingService)
    const backendRes = await fetch(`${BACKEND_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        company, ecommerce, messaging, billing, users,
        ...(stripe_session_id ? { stripe_session_id } : {}),
        ...(stripe_plan ? { stripe_plan } : {}),
      }),
      signal: AbortSignal.timeout(30_000),
    })

    const data = await backendRes.json()

    if (!backendRes.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error ?? 'Error en el backend' },
        { status: backendRes.ok ? 422 : backendRes.status }
      )
    }

    return NextResponse.json({
      success: true,
      tenant_id: data.tenant_id,
      slug: data.slug,
      plan: data.plan,
      integrations_created: data.integrations_created,
      users_created: data.users_created,
      message: 'Configuración completada. ¡Bienvenido a KINEXIS!',
    })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)

    // Backend unreachable → return mock success so wizard can still proceed in dev
    if (process.env.NODE_ENV === 'development') {
      console.warn('[/api/onboarding] Backend offline — returning dev mock')
      return NextResponse.json({
        success: true,
        tenant_id: crypto.randomUUID(),
        slug: 'dev-tenant',
        plan: 'growth',
        integrations_created: 0,
        users_created: (body?.users as unknown[])?.length ?? 1,
        message: '[DEV] Backend offline — datos NO guardados en BD',
        dev_mode: true,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const backendOk = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3_000) })
    .then(r => r.ok)
    .catch(() => false)

  return NextResponse.json({
    status: 'onboarding endpoint active',
    backend_url: BACKEND_URL,
    backend_reachable: backendOk,
  })
}
