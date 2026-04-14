// src/dashboard/lib/supabase-browser.ts
// Browser client for use in Client Components ('use client').
// Do NOT import this in Server Components or Route Handlers.
'use client';

import { createBrowserClient } from '@supabase/ssr';

export const createBrowserSupabaseClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
