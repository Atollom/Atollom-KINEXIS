import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedTenant } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const auth = await getAuthenticatedTenant(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const googleApiKey = !!process.env.GOOGLE_API_KEY
  const anthropicKey = !!process.env.ANTHROPIC_API_KEY

  return NextResponse.json({
    status: googleApiKey || anthropicKey ? 'healthy' : 'degraded',
    providers: { gemini: googleApiKey, claude: anthropicKey },
    message: 'Samantha AI operational',
  })
}
