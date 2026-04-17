import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '@/types';

// Route → minimum allowed roles (empty array = all authenticated users)
const ROUTE_ROLES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: '/atollom',       roles: ['atollom_admin'] },
  { prefix: '/settings',      roles: ['owner', 'admin', 'socia', 'atollom_admin'] },
  { prefix: '/onboarding',    roles: ['owner', 'admin', 'socia', 'atollom_admin'] },
  { prefix: '/erp/cfdi',      roles: ['owner', 'admin', 'socia', 'atollom_admin', 'contador'] },
  { prefix: '/erp/accounting',roles: ['owner', 'admin', 'socia', 'atollom_admin', 'contador'] },
  { prefix: '/erp/finance',   roles: ['owner', 'admin', 'socia', 'atollom_admin', 'contador'] },
  { prefix: '/erp/tax',       roles: ['owner', 'admin', 'socia', 'atollom_admin', 'contador'] },
  { prefix: '/erp',           roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse', 'contador'] },
  { prefix: '/warehouse',     roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'] },
  { prefix: '/crm',           roles: ['owner', 'admin', 'socia', 'atollom_admin', 'agente'] },
  { prefix: '/meta',          roles: ['owner', 'admin', 'socia', 'atollom_admin', 'agente'] },
  { prefix: '/ecommerce',     roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'] },
  { prefix: '/amazon',        roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'] },
  { prefix: '/shopify',       roles: ['owner', 'admin', 'socia', 'atollom_admin', 'almacenista', 'warehouse'] },
];

function isAllowed(pathname: string, role: UserRole): boolean {
  const rule = ROUTE_ROLES.find(r => pathname.startsWith(r.prefix));
  if (!rule) return true; // no rule = open to all authenticated users
  return (rule.roles as string[]).includes(role);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Skip static/public assets ──────────────────────────────────────────────
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/unauthorized') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt';

  // ── Auth check (all non-public page routes) ────────────────────────────────
  const isPageRoute = !pathname.startsWith('/api/') && !isPublic;

  if (isPageRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated user away from login
  if (pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── API route protection ────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') return response;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return response; // API role checks happen inside route handlers
  }

  // ── RBAC for page routes ────────────────────────────────────────────────────
  if (user && isPageRoute) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = (profile?.role ?? 'viewer') as UserRole;

    if (!isAllowed(pathname, role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
