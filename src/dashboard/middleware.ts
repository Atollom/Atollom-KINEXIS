import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // getUser() validates the token server-side — required by @supabase/ssr in middleware
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Page route protection ───────────────────────────────────────────────────
  const isPageRoute =
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico' &&
    pathname !== '/robots.txt';

  if (isPageRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── API route protection ────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/health') return response;
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};