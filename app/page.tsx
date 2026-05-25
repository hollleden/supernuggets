import { supabase } from '@/lib/supabaseClient'
import { mapRowToNugget, type EntryRow, type Nugget } from '@/lib/nuggets'
import { HomeGrid } from '@/components/vault/home-grid'

// Server component — fetches all entries on every request so revalidatePath('/')
// after a delete/update actually causes the grid to refresh on next navigation.

export const dynamic = 'force-dynamic'

async function loadNuggets(): Promise<Nugget[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error || !data) return []
  return (data as EntryRow[]).map(mapRowToNugget)
}

export default async function HomePage() {
  const nuggets = await loadNuggets()
  return <HomeGrid initialNuggets={nuggets} />
}
