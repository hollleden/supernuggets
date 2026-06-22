import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'

export const dynamic = 'force-dynamic'

interface FolderStat {
  folder: FolderType
  count: number
  color: string
}

interface Stats {
  total: number
  perFolder: FolderStat[]
  lastAdded?: { id: number; title: string; dateCompact: string; folder: string; folderColor: string }
  streak: number
  last30Days: number
}

type Row = { id: number; title: string | null; folder: string | null; created_at: string }

async function loadStats(userId: number): Promise<Stats> {
  const { data } = await supabaseAdmin
    .from('entries')
    .select('id, title, folder, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(2000)

  const rows = (data ?? []) as Row[]
  const total = rows.length

  const counts: Record<string, number> = {}
  for (const row of rows) {
    const f = row.folder || 'Personal'
    counts[f] = (counts[f] || 0) + 1
  }

  const perFolder: FolderStat[] = FOLDERS
    .filter(f => f !== 'all')
    .map(f => ({
      folder: f,
      count: counts[f] || 0,
      color: FOLDER_COLOR_HEX[f],
    }))
    .sort((a, b) => b.count - a.count)

  const newest = rows[0]
  const lastAddedFolder = (newest?.folder ?? 'Personal') as FolderType
  const lastAdded = newest ? {
    id: newest.id,
    title: newest.title || 'Untitled',
    dateCompact: newest.created_at.slice(0, 10).replace(/-/g, '.'),
    folder: newest.folder ?? 'Personal',
    folderColor: FOLDER_COLOR_HEX[lastAddedFolder] ?? FOLDER_COLOR_HEX.all,
  } : undefined

  const dates = new Set(rows.map(r => r.created_at.slice(0, 10)))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  let streak = 0
  if (!dates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1)
  }
  for (let safety = 0; safety < 10000; safety++) {
    if (!dates.has(cursor.toISOString().slice(0, 10))) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const thirtyAgo = new Date()
  thirtyAgo.setDate(thirtyAgo.getDate() - 30)
  const thirtyKey = thirtyAgo.toISOString().slice(0, 10)
  const last30Days = rows.filter(r => r.created_at.slice(0, 10) >= thirtyKey).length

  return { total, perFolder, lastAdded, streak, last30Days }
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()

  const stats = await loadStats(userId)
  const maxFolderCount = Math.max(...stats.perFolder.map(f => f.count), 1)

  return (
    <>
      {/* Back bar */}
      <div className="px-4 md:px-6 py-3 border-b border-black/10">
        <Link
          href={`/u/${token}`}
          className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background px-3 py-1.5 border border-black rounded-full transition-colors"
        >
          ← BACK
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">

        {/* Counter card */}
        <div className="bg-card border border-black/20 rounded-xl p-6 relative">
          <span className="absolute top-4 left-5 font-mono text-[9px] text-muted-foreground border border-black/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            [ COUNTER ]
          </span>
          <div className="mt-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              TOTAL NUGGETS IN VAULT
            </div>
            <div className="font-mono text-6xl md:text-8xl font-extrabold leading-none text-foreground">
              {stats.total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiTile
            badge="STREAK"
            label="DAILY STREAK"
            value={`${stats.streak}d`}
            sub={stats.streak === 0 ? 'no nugget yet today' : 'consecutive days'}
          />
          <KpiTile
            badge="ACTIVITY"
            label="LAST 30 DAYS"
            value={stats.last30Days.toLocaleString()}
            sub="nuggets added"
          />
          {stats.lastAdded ? (
            <Link
              href={`/u/${token}/n/${stats.lastAdded.id}`}
              className="block bg-card border border-black/20 rounded-xl p-5 relative hover:border-black/30 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-150"
              style={{ borderTopColor: stats.lastAdded.folderColor, borderTopWidth: '3px' }}
            >
              <span className="absolute top-4 left-5 font-mono text-[9px] border border-black/10 px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ color: stats.lastAdded.folderColor }}>
                [ RECENT ]
              </span>
              <div className="mt-5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  LAST ADDED · {stats.lastAdded.dateCompact}
                </div>
                <div className="font-mono text-xs font-extrabold uppercase leading-tight text-foreground line-clamp-3">
                  {stats.lastAdded.title}
                </div>
              </div>
            </Link>
          ) : (
            <KpiTile badge="RECENT" label="LAST ADDED" value="—" sub="vault is empty" />
          )}
        </div>

        {/* Folder breakdown card */}
        <div className="bg-card border border-black/20 rounded-xl p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-5 text-center">
            FOLDER BREAKDOWN
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            {stats.perFolder.map(({ folder, count, color }) => {
              const pct = maxFolderCount > 0 ? (count / maxFolderCount) * 100 : 0
              return (
                <Link key={folder} href={count > 0 ? `/u/${token}?folder=${folder}` : '#'} className="block group">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wider w-24 shrink-0"
                      style={{ color }}
                    >
                      {folder}
                    </span>
                    <div className="flex-1 bg-black/5 h-5 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums w-8 text-right text-foreground">
                      {count}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}

function KpiTile({ badge, label, value, sub }: { badge: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-black/20 rounded-xl p-5 relative">
      <span className="absolute top-4 left-5 font-mono text-[9px] text-muted-foreground border border-black/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
        [ {badge} ]
      </span>
      <div className="mt-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          {label}
        </div>
        <div className="font-mono text-3xl md:text-4xl font-extrabold leading-none text-foreground mb-1">
          {value}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {sub}
        </div>
      </div>
    </div>
  )
}
