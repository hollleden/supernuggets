import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { userIdFromToken } from '@/lib/users'
import { mapRowToNugget, type EntryRow, type Nugget } from '@/lib/nuggets'
import { HomeGrid } from '@/components/vault/home-grid'

export const dynamic = 'force-dynamic'

async function loadNuggets(userId: number): Promise<Nugget[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error || !data) return []
  return (data as EntryRow[]).map(mapRowToNugget)
}

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()
  const nuggets = await loadNuggets(userId)
  return <HomeGrid initialNuggets={nuggets} />
}
