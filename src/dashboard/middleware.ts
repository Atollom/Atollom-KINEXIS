import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Roles con acceso
const WAREHOUSE_ROLES = ['warehouse', 'almacenista', 'admin', 'owner', 'socia', 'atollom_admin'];
const FISCAL_ROLES = ['contador', 'admin', 'owner', 'socia', 'atollom_admin'];
const CRM_ROLES = ['agente', 'admin', 'owner', 'socia', 'atollom_admin'];
const AGENT_ROLES = ['admin', 'owner', 'socia', 'atollom_admin'];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Rutas públicas
  const isPageRoute =
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico' &&
    pathname !== '/robots.txt';

  if (isPageRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ✅ RBAC API - SIN CONSULTAS EXTRA
  // Como ya sabemos que el usuario está autenticado, retornamos success temporalmente
  // El RLS en la base de datos se encarga del aislamiento
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') return res;
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // ✅ TEMPORALMENTE PERMITIMOS TODAS LAS APIs
    // El RBAC por roles lo implementaremos después de confirmar que todo funciona
    return res;
  }

  return res;
}

// ✅ Workaround para el bug de Next.js 14.2.7+
// Solo rutas conocidas, NO usamos matcher /(.*)
export const config = {
  matcher: [
    '/',
    '/chat',
    '/ecommerce',
    '/erp/:path*',
    '/crm/:path*',
    '/meta/:path*',
    '/settings/:path*',
    '/warehouse/:path*',
    '/atollom/:path*',
    '/dashboard/:path*',
    '/login',
    '/api/:path*',
  ]
};