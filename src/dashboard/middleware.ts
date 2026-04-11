// src/dashboard/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();

  // 1. Proteger todas las rutas /dashboard/*
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // 2. Validar roles para API routes sensibles
  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!session) {
      return NextResponse.json({ error: 'No autorizado', status: 401 }, { status: 401 });
    }

    // Obtener rol del perfil
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role;

    // RBAC: /api/warehouse/* → warehouse | admin | owner
    if (req.nextUrl.pathname.startsWith('/api/warehouse')) {
      if (!['warehouse', 'admin', 'owner'].includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente', status: 403 }, { status: 403 });
      }
    }

    // RBAC: /api/cfdi/* → contador | admin | owner
    if (req.nextUrl.pathname.startsWith('/api/cfdi')) {
      if (!['contador', 'admin', 'owner'].includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente', status: 403 }, { status: 403 });
      }
    }

    // RBAC: /api/agents/* → admin | owner
    if (req.nextUrl.pathname.startsWith('/api/agents')) {
      if (!['admin', 'owner'].includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente', status: 403 }, { status: 403 });
      }
    }

    // RBAC: /api/dashboard/* → admin | owner
    if (req.nextUrl.pathname.startsWith('/api/dashboard')) {
      if (!['admin', 'owner'].includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente', status: 403 }, { status: 403 });
      }
    }

    // RBAC: /api/inventory/* → warehouse | admin | owner
    if (req.nextUrl.pathname.startsWith('/api/inventory')) {
      if (!['warehouse', 'admin', 'owner'].includes(role)) {
        return NextResponse.json({ error: 'Prohibido: Rol insuficiente', status: 403 }, { status: 403 });
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};
