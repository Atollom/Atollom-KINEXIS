// src/dashboard/app/api/meta/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;

    // Obtener las últimas conversaciones de WhatsApp
    // Supabase no tiene un "GROUP BY" directo que devuelva el objeto completo fácilmente en PostgREST,
    // así que obtenemos los mensajes recientes y agrupamos en memoria.
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('contact_phone, message_text, direction, intent_classification, created_at, status')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    const convMap: Record<string, any> = {};
    (messages || []).forEach(m => {
      if (!convMap[m.contact_phone]) {
        convMap[m.contact_phone] = {
          contact: m.contact_phone,
          channel: 'whatsapp',
          last_message: m.message_text,
          intent: m.intent_classification || 'unknown',
          unread_count: m.status === 'received' ? 1 : 0, // Simplificado
          last_activity: m.created_at
        };
      } else if (m.status === 'received' && new Date(m.created_at) > new Date(Date.now() - 3600000)) {
        // Incrementar unread si es reciente (ejemplo lógico)
        convMap[m.contact_phone].unread_count++;
      }
    });

    return NextResponse.json(Object.values(convMap).slice(0, 50));

  } catch (error: any) {
    console.error('[Meta Conversations API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
