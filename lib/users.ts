import { supabase } from './supabaseClient'

/**
 * Resolve a magic-URL token to its user_id (Telegram user id).
 * Returns null if no row matches — caller should notFound() in that case.
 */
export async function userIdFromToken(token: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('users')
    .select('user_id')
    .eq('token', token)
    .maybeSingle()
  if (error || !data) return null
  return (data as { user_id: number }).user_id
}
