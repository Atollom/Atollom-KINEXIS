import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, phone, message } = body

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Nombre, email y empresa son requeridos' }, { status: 400 })
    }

    // Persist to Supabase if available — silently skip on error
    try {
      const supabase = createClient()
      await supabase.from('demo_leads').insert({
        name,
        email,
        company,
        phone: phone || null,
        message: message || null,
        source: 'landing_page',
      })
    } catch {
      // Table may not exist yet — non-blocking
    }

    console.log(`[Demo Request] ${name} <${email}> — ${company}`)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[Demo Request] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
