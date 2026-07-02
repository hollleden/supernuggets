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
            {digests.map(digest => (
              <Link
                key={digest.id}
                href={`/u/${token}/digests/${digest.id}`}
                className="block bg-card border border-black/20 rounded-xl p-5 hover:border-black/40 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-150"
              >
                <div className="font-mono text-[9px] font-bold text-muted-foreground border border-black/10 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider mb-3">
                  {KIND_LABEL[digest.kind] ?? digest.kind}
                </div>
                <div className="font-mono text-sm font-extrabold uppercase tracking-tight text-foreground mb-1">
                  {dateRange(digest)}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  view →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
