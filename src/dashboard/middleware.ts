import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/unauthorized', '/api/health']

// E2E test bypass — set PLAYWRIGHT_BYPASS_AUTH=true in test environment only
const E2E_BYPASS = process.env.PLAYWRIGHT_BYPASS_AUTH === 'true'

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isStaticAsset(pathname: string): boolean {
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$/.test(pathname)
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    if (isStaticAsset(pathname)) return NextResponse.next()
    if (E2E_BYPASS) return NextResponse.next()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Env vars missing → fail open (let pages handle auth)
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Middleware] Missing Supabase env vars — skipping auth check')
      return NextResponse.next()
    }

    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    // Unauthenticated on protected route → login
    if (!user && !isPublic(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authenticated on /login → dashboard
    if (user && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // API routes: 401 if unauthenticated
    if (!user && pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // RBAC moved to page components (fail-safe: middleware only checks auth)
    return response

  } catch (error) {
    console.error('[Middleware Error]', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
