import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(_req: NextRequest) {
  const supabase = createClient();

  // Validate session — getUser() re-checks with Supabase server (secure)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Try DB profile first; fall back to JWT metadata (handles users not yet in `users` table)
  const auth = await getAuthenticatedTenant(supabase);
  const tenantId = auth?.tenant_id ?? (user.user_metadata?.tenant_id as string | undefined);

  if (!tenantId) {
    return NextResponse.json({ urgencies: [], total_issues: 0 });
  }

  // Forward session token to Python backend so it can validate RBAC
  const { data: { session } } = await supabase.auth.getSession();

  try {
    const backendUrl =
      process.env.PYTHON_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'http://localhost:8000';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${backendUrl}/api/dashboard/urgencies/${tenantId}`, {
      headers,
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Dashboard Urgencies API] Error:', msg);
    return NextResponse.json({ urgencies: [], total_issues: 0, error: msg });
  }
}
