// src/dashboard/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import type { Notification, NotificationModule } from '@/types';

// ── Module derivation — single source of truth ───────────────────────────────
const TYPE_TO_MODULE: Record<string, NotificationModule> = {
  cfdi_error:      'erp',
  po_pending:      'erp',
  stock_critical:  'erp',
  return_pending:  'ecommerce',
  crisis_active:   'sistema',
};

function moduleFor(type: string): NotificationModule {
  return TYPE_TO_MODULE[type] ?? 'sistema';
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  // tenant_id ALWAYS from getAuthenticatedTenant — never from query params
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Fetch from all source tables in parallel
    const [cfdis, inventory, returns, pos, crisis] = await Promise.all([
      supabase
        .from('cfdi_records')
        .select('id, folio, status, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'ERROR_PAC'),

      supabase
        .from('inventory')
        .select('sku, days_remaining, updated_at')
        .eq('tenant_id', tenant_id)
        .lte('days_remaining', 7),

      supabase
        .from('returns')
        .select('id, external_id, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'pending_approval'),

      supabase
        .from('purchase_orders')
        .select('id, created_at')
        .eq('tenant_id', tenant_id)
        .eq('status', 'DRAFT')
        .lt('created_at', yesterday),

      supabase
        .from('crisis_events')
        .select('id, event_type, created_at')
        .eq('tenant_id', tenant_id)
        .is('resolved_at', null),
    ]);

    const notifications: Notification[] = [];

    cfdis.data?.forEach((c: any) => {
      const type = 'cfdi_error';
      notifications.push({
        id:         `cfdi-${c.id}`,
        type,
        module:     moduleFor(type),
        message:    `Error en CFDI Folio: ${c.folio}`,
        priority:   'high',
        created_at: c.created_at,
      });
    });

    inventory.data?.forEach((i: any) => {
      const type = 'stock_critical';
      notifications.push({
        id:         `stock-${i.sku}`,
        type,
        module:     moduleFor(type),
        message:    `Stock crítico: ${i.sku} (${Math.round(i.days_remaining)} días restantes)`,
        priority:   i.days_remaining <= 2 ? 'critical' : 'high',
        created_at: i.updated_at,
      });
    });

    returns.data?.forEach((r: any) => {
      const type = 'return_pending';
      notifications.push({
        id:         `return-${r.id}`,
        type,
        module:     moduleFor(type),
        message:    `Devolución pendiente: ${r.external_id || r.id}`,
        priority:   'medium',
        created_at: r.created_at,
      });
    });

    pos.data?.forEach((po: any) => {
      const type = 'po_pending';
      notifications.push({
        id:         `po-${po.id}`,
        type,
        module:     moduleFor(type),
        message:    `Orden de compra estancada en borrador > 24h`,
        priority:   'medium',
        created_at: po.created_at,
      });
    });

    crisis.data?.forEach((cr: any) => {
      const type = 'crisis_active';
      notifications.push({
        id:         `crisis-${cr.id}`,
        type,
        module:     moduleFor(type),
        message:    `Evento de crisis activo: ${cr.event_type}`,
        priority:   'critical',
        created_at: cr.created_at,
      });
    });

    // Sort: priority descending, then date descending
    const PRIORITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      const pd = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      if (pd !== 0) return pd;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json(notifications.slice(0, 50));

  } catch (error: any) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
