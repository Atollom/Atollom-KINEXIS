// src/dashboard/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch notifications from various sources in parallel
    const [cfdis, inventory, returns, pos, crisis] = await Promise.all([
      // 1. CFDI Errors
      supabase
        .from('cfdi_records')
        .select('id, folio, status, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'ERROR_PAC'),

      // 2. Critical Stock
      supabase
        .from('inventory')
        .select('sku, days_remaining, updated_at')
        .eq('tenant_id', tenant_id)
        .lte('days_remaining', 7),

      // 3. Pending Returns
      supabase
        .from('returns')
        .select('id, external_id, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'pending_approval'),

      // 4. Stale Purchase Orders
      supabase
        .from('purchase_orders')
        .select('id, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'DRAFT')
        .lt('created_at', yesterday),

      // 5. Active Crisis
      supabase
        .from('crisis_events')
        .select('id, event_type, created_at')
        .eq('tenant_id', tenant_id)
        .is('resolved_at', null)
    ]);

    const notifications: any[] = [];

    // Map and Merge
    cfdis.data?.forEach((c: any) => notifications.push({
      id: `cfdi-${c.id}`,
      type: 'cfdi_error',
      message: `Error en CFDI Folio: ${c.folio}`,
      priority: 'high',
      created_at: c.created_at
    }));

    inventory.data?.forEach((i: any) => notifications.push({
      id: `stock-${i.sku}`,
      type: 'stock_critical',
      message: `Stock crítico: ${i.sku} (${Math.round(i.days_remaining)} días restantes)`,
      priority: 'high',
      created_at: i.updated_at
    }));

    returns.data?.forEach((r: any) => notifications.push({
      id: `return-${r.id}`,
      type: 'return_pending',
      message: `Devolución pendiente: ${r.external_id || r.id}`,
      priority: 'medium',
      created_at: r.created_at
    }));

    pos.data?.forEach((po: any) => notifications.push({
      id: `po-${po.id}`,
      type: 'po_pending',
      message: `Orden de compra estancada en borrador > 24h`,
      priority: 'medium',
      created_at: po.created_at
    }));

    crisis.data?.forEach((cr: any) => notifications.push({
      id: `crisis-${cr.id}`,
      type: 'crisis_active',
      message: `Evento de crisis activo: ${cr.event_type}`,
      priority: 'critical',
      created_at: cr.created_at
    }));

    // Sort by priority and date
    const priorityMap: Record<string, number> = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const sorted = notifications.sort((a, b) => {
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json(sorted.slice(0, 50));

  } catch (error: any) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
