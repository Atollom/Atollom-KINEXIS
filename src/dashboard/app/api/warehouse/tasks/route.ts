// src/dashboard/app/api/warehouse/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado', status: 401 }, { status: 401 });
  }

  // Verificar rol: warehouse | admin | owner
  if (!['warehouse', 'admin', 'owner'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido', status: 403 }, { status: 403 });
  }

  try {
    const { tenant_id } = auth;

    // Obtener órdenes aprobadas para pick
    // JOIN con order_items y products para nombres
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        external_id,
        platform,
        status,
        total,
        customer_name,
        created_at,
        order_items (
          quantity,
          products (name)
        )
      `)
      .eq('tenant_id', tenant_id)
      .eq('status', 'APPROVED');

    if (error) throw error;

    // 1. Transformar y expandir con info de tablas específicas (Amazon/Shopify)
    // Para simplificar, asumiremos que customer_info tiene los flags necesarios si existen
    // En una implementación real, se harían joins con amazon_orders y shopify_orders
    
    // 2. Ordenar por prioridad
    const sortedTasks = (orders || []).sort((a: any, b: any) => {
      const getPriority = (order: any) => {
        if (order.platform === 'ml') return 1;
        if (order.platform === 'amazon') {
          // Asumir same_day si existe en algún campo del order_items o si lo tenemos
          // Para este MVP, priorizamos Amazon general sobre Shopify
          return order.platform_metadata?.same_day ? 2 : 3;
        }
        if (order.platform === 'shopify') return 4;
        return 5;
      };
      return getPriority(a) - getPriority(b);
    });

    // 3. Totales
    const pending_count = sortedTasks.length;
    const { count: completed_today } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('status', 'SENT')
      .gte('updated_at', new Date().toISOString().split('T')[0]);

    return NextResponse.json({
      orders: sortedTasks.map((o: any) => ({
        order_id: o.id,
        external_id: o.external_id,
        platform: o.platform,
        status: o.status,
        customer_name: o.customer_name,
        // user requested: address (del customer_info JSONB)
        address: (o as any).customer_info?.address || 'Dirección no disponible',
        products: o.order_items?.map((item: any) => ({
          name: item.products?.name,
          qty: item.quantity
        })),
        priority: sortedTasks.indexOf(o) + 1,
        created_at: o.created_at
      })),
      pending_count,
      completed_count: completed_today || 0
    });

  } catch (error: any) {
    console.error('[Warehouse Tasks API] Error:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      status: 500 
    }, { status: 500 });
  }
}
