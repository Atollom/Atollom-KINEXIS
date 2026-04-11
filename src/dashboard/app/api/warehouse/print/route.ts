// src/dashboard/app/api/warehouse/print/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado', status: 401 }, { status: 401 });
  }

  // Auth: rol warehouse | admin
  if (!['warehouse', 'admin', 'owner'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido', status: 403 }, { status: 403 });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    // 1. Obtener la URL de la etiqueta o datos de la orden
    const { data: order } = await supabase
      .from('orders')
      .select('id, platform, external_id')
      .eq('id', order_id)
      .eq('tenant_id', auth.tenant_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // 2. Insertar en la cola de impresión
    // El thermal_printer_adapter (Python) procesará esta cola
    const { data: printJob, error: printError } = await supabase
      .from('print_queue')
      .insert({
        tenant_id: auth.tenant_id,
        order_id: order.id,
        status: 'pending'
      })
      .select()
      .single();

    if (printError) throw printError;

    return NextResponse.json({
      success: true,
      job_id: printJob.id,
      message: 'Impresión enviada a la cola'
    });

  } catch (error: any) {
    console.error('[Print API] Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      status: 500 
    }, { status: 500 });
  }
}
