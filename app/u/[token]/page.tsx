import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import { mapRowToNugget, type EntryRow, type Nugget } from '@/lib/nuggets'
import { HomeGrid } from '@/components/vault/home-grid'
import VaultLoading from './loading'

export const dynamic = 'force-dynamic'

async function loadNuggets(userId: number): Promise<Nugget[]> {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('id,created_at,media_type,title,summary,tags,folder,enrichment')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(2000)
  if (error || !data) return []
  return (data as EntryRow[]).map(mapRowToNugget)
}

async function NuggetGrid({ userId }: { userId: number }) {
  const nuggets = await loadNuggets(userId)
  return <HomeGrid initialNuggets={nuggets} />
}

export default async function UserHomePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()

  return (
    <Suspense fallback={<VaultLoading />}>
      <NuggetGrid userId={userId} />
    </Suspense>
  )
}
