// src/dashboard/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Roles with warehouse/inventory access
const WAREHOUSE_ROLES = ['warehouse', 'almacenista', 'admin', 'owner', 'socia'];
// Roles with fiscal/accounting access
const FISCAL_ROLES = ['contador', 'admin', 'owner', 'socia'];
// Roles with CRM/sales access
const CRM_ROLES = ['agente', 'admin', 'owner', 'socia'];
// Roles with agent management access
const AGENT_ROLES = ['admin', 'owner', 'socia'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // ── 1. Protect page routes ───────────────────────────────────────────────────
  // All routes except /login and static assets require authentication.
  // Page routes are anything that doesn't start with /api/, /login, or /_next.
  const isPageRoute =
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico' &&
    pathname !== '/robots.txt';

  if (isPageRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect already-authenticated users away from login
  if (pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ── 1b. Page-level RBAC for /settings ───────────────────────────────────────
  // viewer / agente / warehouse / almacenista / contador cannot access Settings.
  // They are redirected to / so they never see even the page skeleton.
  if (session && pathname.startsWith('/settings')) {
    const { data: settingsProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const settingsRole = settingsProfile?.role as string | undefined;
    if (!settingsRole || !['owner', 'admin', 'socia'].includes(settingsRole)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // ── 2. RBAC for API routes ───────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    // Public API routes (no auth required)
    if (pathname === '/api/health') return res;

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Fetch role once for all API RBAC checks
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role as string | undefined;

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 403 });
    }

    // /api/warehouse/* → warehouse roles
    if (pathname.startsWith('/api/warehouse')) {
      if (!WAREHOUSE_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/inventory/* → warehouse roles
    if (pathname.startsWith('/api/inventory')) {
      if (!WAREHOUSE_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/cfdi/* → fiscal roles
    if (pathname.startsWith('/api/cfdi')) {
      if (!FISCAL_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/erp/* → warehouse roles (ERP covers inventory, procurement, etc.)
    if (pathname.startsWith('/api/erp')) {
      if (!WAREHOUSE_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/crm/* → CRM roles
    if (pathname.startsWith('/api/crm')) {
      if (!CRM_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/meta/* → CRM roles (WhatsApp, Instagram)
    if (pathname.startsWith('/api/meta')) {
      if (!CRM_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/agents/* → agent management roles
    if (pathname.startsWith('/api/agents')) {
      if (!AGENT_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }

    // /api/dashboard/* → all authenticated roles (data is filtered per role in the route handler)
    // /api/ecommerce/* → all authenticated roles (ecommerce visible to owner/admin/socia)
    // /api/chat/* → all authenticated roles
    // /api/notifications/* → all authenticated roles
    // /api/settings/* → admin/owner/socia only
    if (pathname.startsWith('/api/settings')) {
      if (!AGENT_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente' }, { status: 403 });
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except Next.js internals and static files.
     * This ensures middleware runs on all page routes AND API routes.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
