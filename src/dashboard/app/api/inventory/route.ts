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

    // 3. Mapear status y campos esperados por la página de inventario
    const items = (inventory || []).map((item, idx) => {
      const days = typeof item.days_remaining === 'number' ? item.days_remaining : 999;
      const stock = item.stock ?? 0;

      let status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked' = 'in_stock';
      if (stock === 0) status = 'out_of_stock';
      else if (days <= critical) status = 'low_stock';
      else if (days <= safety)   status = 'low_stock';

      const productsRow = item.products as unknown as { name: string }[] | { name: string } | null;
      const productName = Array.isArray(productsRow)
        ? (productsRow[0]?.name || item.sku)
        : (productsRow?.name || item.sku);

      return {
        id:               item.sku,
        sku:              item.sku,
        name:             productName,
        category:         'General',
        warehouse:        'Almacén Principal',
        available:        stock,
        reserved:         0,
        reorder_point:    safety * 2,
        unit_cost:        0,
        total_value:      0,
        supplier:         '',
        reorder_quantity: 50,
        days_remaining:   days,
        status,
      };
    });

    const stats = {
      total_items:  items.length,
      total_value:  0,
      in_stock:     items.filter(i => i.status === 'in_stock').length,
      low_stock:    items.filter(i => i.status === 'low_stock').length,
      out_of_stock: items.filter(i => i.status === 'out_of_stock').length,
      overstocked:  items.filter(i => i.status === 'overstocked').length,
    };

    return NextResponse.json({ items, stats, source: 'supabase' });

  } catch (error: any) {
    console.error('[Inventory API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
