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

// POST /api/meta/conversations — Enviar respuesta manual a un contacto
// Roles permitidos: owner, admin, socia, agente
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  if (!['owner', 'admin', 'socia', 'agente'].includes(auth.role)) {
    return NextResponse.json({ error: 'Prohibido: se requiere rol agente o superior' }, { status: 403 });
  }

  try {
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).contact !== 'string' ||
      typeof (body as Record<string, unknown>).message !== 'string' ||
      !['whatsapp', 'instagram'].includes((body as Record<string, unknown>).channel as string)
    ) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { contact, channel, message } = body as { contact: string; channel: string; message: string };

    // Registrar el mensaje saliente en la tabla correspondiente
    const table = channel === 'whatsapp' ? 'whatsapp_messages' : 'instagram_messages';
    const { error } = await supabase
      .from(table)
      .insert({
        tenant_id:    auth.tenant_id,
        contact_phone: contact,
        message_text: message,
        direction:    'outgoing',
        status:       'sent',
        sent_by:      auth.id,
        created_at:   new Date().toISOString(),
      });

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Meta Conversations POST] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
