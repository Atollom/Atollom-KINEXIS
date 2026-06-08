import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { tenant_id } = auth

    const [cfdiRes, tenantRes] = await Promise.all([
      supabase.from('cfdi_records').select('id, uuid, status, receptor_rfc, receptor_name, total').eq('tenant_id', tenant_id),
      supabase.from('tenants').select('rfc, razon_social, regimen_fiscal, codigo_postal').eq('id', tenant_id).maybeSingle(),
    ])

    const records = cfdiRes.data ?? []
    const tenant = tenantRes.data

    const checks = [
      {
        id: 'rfc_emisor',
        label: 'RFC Emisor configurado',
        description: 'El RFC del tenant está registrado para emitir CFDIs.',
        status: tenant?.rfc ? 'ok' : 'error',
        detail: tenant?.rfc ? null : 'Configura el RFC del tenant en ajustes',
      },
      {
        id: 'razon_social',
        label: 'Razón social registrada',
        description: 'La razón social del emisor coincide con el SAT.',
        status: tenant?.razon_social ? 'ok' : 'warning',
        detail: tenant?.razon_social ? null : 'Agregar razón social en configuración',
      },
      {
        id: 'regimen_fiscal',
        label: 'Régimen fiscal declarado',
        description: 'El régimen fiscal del emisor está especificado (CFDI 4.0 obligatorio).',
        status: tenant?.regimen_fiscal ? 'ok' : 'error',
        detail: tenant?.regimen_fiscal ? null : 'CFDI 4.0 requiere régimen fiscal del emisor',
      },
      {
        id: 'codigo_postal',
        label: 'Código postal del domicilio fiscal',
        description: 'CP del domicilio fiscal del emisor (CFDI 4.0 obligatorio).',
        status: tenant?.codigo_postal ? 'ok' : 'error',
        detail: tenant?.codigo_postal ? null : 'CFDI 4.0 requiere código postal del emisor',
      },
      {
        id: 'uuid_timbrado',
        label: 'Facturas timbradas correctamente',
        description: 'Porcentaje de CFDIs con UUID del SAT (timbrado exitoso).',
        status: (() => {
          if (records.length === 0) return 'warning'
          const timbrados = records.filter(r => r.uuid).length
          const pct = (timbrados / records.length) * 100
          return pct >= 95 ? 'ok' : pct >= 70 ? 'warning' : 'error'
        })(),
        detail: (() => {
          if (records.length === 0) return 'Sin CFDIs emitidos aún'
          const sin = records.filter(r => !r.uuid).length
          return sin > 0 ? `${sin} CFDIs sin UUID — verificar con FacturAPI` : null
        })(),
      },
      {
        id: 'receptor_rfc',
        label: 'RFCs de receptores válidos',
        description: 'Los RFCs de clientes en CFDIs tienen formato correcto.',
        status: (() => {
          const invalid = records.filter(r => r.receptor_rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(r.receptor_rfc ?? '')).length
          return invalid === 0 ? 'ok' : invalid <= 3 ? 'warning' : 'error'
        })(),
        detail: (() => {
          const invalid = records.filter(r => r.receptor_rfc && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(r.receptor_rfc ?? '')).length
          return invalid > 0 ? `${invalid} CFDIs con RFC de receptor inválido` : null
        })(),
      },
    ] as { id: string; label: string; description: string; status: 'ok' | 'warning' | 'error'; detail: string | null }[]

    const ok = checks.filter(c => c.status === 'ok').length
    const score = Math.round((ok / checks.length) * 100)

    return NextResponse.json({
      checks,
      score,
      last_verified: new Date().toISOString(),
      stats: {
        ok,
        warning: checks.filter(c => c.status === 'warning').length,
        error: checks.filter(c => c.status === 'error').length,
      },
    })
  } catch (err: unknown) {
    console.error('[CFDI Compliance]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
