import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { tenant_id } = auth;
    const backendUrl =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/dashboard/urgencies/${tenant_id}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Dashboard Urgencies API] Error:', error);
    return NextResponse.json({ urgencies: [], total_issues: 0, error: error.message });
  }
}
