import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company, ecommerce, messaging, billing, users } = body

    // Validate minimum required data
    if (!company?.name || !company?.rfc) {
      return NextResponse.json(
        { success: false, error: 'Datos de empresa incompletos' },
        { status: 400 }
      )
    }

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos un usuario' },
        { status: 400 }
      )
    }

    // Fase 2: persist to Supabase
    // - INSERT INTO tenants (name, rfc, address, phone) → tenant_id
    // - INSERT INTO tenant_integrations (tenant_id, provider, credentials_encrypted)
    // - INSERT INTO users (tenant_id, email, role) for each user
    // - Send welcome emails via Resend/SendGrid

    const tenantId = crypto.randomUUID()

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      company_name: company.name,
      integrations_saved: {
        ecommerce: {
          ml: ecommerce?.ml_connected ?? false,
          amazon: Boolean(ecommerce?.amazon_seller_id),
          shopify: Boolean(ecommerce?.shopify_store_url),
        },
        messaging: {
          whatsapp: Boolean(messaging?.wa_phone_number_id),
          instagram: Boolean(messaging?.ig_account_id),
          facebook: Boolean(messaging?.fb_page_id),
        },
        billing: {
          facturama: Boolean(billing?.facturama_username),
          facturapi: Boolean(billing?.facturapi_secret_key),
        },
      },
      users_created: users.length,
      message: 'Configuración completada. Bienvenido a KINEXIS.',
    })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'onboarding endpoint active' })
}
