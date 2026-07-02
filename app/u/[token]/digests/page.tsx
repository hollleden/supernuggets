import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchUserDigests, type Digest } from '@/lib/digests'
import { userIdFromToken } from '@/lib/users'

export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<Digest['kind'], string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yir: 'Year in Review',
}

const KIND_COLOR: Record<Digest['kind'], string> = {
  weekly: '#3B82C4',
  monthly: '#9A6B2F',
  yir: '#8A7000',
}

const KIND_ICON: Record<Digest['kind'], string> = {
  weekly: '◐',
  monthly: '◆',
  yir: '★',
}

function formatCompact(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

function dateRange(digest: Digest): string {
  const start = formatCompact(digest.period_start)
  const end = formatCompact(digest.period_end)
  return start === end ? start : `${start} – ${end}`
}

export default async function DigestsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()

  const digests = await fetchUserDigests(token)

  return (
    <>
      {/* Back bar */}
      <div className="px-4 md:px-6 py-3 border-b border-black/10">
        <Link
          href={`/u/${token}`}
          className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background px-3 py-1.5 border border-black/20 rounded-full transition-colors"
        >
          ← back
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          digests · {digests.length}
        </div>

        {digests.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <pre className="font-mono text-xs text-foreground text-center leading-relaxed mb-4">
{`no digests yet.
------------------------------------
enable /digest_on in the bot and
digests will appear here.`}
            </pre>
            <a
              href="https://t.me/supernuggetss_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[12px] font-bold tracking-wider px-4 py-2 rounded-full border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              OPEN BOT
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {digests.map(digest => {
              const color = KIND_COLOR[digest.kind] ?? '#666666'
              return (
                <Link
                  key={digest.id}
                  href={`/u/${token}/digests/${digest.id}`}
                  className="nugget-card group flex flex-row overflow-hidden"
                  style={{ minHeight: '104px' }}
                >
                  <div
                    className="shrink-0 self-stretch flex items-center justify-center"
                    style={{ width: '64px', backgroundColor: color + '1c' }}
                  >
                    <span className="text-xl" style={{ color }}>
                      {KIND_ICON[digest.kind] ?? '●'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col p-4 min-w-0 gap-1.5">
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wider"
                      style={{ color }}
                    >
                      {KIND_LABEL[digest.kind] ?? digest.kind}
                    </span>
                    <div className="font-mono text-sm font-extrabold uppercase tracking-tight text-foreground">
                      {dateRange(digest)}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground/60 group-hover:text-foreground transition-colors mt-auto pt-1">
                      view digest →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
