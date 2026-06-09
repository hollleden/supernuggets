import { supabaseAdmin } from './supabaseAdmin'

/**
 * Resolve a magic-URL token to its user_id (Telegram user id).
 * Returns null if no row matches — caller should notFound() in that case.
 *
 * Server-only: uses the secret key so it works after anon is locked out via RLS.
 */
export async function userIdFromToken(token: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('user_id')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return null
  return (data as { user_id: number }).user_id
}
