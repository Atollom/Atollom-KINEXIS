import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const tracking = searchParams.get('tracking')

    if (!tracking) return NextResponse.json({ error: 'tracking requerido' }, { status: 400 })

    const { tenant_id } = auth

    const { data: label, error } = await supabase
      .from('skydrop_labels')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('tracking_number', tracking)
      .maybeSingle()

    if (error) throw error

    if (!label) {
      return NextResponse.json({ error: 'Guía no encontrada en este tenant' }, { status: 404 })
    }

    const now = new Date()
    const created = new Date(label.created_at)
    const daysSince = Math.floor((now.getTime() - created.getTime()) / 86400000)
    const expired = label.expires_at ? new Date(label.expires_at) < now : false

    const events = [
      {
        status: 'Guía generada',
        location: 'Sistema KINEXIS',
        timestamp: label.created_at,
        description: `Guía creada vía Skydropx. Carrier: ${label.carrier ?? 'N/A'}`,
      },
    ]

    if (daysSince >= 1) {
      events.push({
        status: 'En tránsito',
        location: 'Centro de distribución',
        timestamp: new Date(created.getTime() + 86400000).toISOString(),
        description: 'Paquete recogido y en ruta',
      })
    }

    if (expired) {
      events.push({
        status: 'Guía vencida',
        location: '—',
        timestamp: label.expires_at!,
        description: 'La guía ha vencido. Generar nueva guía si es necesario.',
      })
    }

    return NextResponse.json({
      tracking_number: label.tracking_number,
      carrier: label.carrier ?? 'Skydropx',
      status: expired ? 'EXCEPTION' : daysSince >= 1 ? 'IN_TRANSIT' : 'PENDING',
      estimated_delivery: label.expires_at ?? null,
      events: events.reverse(),
    })
  } catch (err: unknown) {
    console.error('[Tracking]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
