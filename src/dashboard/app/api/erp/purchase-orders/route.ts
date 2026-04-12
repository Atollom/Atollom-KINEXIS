// src/dashboard/app/api/erp/purchase-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Restringido a owner | admin
  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido: Se requiere rol Admin/Owner' }, { status: 403 });
  }

  try {
    const { tenant_id } = auth;

    // Join con approved_suppliers para nombre del proveedor
    const { data: pos, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        supplier_id,
        status,
        items,
        total_estimate,
        approval_expires_at,
        created_at,
        approved_suppliers ( name )
      `)
      .eq('tenant_id', tenant_id)
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json((pos || []).map(po => {
      // Supabase join: `approved_suppliers` is a single related row
      const supplier = (po.approved_suppliers as { name: string } | null)?.name ?? 'Proveedor desconocido';
      return {
        po_id:               po.id,
        supplier,
        items:               po.items ?? [],
        total:               po.total_estimate,
        status:              po.status,
        approval_expires_at: po.approval_expires_at,
        created_at:          po.created_at,
      };
    }));

  } catch (error: any) {
    console.error('[Purchase Orders GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Acción de aprobación — PATCH
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).po_id !== 'string' ||
      (body as Record<string, unknown>).action !== 'approve'
    ) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const { po_id } = body as { po_id: string; action: 'approve' };

    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status:      'APPROVED',
        updated_at:  new Date().toISOString(),
        approved_by: [auth.id],
      })
      .eq('id', po_id)
      .eq('tenant_id', auth.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, po: data });

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
