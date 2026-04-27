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
    const backendUrl = process.env.PYTHON_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
    
    // Llamar al endpoint del backend (FastAPI + psycopg2)
    const response = await fetch(`${backendUrl}/api/dashboard/stats/${tenant_id}`, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': ... si el backend requiere auth interna
      },
      next: { revalidate: 60 } // Cachear 60 segundos si es necesario, o force-cache
    });

    if (!response.ok) {
      throw new Error(`Error en backend: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      products: data.products || 0,
      orders: data.orders || 0,
      invoices: data.invoices || 0,
      revenue_30d: data.revenue_30d || 0,
    });
  } catch (error: any) {
    console.error('[Dashboard Stats API] Error:', error);
    // Fallback silencioso para no romper el dashboard
    return NextResponse.json({ 
      products: 0,
      orders: 0,
      invoices: 0,
      revenue_30d: 0,
      error: error.message
    });
  }
}
