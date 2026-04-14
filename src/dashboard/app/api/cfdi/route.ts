// src/dashboard/app/api/cfdi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import { z } from 'zod';

const GenerateCFDISchema = z.object({
  empresa_id:          z.string().uuid().optional(),
  order_id:            z.string().min(1),
  customer_rfc:        z.string().regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/).optional(),
  customer_name:       z.string().optional(),
  customer_email:      z.string().email().optional(),
  customer_zip:        z.string().length(5).optional(),
  customer_tax_regime: z.string().default('616'),
  uso_cfdi:            z.string().default('G03'),
  forma_pago:          z.enum(['01','02','03','04','28','99']).default('03'),
  metodo_pago:         z.enum(['PUE','PPD']).default('PUE'),
  credit_note_for_uuid: z.string().uuid().optional(),
});


const CancelCFDISchema = z.object({
  cfdi_uuid:         z.string().uuid(),
  motivo:            z.enum(['01','02','03','04']).default('02'),
  cfdi_sustitucion:  z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = GenerateCFDISchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Verificar config de la empresa seleccionada o la principal
    let cfdiConfig;
    if (data.empresa_id) {
      const { data: emp } = await supabase
        .from('tenant_empresas')
        .select('facturapi_org_id, cp_expedicion')
        .eq('id', data.empresa_id)
        .eq('tenant_id', auth.tenant_id)
        .single();
      cfdiConfig = emp;
    } else {
      const { data: principal } = await supabase
        .from('tenant_empresas')
        .select('facturapi_org_id, cp_expedicion')
        .eq('tenant_id', auth.tenant_id)
        .eq('es_principal', true)
        .single();
      cfdiConfig = principal;
    }

    if (!cfdiConfig || !cfdiConfig.facturapi_org_id) {
      return NextResponse.json({ error: 'Facturación no configurada para la empresa seleccionada' }, { status: 422 });
    }


    // Llamar al microservicio Python de CFDI (simulado o via API)
    // El CFDI Billing Agent (#36) es el encargado de esto.
    // Insertamos una solicitud o llamamos directamente si hay un endpoint.
    // Por ahora, seguimos el patrón de la documentación:
    const cfdiServiceUrl = process.env.CFDI_SERVICE_URL || 'http://localhost:8001';
    
    const cfdiResponse = await fetch(`${cfdiServiceUrl}/invoice/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kinexis-Tenant': auth.tenant_id,
        'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || '',
      },
      body: JSON.stringify({
        ...data,
        tenant_id: auth.tenant_id,
        facturapi_org_id: cfdiConfig.facturapi_org_id,
      }),
    });

    const result = await cfdiResponse.json();
    if (!cfdiResponse.ok) throw new Error(result.error || 'Error en servicio CFDI');

    return NextResponse.json({ success: true, cfdi: result });

  } catch (error: any) {
    console.error('[CFDI POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get('order_id');
  
  let query = supabase
    .from('cfdi_records')
    .select('*')
    .eq('tenant_id', auth.tenant_id)
    .order('created_at', { ascending: false });

  if (orderId) {
    query = query.eq('order_id', orderId);
  }

  const { data: cfdis, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cfdis: cfdis || [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CancelCFDISchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

    const { cfdi_uuid, motivo } = parsed.data;

    // Aprobacion via RPC
    const { data, error } = await supabase.rpc('approve_cfdi_cancellation', {
      p_cfdi_uuid:   cfdi_uuid,
      p_tenant_id:   auth.tenant_id,
      p_approved_by: auth.id,
      p_motivo:      motivo,
    });

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[CFDI DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
