// src/dashboard/app/api/ecommerce/ml-questions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;

    // TODO: En producción real, instanciar MLAdapter y llamar a get_unanswered_questions()
    // Por ahora, simulamos el comportamiento de "MOCK si no conectado" o fallback
    
    // Mock Data for Task 1
    const mockQuestions = [
      {
        question_id: '12345678',
        item_id: 'MLM1001',
        product_name: 'Kit de Herramientas Kap 45pzas',
        question_text: '¿Tienen disponibilidad inmediata para Puebla?',
        buyer_id: 'USER_ABC123',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        question_id: '12345679',
        item_id: 'MLM1002',
        product_name: 'Pinzas de Corte Industrial',
        question_text: '¿Facturan? Necesito para mi empresa.',
        buyer_id: 'USER_XYZ789',
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    return NextResponse.json(mockQuestions.slice(0, 20));

  } catch (error: any) {
    console.error('[ML Questions API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
