// src/dashboard/app/api/crm/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';
import type { LeadStage } from '@/types';

// Map raw DB deal_stage to typed LeadStage; fallback to 'new'
const STAGE_MAP: Record<string, LeadStage> = {
  new:         'new',
  contacted:   'contacted',
  quote_sent:  'quote_sent',
  negotiating: 'negotiating',
  won:         'won',
  lost:        'lost',
  // Spanish aliases a tenant might store
  nuevo:       'new',
  contactado:  'contacted',
  cotizado:    'quote_sent',
  negociando:  'negotiating',
  ganado:      'won',
  perdido:     'lost',
};

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, company, source, score, deal_stage, updated_at, estimated_value, assigned_agent')
      .eq('tenant_id', tenant_id)
      .order('score', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const formattedLeads = (leads || []).map(l => ({
      lead_id:       l.id,
      name:          l.name || 'Sin nombre',
      company:       l.company || (l.source === 'b2b' ? 'B2B' : 'Individual'),
      channel:       l.source || 'web',
      score:         typeof l.score === 'number' ? l.score : 0,
      deal_stage:    STAGE_MAP[String(l.deal_stage || '').toLowerCase()] ?? 'new',
      last_activity: l.updated_at,
      assigned_to:   l.assigned_agent || 'IA Agent',
      value:         l.estimated_value ?? undefined,
    }));

    return NextResponse.json(formattedLeads);

  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
