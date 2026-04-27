import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Detectar si hay sesión antes de intentar el perfil
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({
      error: 'Sin sesión',
      response: 'No tienes sesión activa. Por favor inicia sesión para usar Samantha.'
    }, { status: 401 });
  }

  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    // Usuario autenticado en Supabase pero sin perfil en la tabla `users`
    console.error('[Samantha] Usuario autenticado sin perfil en users:', user.email);
    return NextResponse.json({
      error: 'Perfil no encontrado',
      response: `Hola, tu cuenta (${user.email}) está autenticada pero no tiene perfil configurado en KINEXIS. Contacta al administrador o completa el onboarding.`
    }, { status: 403 });
  }

  try {
    const { tenant_id } = auth;
    const body = await req.json();
    
    const backendUrl = process.env.PYTHON_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';
    
    // Llamar al endpoint del backend (FastAPI + mock)
    const response = await fetch(`${backendUrl}/api/samantha/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        history: body.history || [],
        tenant_id: tenant_id
      })
    });

    if (!response.ok) {
      throw new Error(`Error en backend: ${response.statusText}`);
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
