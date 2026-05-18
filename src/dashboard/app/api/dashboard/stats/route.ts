import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

// Sandbox demo stats — shown when the tenant has no real data yet
const SANDBOX_STATS = {
  products: 142,
  orders: 87,
  invoices: 34,
  revenue_30d: 284_500,
  source: 'sandbox',
};

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado', status: 401 }, { status: 401 });
  }

  try {
    const { tenant_id } = auth;
    const backendUrl = process.env.PYTHON_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/dashboard/stats/${tenant_id}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) throw new Error(`Backend error: ${response.statusText}`);

    const data = await response.json();

    // If tenant has no data yet, return sandbox demo stats so the dashboard looks live
    const isEmpty = !data.products && !data.orders && !data.revenue_30d;
    if (isEmpty) {
      return NextResponse.json(SANDBOX_STATS);
    }

    return NextResponse.json({
      products: data.products || 0,
      orders: data.orders || 0,
      invoices: data.invoices || 0,
      revenue_30d: data.revenue_30d || 0,
      source: 'live',
    });
  } catch (error: any) {
    console.error('[Dashboard Stats API] Error:', error);
    // Fallback to sandbox stats — never show zeros on a fresh tenant
    return NextResponse.json(SANDBOX_STATS);
  }
}
