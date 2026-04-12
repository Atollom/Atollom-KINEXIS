// src/dashboard/app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;

    // 1. Obtener reglas de negocio (umbrales)
    const { data: businessRules } = await supabase
      .from('tenant_business_rules')
      .select('stock_safety_days, stock_critical_days')
      .eq('tenant_id', tenant_id)
      .single();

    const safety = businessRules?.stock_safety_days || 15;
    const critical = businessRules?.stock_critical_days || 7;

    // 2. Obtener inventario con velocity y product name
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select(`
        sku,
        stock,
        days_remaining,
        products (name)
      `)
      .eq('tenant_id', tenant_id);

    if (error) throw error;

    // 3. Mapear status basado en reglas
    const items = (inventory || []).map(item => {
      let status: 'ok' | 'warning' | 'critical' | 'out' = 'ok';
      const days = typeof item.days_remaining === 'number' ? item.days_remaining : 999;
      
      if (item.stock === 0) {
        status = 'out';
      } else if (days <= critical) {
        status = 'critical';
      } else if (days <= safety) {
        status = 'warning';
      }

      // `products` is a joined object; cast to access the name field
      const productRow = item.products as { name: string } | null;
      return {
        sku:           item.sku,
        name:          productRow?.name || item.sku,
        stock:         item.stock,
        days_remaining: days,
        status:        status,
      };
    });

    return NextResponse.json(items);

  } catch (error: any) {
    console.error('[Inventory API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
