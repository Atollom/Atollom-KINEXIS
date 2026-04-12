// src/dashboard/app/api/crm/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenant_id)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(tickets.map(t => ({
      ticket_id: t.id,
      order_id: t.order_id,
      contact: t.contact_phone,
      issue_type: t.issue_type,
      status: t.status,
      turn_count: t.turn_count,
      created_at: t.created_at
    })));
  } catch (error: any) {
    console.error('[Tickets GET] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { order_id, contact, issue_type } = await req.json();

    if (!contact || !issue_type) {
      return NextResponse.json({ error: 'Contacto y tipo de problema son requeridos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        tenant_id: auth.tenant_id,
        order_id,
        contact_phone: contact,
        issue_type,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Tickets POST] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { ticket_id, status } = await req.json();

    if (!ticket_id || !status) {
      return NextResponse.json({ error: 'ticket_id y status son requeridos' }, { status: 400 });
    }

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticket_id)
      .eq('tenant_id', auth.tenant_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Tickets PATCH] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
