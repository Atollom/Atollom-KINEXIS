import { createBrowserSupabaseClient } from '@/lib/supabase-browser'

/**
 * fetch() wrapper that automatically attaches the current Supabase session
 * token as an Authorization: Bearer header. Content-Type defaults to JSON.
 * Use this for all calls to authenticated backend endpoints.
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const supabase = createBrowserSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return fetch(url, { ...options, headers })
}
