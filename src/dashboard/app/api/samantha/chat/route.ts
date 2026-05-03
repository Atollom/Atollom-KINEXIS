import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // Single admin client — used for both JWT validation and DB queries.
  // Replaces createBrowserClient (browser-only) which was causing
  // inconsistent behavior on consecutive server-side requests.
  const admin = createServiceClient();

  // ── 1. Resolve user identity ─────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId: string | null = null;
  let userEmail: string | null = null;

  if (bearerToken) {
    const { data: { user }, error } = await admin.auth.getUser(bearerToken);
    if (error || !user) {
      console.error('[Samantha] Invalid bearer token:', error?.message);
      return NextResponse.json({
        error: 'Token inválido',
        response: 'Tu sesión expiró. Por favor recarga la página e inicia sesión de nuevo.',
      }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email ?? null;
    console.log(`[Samantha] Token valid — user: ${userEmail} (${userId})`);
  } else {
    // Fallback: SSR cookie session
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        error: 'Sin sesión',
        response: 'No tienes sesión activa. Por favor inicia sesión para usar Samantha.',
      }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email ?? null;
    console.log(`[Samantha] Cookie session — user: ${userEmail} (${userId})`);
  }

  // ── 2. Lookup tenant (service role bypasses RLS) ─────────────────
  const SELECT = 'tenant_id, role, full_name, tenants(plan, name)';
  let profile: Record<string, any> | null = null;

  const { data: byId, error: errById } = await admin
    .from('users')
    .select(SELECT)
    .eq('supabase_user_id', userId)
    .maybeSingle();

  console.log(`[Samantha] Lookup by supabase_user_id=${userId}:`, byId, errById?.message);
  profile = byId;

  if (!profile && userEmail) {
    const { data: byEmail, error: errByEmail } = await admin
      .from('users')
      .select(SELECT)
      .eq('email', userEmail)
      .maybeSingle();

    console.log(`[Samantha] Fallback by email=${userEmail}:`, byEmail, errByEmail?.message);

    if (byEmail) {
      profile = byEmail;
      await admin
        .from('users')
        .update({ supabase_user_id: userId })
        .eq('email', userEmail);
      console.log(`[Samantha] Backfilled supabase_user_id for ${userEmail}`);
    }
  }

  if (!profile) {
    console.error(`[Samantha] No profile found for user ${userEmail} (${userId})`);
    return NextResponse.json({
      error: 'Perfil no encontrado',
      response: `Tu cuenta (${userEmail}) está autenticada pero no tiene perfil en KINEXIS. Contacta al administrador.`,
    }, { status: 403 });
  }

  console.log(`[Samantha] Profile found — tenant_id: ${profile.tenant_id}, role: ${profile.role}`);

  // ── 3. Call Python backend ────────────────────────────────────────
  try {
    const body = await req.json();
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    console.log(`[Samantha] Calling backend ${backendUrl}/api/samantha/chat — tenant: ${profile.tenant_id}`);

    const response = await fetch(`${backendUrl}/api/samantha/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: body.query,
        history: body.history || [],
        tenant_id: profile.tenant_id,
        supabase_user_id: userId,
        session_id: body.session_id ?? null,
      }),
      // 25s timeout — stays under Vercel's 30s serverless limit
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Samantha] Backend error ${response.status}:`, errText);
      throw new Error(`Backend ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    console.log(`[Samantha] Response OK — credits_remaining: ${data.credits_remaining}`);
    return NextResponse.json(data);

  } catch (error: any) {
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    console.error('[Samantha Chat API] Error:', error.name, error.message);
    return NextResponse.json({
      error: error.message,
      response: isTimeout
        ? 'Samantha está tardando más de lo esperado. Intenta nuevamente en unos segundos.'
        : 'Hubo un error de conexión con mis sistemas centrales. ¿Puedes intentarlo nuevamente?',
    }, { status: 500 });
  }
}
