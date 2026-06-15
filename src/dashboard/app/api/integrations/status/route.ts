import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const auth = { Authorization: `Bearer ${session.access_token}` }

  const [ml, meta, amazon] = await Promise.allSettled([
    fetch(`${BACKEND}/api/integrations/ml/status`,     { headers: auth }).then(r => r.json()),
    fetch(`${BACKEND}/api/integrations/meta/status`,   { headers: auth }).then(r => r.json()),
    fetch(`${BACKEND}/api/integrations/amazon/status`, { headers: auth }).then(r => r.json()),
  ])

  return NextResponse.json({
    ml:     ml.status     === 'fulfilled' ? ml.value     : { connected: false },
    meta:   meta.status   === 'fulfilled' ? meta.value   : { connected: false },
    amazon: amazon.status === 'fulfilled' ? amazon.value : { connected: false },
  })
}
