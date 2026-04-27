import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import { createBrowserClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  // ── 1. Verificar sesión ──────────────────────────────────────────
  // Prioridad: Authorization header (enviado por el panel cliente)
  // Fallback: cookies SSR (route handlers internos, tests)
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId: string | null = null;
  let userEmail: string | null = null;

  if (bearerToken) {
    // Validar JWT directamente con Supabase
    const supabaseJwt = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabaseJwt.auth.getUser(bearerToken);
    if (error || !user) {
      return NextResponse.json({
        error: 'Token inválido',
        response: 'Tu sesión expiró. Por favor recarga la página e inicia sesión de nuevo.'
      }, { status: 401 });
    }
    userId = user.id;
    userEmail = user.email ?? null;
  } else {
    // Fallback cookies SSR
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
  }

  // ── 2. Obtener tenant_id desde la tabla users ────────────────────
  const supabaseAdmin = createClient();
  const SELECT = 'tenant_id, role, full_name, tenants(plan, name)';

  let profile: any = null;

  // Buscar por supabase_user_id
  const byId = await supabaseAdmin
    .from('users')
    .select(SELECT)
    .eq('supabase_user_id', userId)
    .maybeSingle();

  profile = byId.data;

  // Fallback por email + backfill supabase_user_id
  if (!profile && userEmail) {
    const byEmail = await supabaseAdmin
      .from('users')
      .select(SELECT)
      .eq('email', userEmail)
      .maybeSingle();

    if (byEmail.data) {
      profile = byEmail.data;
      await supabaseAdmin
        .from('users')
        .update({ supabase_user_id: userId })
        .eq('email', userEmail);
    }
  }

  if (!profile) {
    console.error('[Samantha] Sin perfil en users:', userEmail);
    return NextResponse.json({
      error: 'Perfil no encontrado',
      response: `Tu cuenta (${userEmail}) está autenticada pero no tiene perfil en KINEXIS. Contacta al administrador o completa el onboarding.`
    }, { status: 403 });
  }

  // ── 3. Llamar al backend Python ──────────────────────────────────
  try {
    const body = await req.json();
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    const response = await fetch(`${backendUrl}/api/samantha/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: body.query,
        history: body.history || [],
        tenant_id: profile.tenant_id
      })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Samantha Chat API] Error:', error);
    return NextResponse.json({
      error: error.message,
      response: 'Hubo un error de conexión con mis sistemas centrales. ¿Puedes intentarlo nuevamente?'
    }, { status: 500 });
  }
}
