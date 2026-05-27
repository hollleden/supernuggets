'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { FOLDERS } from '@/lib/nuggets'

// Server actions for mutating nuggets. Run on the server using the secret
// key, so they bypass RLS that blocks anon writes. After each mutation we
// revalidatePath the affected routes so router.refresh on the client
// re-fetches fresh data immediately.

export type ActionResult = { ok: true } | { ok: false; error: string }

// 'all' is a UI-only filter option, not a valid storage folder.
const VALID_FOLDERS = new Set<string>(FOLDERS.filter(f => f !== 'all'))

export async function updateNuggetFolder(id: number, folder: string): Promise<ActionResult> {
  if (!VALID_FOLDERS.has(folder)) {
    return { ok: false, error: `Invalid folder: ${folder}` }
  }
  const { error, data } = await supabaseAdmin
    .from('entries')
    .update({ folder })
    .eq('id', id)
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: 'No row updated (id may not exist)' }
  revalidatePath(`/n/${id}`)
  revalidatePath('/')
  revalidatePath('/stats')
  return { ok: true }
}

export async function updateNuggetTags(id: number, tags: string[]): Promise<ActionResult> {
  const { error, data } = await supabaseAdmin
    .from('entries')
    .update({ tags: JSON.stringify(tags) })
    .eq('id', id)
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: 'No row updated (id may not exist)' }
  revalidatePath(`/n/${id}`)
  revalidatePath('/')
  return { ok: true }
}

export async function deleteNugget(id: number): Promise<ActionResult> {
  const { error, data } = await supabaseAdmin
    .from('entries')
    .delete()
    .eq('id', id)
    .select('id')
  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: 'No row deleted (id may not exist)' }
  revalidatePath('/')
  revalidatePath('/stats')
  return { ok: true }
}

// Pick a random nugget id for the RESURFACE feature. Used by the AppShell
// nav button — keeps the shell free of any data-fetching responsibility.
export async function pickRandomNuggetId(): Promise<number | null> {
  // Lightweight: fetch only ids, randomize in JS. Fine until ~10k nuggets.
  const { data, error } = await supabase
    .from('entries')
    .select('id')
    .limit(2000)
  if (error || !data || data.length === 0) return null
  const random = data[Math.floor(Math.random() * data.length)]
  return random.id as number
}
