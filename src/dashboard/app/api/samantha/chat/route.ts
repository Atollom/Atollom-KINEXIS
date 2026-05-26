import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase';

const ONBOARDING_SYSTEM_PROMPT = `Eres Samantha, concierge personal de KINEXIS.

Tu rol es como un concierge de hotel 5 estrellas:
- Amable, profesional, proactiva
- Guías al usuario en configurar su cuenta
- Haces preguntas inteligentes para entender su negocio
- Capturas información importante (giro, plataformas, equipo)
- Anticipas necesidades

El usuario está en onboarding. Ayúdalo a:
1. Entender qué es KINEXIS y cómo beneficia su negocio
2. Configurar su empresa (nombre, RFC, giro)
3. Elegir las integraciones correctas (ML, Amazon, Shopify, WhatsApp)
4. Entender los planes de facturación
5. Invitar a su equipo

Haz preguntas una a la vez. Sé conversacional, no formal. Usa emojis con moderación.`;

export async function POST(req: NextRequest) {
  const admin = createServiceClient();
  const body = await req.json();
  const isOnboarding = body.context?.page === 'onboarding';

  // ── 1. Resolve Supabase user identity ────────────────────────────
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  let userId: string | null = null;
  let userEmail: string | null = null;

  if (bearerToken) {
    const { data: { user }, error } = await admin.auth.getUser(bearerToken);
    if (!error && user) {
      userId = user.id;
      userEmail = user.email ?? null;
    }
  }

  // Fallback: SSR cookie session
  if (!userId) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      userEmail = user.email ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json({
      error: 'Sin sesión',
      response: 'No tienes sesión activa. Por favor inicia sesión para usar Samantha.',
    }, { status: 401 });
  }

  // ── 2. Lookup tenant profile (optional for onboarding) ───────────
  let tenantId: string | null = body.tenant_id ?? null;
  let profile: Record<string, any> | null = null;

  const { data: byId } = await admin
    .from('users')
    .select('tenant_id, role, full_name, tenants(plan, name)')
    .eq('supabase_user_id', userId)
    .maybeSingle();

  profile = byId;

  if (!profile && userEmail) {
    const { data: byEmail } = await admin
      .from('users')
      .select('tenant_id, role, full_name, tenants(plan, name)')
      .eq('email', userEmail)
      .maybeSingle();

    if (byEmail) {
      profile = byEmail;
      // Backfill supabase_user_id for future lookups
      await admin.from('users').update({ supabase_user_id: userId }).eq('email', userEmail);
    }
  }

  if (profile) {
    tenantId = profile.tenant_id;
  }

  // Onboarding mode: allow chat without an existing tenant profile
  if (!profile && !isOnboarding) {
    return NextResponse.json({
      error: 'Perfil no encontrado',
      response: `Tu cuenta (${userEmail}) está autenticada pero no tiene perfil en KINEXIS. Contacta al administrador.`,
    }, { status: 403 });
  }

  // ── 3. Call Python backend ────────────────────────────────────────
  try {
    const backendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

    // For onboarding mode without a tenant, use the onboarding system prompt
    // and a nil UUID so the Python backend can skip credits/context checks
    const effectiveTenantId = tenantId ?? '00000000-0000-0000-0000-000000000000';
    const systemPrompt = isOnboarding ? ONBOARDING_SYSTEM_PROMPT : undefined;

    const response = await fetch(`${backendUrl}/api/samantha/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: body.query,
        history: body.history || [],
        tenant_id: effectiveTenantId,
        supabase_user_id: userId,
        session_id: body.session_id ?? null,
        ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
        context: body.context ?? null,
        ...(body.attachments?.length ? { attachments: body.attachments } : {}),
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Samantha] Backend error ${response.status}:`, errText);
      throw new Error(`Backend ${response.status}`);
    }

    const data = await response.json();
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
