// src/dashboard/app/api/erp/purchase-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

// Roles que pueden ver y gestionar OCs (no aprobar)
const MANAGE_ROLES = ['owner', 'admin', 'socia'] as const;
// Roles que pueden APROBAR o RECHAZAR OCs — socia requerida (admin excluido)
const APPROVE_ROLES = ['owner', 'socia'] as const;

// Transiciones de estado permitidas por acción
const ACTION_TRANSITIONS: Record<string, { from: string; to: string; roles: readonly string[] }> = {
  submit:    { from: 'DRAFT',            to: 'PENDING_APPROVAL', roles: MANAGE_ROLES },
  approve:   { from: 'PENDING_APPROVAL', to: 'APPROVED',         roles: APPROVE_ROLES },
  reject:    { from: 'PENDING_APPROVAL', to: 'REJECTED',         roles: APPROVE_ROLES },
  mark_sent: { from: 'APPROVED',         to: 'RECEIVED',         roles: MANAGE_ROLES },
};

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Socia puede ver órdenes de compra también
  if (!MANAGE_ROLES.includes(auth.role as typeof MANAGE_ROLES[number])) {
    return NextResponse.json({ error: 'Prohibido: Se requiere rol Admin/Owner/Socia' }, { status: 403 });
  }

  try {
    const { tenant_id } = auth;

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
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json((pos || []).map(po => {
      const suppliers = po.approved_suppliers as unknown as { name: string }[] | { name: string } | null;
      const supplierName = Array.isArray(suppliers)
        ? (suppliers[0]?.name ?? 'Proveedor desconocido')
        : (suppliers?.name ?? 'Proveedor desconocido');

      return {
        po_id:               po.id,
        supplier:            supplierName,
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

// POST — Crear OC desde inventario (restock_request)
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (!MANAGE_ROLES.includes(auth.role as typeof MANAGE_ROLES[number])) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      (body as Record<string, unknown>).action !== 'restock_request' ||
      typeof (body as Record<string, unknown>).sku !== 'string'
    ) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const { sku } = body as { action: 'restock_request'; sku: string };

    // Crear OC en estado DRAFT — no salta a APPROVED directamente
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        tenant_id:   auth.tenant_id,
        created_by:  auth.id,
        status:      'DRAFT',
        items:       [{ sku, qty: 1, name: sku }],
        total_estimate: 0,
        created_at:  new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, po_id: data.id }, { status: 201 });

  } catch (err: any) {
    console.error('[Purchase Orders POST] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PATCH — Transiciones de estado con RBAC por acción
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  // Verificación de rol mínimo — refinamos por acción abajo
  if (!MANAGE_ROLES.includes(auth.role as typeof MANAGE_ROLES[number])) {
    return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).po_id !== 'string' ||
      typeof (body as Record<string, unknown>).action !== 'string'
    ) {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
    }

    const { po_id, action } = body as { po_id: string; action: string };

    const transition = ACTION_TRANSITIONS[action];
    if (!transition) {
      return NextResponse.json({ error: `Acción desconocida: ${action}` }, { status: 400 });
    }

    // RBAC por acción — approve/reject solo socia/owner
    if (!transition.roles.includes(auth.role)) {
      return NextResponse.json({ error: 'Prohibido: rol insuficiente para esta acción' }, { status: 403 });
    }

    // Leer OC actual — verificar tenant y estado actual (previene saltar el flujo)
    const { data: current, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('id, status, tenant_id')
      .eq('id', po_id)
      .eq('tenant_id', auth.tenant_id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Validar que el estado actual coincide con la transición esperada
    if (current.status !== transition.from) {
      return NextResponse.json(
        { error: `Estado inválido: se esperaba ${transition.from}, pero la OC está en ${current.status}` },
        { status: 409 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      status:     transition.to,
      updated_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updatePayload.approved_by = [auth.id];
      updatePayload.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updatePayload)
      .eq('id', po_id)
      .eq('tenant_id', auth.tenant_id)  // tenant isolation doble
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, po: data });

  } catch (err: any) {
    console.error('[Purchase Orders PATCH] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
