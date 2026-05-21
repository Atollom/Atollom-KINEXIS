import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

const VALID_FREE_PLANS = ['trial'] as const

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: { plan_type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { plan_type } = body

  if (!plan_type || !VALID_FREE_PLANS.includes(plan_type as typeof VALID_FREE_PLANS[number])) {
    return NextResponse.json(
      { error: `Plan inválido. Planes gratuitos disponibles: ${VALID_FREE_PLANS.join(', ')}` },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({
      plan: plan_type,
      trial_ends_at: plan_type === 'trial'
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      onboarding_completed: true,
    })
    .eq('id', auth.tenant_id)

  if (updateError) {
    console.error('[select-plan] DB update failed:', updateError)
    return NextResponse.json(
      { error: 'No se pudo actualizar el plan. Intenta de nuevo.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    plan: plan_type,
    message: plan_type === 'trial'
      ? 'Prueba de 14 días activada. ¡Bienvenido a KINEXIS!'
      : `Plan ${plan_type} activado.`,
  })
}
