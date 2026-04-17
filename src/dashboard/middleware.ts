import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type RolePermissions = {
  allowed: string[]
  readonly?: string[]
  denied: string[]
}

const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  owner: {
    allowed: ['/dashboard', '/ecommerce', '/crm', '/erp', '/settings', '/warehouse', '/meta', '/onboarding'],
    denied: ['/atollom'],
  },
  admin: {
    allowed: ['/dashboard', '/ecommerce', '/crm', '/erp', '/settings', '/warehouse', '/meta', '/onboarding'],
    denied: ['/atollom'],
  },
  socia: {
    allowed: ['/dashboard', '/ecommerce', '/crm', '/erp', '/settings', '/warehouse', '/meta', '/onboarding'],
    denied: ['/atollom'],
  },
  agente: {
    allowed: ['/dashboard', '/crm', '/meta'],
    readonly: ['/ecommerce'],
    denied: ['/erp/cfdi', '/erp/accounting', '/erp/finance', '/settings', '/atollom'],
  },
  almacenista: {
    allowed: ['/dashboard', '/ecommerce', '/erp/inventory', '/erp/procurement', '/warehouse'],
    readonly: ['/crm'],
    denied: ['/crm/pipeline', '/erp/cfdi', '/erp/finance', '/erp/accounting', '/settings', '/atollom'],
  },
  warehouse: {
    allowed: ['/dashboard', '/ecommerce', '/erp/inventory', '/erp/procurement', '/warehouse'],
    readonly: ['/crm'],
    denied: ['/erp/cfdi', '/erp/finance', '/erp/accounting', '/settings', '/atollom'],
  },
  contador: {
    allowed: ['/dashboard', '/erp/cfdi', '/erp/accounting', '/erp/finance', '/erp/tax', '/erp/cashflow'],
    readonly: ['/ecommerce', '/crm'],
    denied: ['/crm/pipeline', '/settings', '/atollom'],
  },
  atollom_admin: {
    allowed: ['/dashboard', '/atollom'],
    readonly: ['/ecommerce', '/crm', '/erp', '/warehouse', '/meta'],
    denied: ['/settings'],
  },
}

const PUBLIC_PATHS = ['/login', '/unauthorized', '/api/health']

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/api/') || /\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$/.test(pathname)
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const { pathname } = request.nextUrl

  // Skip static assets and health endpoint
  if (isStaticAsset(pathname)) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Unauthenticated → login
  if (!user && !isPublic(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated on login → dashboard
  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // API routes: 401 if unauthenticated (except /api/health already skipped above)
  if (!user && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // RBAC for page routes
  if (user && !isPublic(pathname) && !pathname.startsWith('/api/')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role ?? 'viewer') as string
    const permissions = ROLE_PERMISSIONS[role]

    if (permissions) {
      const isDenied = permissions.denied.some(p => pathname.startsWith(p))
      if (isDenied) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      const hasAccess = permissions.allowed.some(p => pathname.startsWith(p))
      const isReadonly = permissions.readonly?.some(p => pathname.startsWith(p)) ?? false

      if (!hasAccess && !isReadonly) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (isReadonly) {
        response.headers.set('X-Access-Mode', 'readonly')
      }
    }
    // No permissions entry (e.g. 'viewer') → allow dashboard only
    else if (!pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
