// src/dashboard/app/api/agents/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getAuthenticatedTenant } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const auth = await getAuthenticatedTenant(supabase);

  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { tenant_id } = auth;

    // 1. Obtener configuración de agentes del tenant
    const { data: configs, error: configError } = await supabase
      .from('tenant_agent_config')
      .select('agent_id, name, module, autonomy_level, active')
      .eq('tenant_id', tenant_id);

    if (configError) throw configError;

    // 2. Obtener el último log de cada agente para determinar status real y last_run
    // Nota: Esto se puede optimizar con una vista o un query más complejo, 
    // pero para 43 agentes, un query filtrado es manejable.
    const { data: latestLogs } = await supabase
      .from('agent_execution_logs')
      .select('agent_id, status, finished_at')
      .eq('tenant_id', tenant_id)
      .order('finished_at', { ascending: false });

    // Mapear logs al mapa de agentes (solo el más reciente por agent_id)
    const logMap: Record<string, { status: string; finished_at: string }> = {};
    latestLogs?.forEach(log => {
      if (!logMap[log.agent_id]) {
        logMap[log.agent_id] = { status: log.status, finished_at: log.finished_at };
      }
    });

    // 3. Combinar datos
    const agents = configs?.map(config => {
      const log = logMap[config.agent_id];
      const status = !config.active || config.autonomy_level === 'PAUSED' 
        ? 'paused' 
        : (log?.status === 'success' ? 'active' : (log?.status === 'failed' ? 'error' : 'idle'));

      return {
        agent_id: config.agent_id,
        name: config.name,
        module: config.module,
        status: status,
        autonomy: config.autonomy_level,
        last_run: log?.finished_at || null,
        success_rate: 0.95 // Placeholder o cálculo basado en logs
      };
    });

    return NextResponse.json(agents || []);

  } catch (error: any) {
    console.error('[Agents Status API] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
