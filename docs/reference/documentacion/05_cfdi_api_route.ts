/**
 * KINEXIS — API Route: Gestion de CFDI
 * Archivo: app/api/cfdi/route.ts
 *
 * POST   /api/cfdi  → Generar nueva factura CFDI
 * GET    /api/cfdi  → Consultar CFDIs de una orden
 * DELETE /api/cfdi  → Solicitar cancelacion de un CFDI
 *
 * Autenticacion: JWT Supabase + middleware de tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Schemas de Validacion ────────────────────────────────────────────────────

const GenerateCFDISchema = z.object({
  order_id:            z.string().min(1),
  customer_rfc:        z.string().regex(/^[A-ZN&]{3,4}[0-9]{6}[A-Z0-9]{3}$/).optional(),
  customer_name:       z.string().optional(),
  customer_email:      z.string().email().optional(),
  customer_zip:        z.string().length(5).optional(),
  customer_tax_regime: z.string().default('616'),
  uso_cfdi:            z.string().default('G03'),
  forma_pago:          z.enum(['01','02','03','04','28','99']).default('03'),
  metodo_pago:         z.enum(['PUE','PPD']).default('PUE'),
  // Para notas de credito — pasar UUID del CFDI original
  credit_note_for_uuid: z.string().uuid().optional(),
})

const CancelCFDISchema = z.object({
  cfdi_uuid:         z.string().uuid(),
  motivo:            z.enum(['01','02','03','04']).default('02'),
  cfdi_sustitucion:  z.string().uuid().optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthenticatedTenant(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  return profile?.tenant_id ? { user, tenant_id: profile.tenant_id, role: profile.role } : null
}

// ─── POST: Generar CFDI ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = createClient()

  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Validar payload
  const body = await request.json()
  const parsed = GenerateCFDISchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos invalidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data

  // Verificar que el tenant tiene CFDI configurado
  const { data: cfdiConfig } = await supabase
    .from('cfdi_tenant_config')
    .select('facturapi_org_id, cp_expedicion, email_from')
    .eq('tenant_id', auth.tenant_id)
    .single()

  if (!cfdiConfig) {
    return NextResponse.json(
      {
        error: 'Facturacion no configurada',
        action: 'Ve a Configuracion > Facturacion para agregar tu RFC y datos fiscales'
      },
      { status: 422 }
    )
  }

  // Verificar que la orden existe y pertenece al tenant
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_mxn, platform')
    .eq('id', data.order_id)
    .eq('tenant_id', auth.tenant_id)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  // Verificar que no existe ya un CFDI vigente para esta orden
  if (!data.credit_note_for_uuid) {
    const { data: existing } = await supabase
      .from('cfdi_records')
      .select('uuid, folio, status')
      .eq('order_id', data.order_id)
      .eq('tenant_id', auth.tenant_id)
      .eq('cfdi_type', 'I')
      .neq('status', 'CANCELADO')
      .single()

    if (existing) {
      return NextResponse.json(
        {
          error: 'Esta orden ya tiene una factura vigente',
          existing_cfdi: { uuid: existing.uuid, folio: existing.folio }
        },
        { status: 409 }
      )
    }
  }

  // Llamar al microservicio Python de CFDI
  const cfdiServiceUrl = process.env.CFDI_SERVICE_URL || 'http://localhost:8001'

  try {
    const cfdiResponse = await fetch(`${cfdiServiceUrl}/invoice/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kinexis-Tenant': auth.tenant_id,
        'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET!,
      },
      body: JSON.stringify({
        ...data,
        tenant_id: auth.tenant_id,
        customer_zip: data.customer_zip || cfdiConfig.cp_expedicion,
        facturapi_org_id: cfdiConfig.facturapi_org_id,
      }),
      signal: AbortSignal.timeout(45_000),  // 45s — el SAT puede tardar
    })

    const result = await cfdiResponse.json()

    if (!cfdiResponse.ok) {
      // Si requiere revision humana, registrar en cola
      if (result.requires_human_review) {
        await supabase.from('cfdi_records').insert({
          tenant_id: auth.tenant_id,
          order_id: data.order_id,
          status: result.status || 'ERROR_VALIDACION',
          customer_rfc: data.customer_rfc || 'XAXX010101000',
          customer_name: data.customer_name || 'PUBLICO EN GENERAL',
          error_code: result.error_code,
          error_message: result.error_message,
          requires_human_review: true,
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error_message || 'Error al generar la factura',
          error_code: result.error_code,
          requires_human_review: result.requires_human_review || false,
        },
        { status: cfdiResponse.status === 422 ? 422 : 500 }
      )
    }

    // Exito
    return NextResponse.json({
      success: true,
      cfdi: {
        uuid:        result.uuid,
        folio:       result.folio,
        total:       result.total,
        subtotal:    result.subtotal,
        pdf_url:     result.pdf_url,
        xml_url:     result.xml_url,
        status:      result.status,
        timbrado_at: result.timbrado_at,
      },
      message: `Factura ${result.folio} generada correctamente`,
    })

  } catch (error) {
    console.error('[CFDI] Error inesperado:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ─── GET: Consultar CFDIs de una orden ───────────────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const orderId = new URL(request.url).searchParams.get('order_id')
  if (!orderId) return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 })

  const { data: cfdis } = await supabase
    .from('cfdi_records')
    .select('uuid, folio, cfdi_type, status, total, customer_rfc, pdf_url, xml_url, timbrado_at')
    .eq('order_id', orderId)
    .eq('tenant_id', auth.tenant_id)
    .order('timbrado_at', { ascending: false })

  return NextResponse.json({ cfdis: cfdis || [] })
}

// ─── DELETE: Solicitar cancelacion ───────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const supabase = createClient()

  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = CancelCFDISchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 })
  }

  const { cfdi_uuid, motivo, cfdi_sustitucion } = parsed.data

  // Verificar que el CFDI pertenece al tenant
  const { data: cfdi } = await supabase
    .from('cfdi_records')
    .select('id, total, status')
    .eq('uuid', cfdi_uuid)
    .eq('tenant_id', auth.tenant_id)
    .single()

  if (!cfdi)                        return NextResponse.json({ error: 'CFDI no encontrado' }, { status: 404 })
  if (cfdi.status === 'CANCELADO')  return NextResponse.json({ error: 'CFDI ya esta cancelado' }, { status: 409 })

  const isAdmin  = auth.role === 'admin' || auth.role === 'owner'
  const lowAmount = cfdi.total < 10_000

  if (isAdmin && lowAmount) {
    // Aprobacion directa para admins con montos bajos
    await supabase.rpc('approve_cfdi_cancellation', {
      p_cfdi_uuid:   cfdi_uuid,
      p_tenant_id:   auth.tenant_id,
      p_approved_by: auth.user.id,
      p_motivo:      motivo,
    })
    return NextResponse.json({
      success: true,
      message: 'Cancelacion aprobada. El SAT puede tardar hasta 72 horas en confirmar.',
      status: 'CANCELACION_PENDIENTE',
    })
  }

  // Para montos altos o sin permisos: enviar a aprobacion
  return NextResponse.json(
    {
      success: false,
      message: 'Cancelaciones de mas de $10,000 MXN requieren aprobacion del administrador.',
      requires_approval: true,
      cfdi_uuid,
      total: cfdi.total,
    },
    { status: 202 }
  )
}
