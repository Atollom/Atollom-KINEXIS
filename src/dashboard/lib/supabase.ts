// src/dashboard/lib/supabase.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  return createRouteHandlerClient({ cookies });
};
