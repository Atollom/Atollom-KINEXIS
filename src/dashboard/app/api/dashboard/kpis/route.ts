// src/dashboard/app/api/dashboard/kpis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado', status: 401 }, { status: 401 });
  }

  try {
    const { tenant_id } = auth;

    // 1. Orders and Revenue Today — CDMX timezone (not naive UTC-6; uses locale string)
    const cdmxStr = new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
    const cdmxDate = new Date(cdmxStr);
    const y = cdmxDate.getFullYear();
    const m = String(cdmxDate.getMonth() + 1).padStart(2, '0');
    const d = String(cdmxDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const { data: ordersData } = await supabase
      .from('orders')
      .select('total, status')
      .eq('tenant_id', tenant_id)
      .gte('created_at', `${dateStr}T00:00:00Z`)
      .lte('created_at', `${dateStr}T23:59:59Z`)
      .not('status', 'in', '("cancelled","returned")');

    const orders_today = ordersData?.length || 0;
    const revenue_today = ordersData?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;

    // 2. Pending to Pick
    const { count: pending_to_pick } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('status', 'APPROVED');

    // 3. Critical Stock Count (using tenant_business_rules)
    // Primero obtener los umbrales
    const { data: businessRules } = await supabase
      .from('tenant_business_rules')
      .select('stock_critical_days')
      .eq('tenant_id', tenant_id)
      .single();

    const criticalThreshold = businessRules?.stock_critical_days || 7;

    const { count: critical_stock_count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .lte('days_remaining', criticalThreshold);

    // 4. Active Agents (tenant_agent_config + logs)
    const { data: activeAgentsData } = await supabase
      .from('tenant_agent_config')
      .select('agent_id')
      .eq('tenant_id', tenant_id)
      .eq('active', true)
      .neq('autonomy_level', 'PAUSED');

    const active_agents = activeAgentsData?.length || 0;

    // 5. CFDI Pending
    const { count: cfdi_pending } = await supabase
      .from('cfdi_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .in('status', ['ERROR_PAC', 'ERROR_VALIDACION', 'CANCELACION_PENDIENTE']);

    return NextResponse.json({
      orders_today,
      pending_to_pick: pending_to_pick || 0,
      critical_stock_count: critical_stock_count || 0,
      active_agents,
      revenue_today,
      cfdi_pending: cfdi_pending || 0,
    });
  } catch (error: any) {
    console.error('[KPIs API] Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      code: 'INTERNAL_ERROR', 
      status: 500 
    }, { status: 500 });
  }
}
