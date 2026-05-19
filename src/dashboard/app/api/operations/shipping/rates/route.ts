import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json() as {
      origin_zip: string
      destination_zip: string
      weight_kg: number
      declared_value?: number
    }

    const { origin_zip, destination_zip, weight_kg } = body
    if (!origin_zip || !destination_zip || !weight_kg) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: vaultRow } = await supabase
      .from('vault_secrets')
      .select('key_name')
      .eq('tenant_id', auth.tenant_id)
      .eq('key_name', 'skydropx_api_key')
      .maybeSingle()

    if (!vaultRow) {
      return NextResponse.json({
        rates: getMockRates(weight_kg),
        source: 'mock',
        message: 'Configura tu API key de Skydropx para cotizaciones reales',
      })
    }

    return NextResponse.json({
      rates: getMockRates(weight_kg),
      source: 'mock',
    })
  } catch (err) {
    console.error('[ShippingRates POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function getMockRates(weight_kg: number) {
  const base = Math.max(1, weight_kg)
  return [
    { carrier: 'FedEx', service: 'Express', days: 1, price: Math.round(base * 120 + 80) },
    { carrier: 'DHL', service: 'Express', days: 1, price: Math.round(base * 115 + 90) },
    { carrier: 'Estafeta', service: 'Express', days: 2, price: Math.round(base * 95 + 70) },
    { carrier: 'RedPack', service: 'Terrestre', days: 3, price: Math.round(base * 75 + 60) },
    { carrier: 'Sendex', service: 'Económico', days: 5, price: Math.round(base * 55 + 45) },
  ]
}
