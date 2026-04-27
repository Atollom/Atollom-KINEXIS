// src/dashboard/lib/supabase.ts
// Server-side client (Route Handlers, Server Components, Middleware).
// Do NOT import this in Client Components — use supabase-browser.ts instead.
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route handlers may not be able to set cookies (e.g. read-only context)
          }
        },
      },
    }
  );
};

/**
 * Service-role client — bypasses RLS. Only for server-side admin operations.
 * NEVER expose this to the browser or return its data unfiltered.
 */
export const createServiceClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
