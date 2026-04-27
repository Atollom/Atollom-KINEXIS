import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
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
