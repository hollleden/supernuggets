import type { Metadata } from 'next'
import { AppShell } from '@/components/vault/app-shell'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import { computeFolderTagCounts, parseTags } from '@/lib/nuggets'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  return {
    manifest: `/u/${token}/manifest.webmanifest`,
  }
}

async function loadFolderTagCounts(userId: number) {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('folder,tags')
    .eq('user_id', userId)
    .limit(2000)
  if (error || !data) return { folderCounts: {}, tagCounts: {}, total: 0 }
  const entries = (data as { folder: string | null; tags: string | string[] | null }[]).map((row) => ({
    folder: row.folder || 'other',
    tags: parseTags(row.tags),
  }))
  return computeFolderTagCounts(entries)
}

export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  const stats = userId != null ? await loadFolderTagCounts(userId) : { folderCounts: {}, tagCounts: {}, total: 0 }
  return <AppShell initialStats={stats}>{children}</AppShell>
}
