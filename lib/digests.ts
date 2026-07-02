import { supabaseAdmin } from './supabaseAdmin'
import { userIdFromToken } from './users'

export interface Digest {
  id: number
  user_id: number
  kind: 'weekly' | 'monthly' | 'yir'
  period_start: string  // ISO date
  period_end: string    // ISO date
  body_html: string     // HTML digest text (ready to render) — matches the bot's database.save_digest_row column
  themes_json: unknown  // cluster/theme data for monthly+yir digests, unused in this UI
  created_at: string    // ISO timestamp
}

/** Fetch all digests for a user, newest first. Empty array on invalid token or no rows. */
export async function fetchUserDigests(token: string): Promise<Digest[]> {
  const userId = await userIdFromToken(token)
  if (userId == null) return []

  const { data, error } = await supabaseAdmin
    .from('digests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Digest[]
}

/** Fetch a single digest by id, scoped to the token's user. Null if not found or not owned. */
export async function fetchDigestById(token: string, digestId: number): Promise<Digest | null> {
  const userId = await userIdFromToken(token)
  if (userId == null) return null

  const { data, error } = await supabaseAdmin
    .from('digests')
    .select('*')
    .eq('id', digestId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data as Digest
}
