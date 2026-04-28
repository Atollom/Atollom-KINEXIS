import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  // ── 1. Verificar token ───────────────────────────────────────────
  // Priority: Authorization Bearer header (sent by client panel)
  // Fallback: SSR cookie session (internal callers)
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId: string | null = null;
  let userEmail: string | null = null;

  if (bearerToken) {
    // Validate JWT against Supabase — works regardless of cookie config
    const supabaseJwt = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabaseJwt.auth.getUser(bearerToken);
    if (error || !user) {
      console.error('[Samantha] Invalid bearer token:', error?.message);
      return NextResponse.json({
        error: 'Token inválido',
        response: 'Tu sesión expiró. Por favor recarga la página e inicia sesión de nuevo.'
      }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email ?? null;
    console.log(`[Samantha] Token valid — user: ${userEmail} (${userId})`);
  } else {
    // Fallback: SSR cookie
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        error: 'Sin sesión',
        response: 'No tienes sesión activa. Por favor inicia sesión para usar Samantha.'
      }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email ?? null;
    console.log(`[Samantha] Cookie session — user: ${userEmail} (${userId})`);
  }

  // ── 2. Lookup tenant via SERVICE ROLE (bypasses RLS) ────────────
  // Anon key is blocked by RLS on the users table.
  const admin = createServiceClient();
  const SELECT = 'tenant_id, role, full_name, tenants(plan, name)';

  let profile: any = null;

  // Primary: by supabase_user_id
  const { data: byId, error: errById } = await admin
    .from('users')
    .select(SELECT)
    .eq('supabase_user_id', userId)
    .maybeSingle();

  console.log(`[Samantha] Lookup by supabase_user_id=${userId}:`, byId, errById?.message);
  profile = byId;

  // Fallback: by email + auto-backfill supabase_user_id
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
      response: `Tu cuenta (${userEmail}) está autenticada pero no tiene perfil en KINEXIS. Contacta al administrador o completa el onboarding.`
    }, { status: 403 });
  }

  console.log(`[Samantha] Profile found — tenant_id: ${profile.tenant_id}, role: ${profile.role}`);

  // ── 3. Call Python backend ───────────────────────────────────────
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
        session_id: body.session_id ?? null
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Samantha] Backend error ${response.status}:`, errText);
      throw new Error(`Backend ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[Samantha] Response OK — credits_remaining: ${data.credits_remaining}`);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Samantha Chat API] Error:', error.message);
    return NextResponse.json({
      error: error.message,
      response: 'Hubo un error de conexión con mis sistemas centrales. ¿Puedes intentarlo nuevamente?'
    }, { status: 500 });
  }
}
