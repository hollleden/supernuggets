import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import { mapRowToNugget, type EntryRow, type Nugget } from '@/lib/nuggets'
import { HomeGrid } from '@/components/vault/home-grid'

export const dynamic = 'force-dynamic'

async function loadNuggets(userId: number): Promise<Nugget[]> {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('id,created_at,media_type,title,summary,tags,folder,enrichment')
    .eq('user_id', userId)
    // Secondary sort by id desc: created_at is a date (not timestamp) so
    // same-day entries tie and Postgres returns them in physical order.
    // id is a bigserial — highest id is always the most recently inserted.
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
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
