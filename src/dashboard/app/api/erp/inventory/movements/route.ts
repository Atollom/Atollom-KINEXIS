// src/dashboard/app/api/erp/inventory/movements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;
    const { searchParams } = new URL(req.url);

    const sku = searchParams.get('sku');
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Join con products vía SKU
    // Nota: La relación en Supabase/PostgREST para joins no-FK requiere sintaxis específica o vista.
    // Asumiremos que products está vinculado o usaremos una selección plana si no hay FK directa.
    // Dado que sku es el link, usamos:
    let query = supabase
      .from('inventory_movements')
      .select(`
        id,
        sku,
        movement_type,
        qty_change,
        qty_after,
        platform,
        created_at
      `)
      .eq('tenant_id', tenant_id)
      .gte('created_at', startDate.toISOString());

    if (sku) {
      query = query.eq('sku', sku);
    }

    const { data: movements, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Obtener nombres de productos para los SKUs involucrados
    const skus = Array.from(new Set(movements?.map(m => m.sku) || []));
    const { data: products } = await supabase
      .from('products')
      .select('sku, name')
      .in('sku', skus)
      .eq('tenant_id', tenant_id);

    const productMap = (products || []).reduce((acc: any, curr: any) => {
      acc[curr.sku] = curr.name;
      return acc;
    }, {});

    const formatted = (movements || []).map(m => ({
      ...m,
      product_name: productMap[m.sku] || 'Producto desconocido'
    }));

    return NextResponse.json(formatted);

  } catch (error: any) {
    console.error('[Inventory Movements API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
