'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import { FOLDERS } from '@/lib/nuggets'

// Server actions for mutating nuggets. Run on the server using the secret
// key, so they bypass RLS that blocks anon writes. Each mutation takes the
// caller's magic-URL token (when invoked from /u/[token]/* pages) and
// refuses to touch rows that don't belong to that token's user.

export type ActionResult = { ok: true } | { ok: false; error: string }

const VALID_FOLDERS = new Set<string>(FOLDERS.filter(f => f !== 'all'))

/** Resolve token -> user_id, returning a tagged result so callers can early-exit. */
async function resolveOwner(token: string | undefined): Promise<
  | { ok: true; userId: number }
  | { ok: false; error: string }
> {
  if (!token) return { ok: false, error: 'Missing token' }
  const userId = await userIdFromToken(token)
  if (userId == null) return { ok: false, error: 'Invalid token' }
  return { ok: true, userId }
}

export async function updateNuggetFolder(
  token: string,
  id: number,
  folder: string,
): Promise<ActionResult> {
  try {
    if (!VALID_FOLDERS.has(folder)) {
      return { ok: false, error: `Invalid folder: ${folder}` }
    }
    const owner = await resolveOwner(token)
    if (!owner.ok) return owner
    const { error, data } = await supabaseAdmin
      .from('entries')
      .update({ folder })
      .eq('id', id)
      .eq('user_id', owner.userId)
      .select('id')
    if (error) return { ok: false, error: error.message }
    if (!data || data.length === 0) return { ok: false, error: 'No row updated (id missing or not yours)' }
    revalidatePath(`/u/${token}/n/${id}`)
    revalidatePath(`/u/${token}`)
    revalidatePath(`/u/${token}/stats`)
    return { ok: true }
  } catch (e) {
    console.error('updateNuggetFolder error:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateNuggetTags(
  token: string,
  id: number,
  tags: string[],
): Promise<ActionResult> {
  try {
    const owner = await resolveOwner(token)
    if (!owner.ok) return owner
    const { error, data } = await supabaseAdmin
      .from('entries')
      .update({ tags: JSON.stringify(tags) })
      .eq('id', id)
      .eq('user_id', owner.userId)
      .select('id')
    if (error) return { ok: false, error: error.message }
    if (!data || data.length === 0) return { ok: false, error: 'No row updated (id missing or not yours)' }
    revalidatePath(`/u/${token}/n/${id}`)
    revalidatePath(`/u/${token}`)
    return { ok: true }
  } catch (e) {
    console.error('updateNuggetTags error:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteNugget(token: string, id: number): Promise<ActionResult> {
  try {
    const owner = await resolveOwner(token)
    if (!owner.ok) return owner
    const { error, data } = await supabaseAdmin
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', owner.userId)
      .select('id')
    if (error) return { ok: false, error: error.message }
    if (!data || data.length === 0) return { ok: false, error: 'No row deleted (id missing or not yours)' }
    revalidatePath(`/u/${token}`)
    revalidatePath(`/u/${token}/stats`)
    return { ok: true }
  } catch (e) {
    console.error('deleteNugget error:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/**
 * Pick a random nugget id from the caller's vault (RESURFACE feature).
 * Scoped to the token's user so users only resurface their own entries.
 */
export async function pickRandomNuggetId(token: string): Promise<number | null> {
  const owner = await resolveOwner(token)
  if (!owner.ok) return null
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('id')
    .eq('user_id', owner.userId)
    .limit(2000)
  if (error || !data || data.length === 0) return null
  const random = data[Math.floor(Math.random() * data.length)]
  return random.id as number
}
