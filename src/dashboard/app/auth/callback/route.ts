import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback]', exchangeError.message)
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if this user already has a KINEXIS account (= completed onboarding)
  const serviceClient = createServiceClient()
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  // New user — no tenant yet, send to onboarding wizard
  if (!existingUser) {
    return NextResponse.redirect(new URL('/onboarding', origin))
  }

  return NextResponse.redirect(new URL('/dashboard', origin))
}
