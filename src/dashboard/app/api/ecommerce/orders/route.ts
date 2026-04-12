// src/dashboard/app/api/ecommerce/orders/route.ts
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

    const platform = searchParams.get('platform') || 'all';
    const status = searchParams.get('status') || 'all';
    const dateRange = searchParams.get('date') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('orders')
      .select(`
        id,
        external_id,
        platform,
        status,
        total,
        total_mxn,
        customer_name,
        created_at,
        order_items (
          quantity,
          products (name)
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant_id);

    // Filters
    if (platform !== 'all') query = query.eq('platform', platform);
    if (status !== 'all') query = query.eq('status', status);

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === 'today') startDate.setHours(0, 0, 0, 0);
      else if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
      else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
      
      query = query.gte('created_at', startDate.toISOString());
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      orders: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('[Orders API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
