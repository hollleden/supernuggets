import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchDigestById, type Digest } from '@/lib/digests'
import { userIdFromToken } from '@/lib/users'
import { ShareDigestButton } from '@/components/vault/share-digest-button'
import { renderDigestBody } from '@/lib/digest-body'

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

function formatCompact(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

function dateRange(digest: Digest): string {
  const start = formatCompact(digest.period_start)
  const end = formatCompact(digest.period_end)
  return start === end ? start : `${start} – ${end}`
}

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>
}) {
  const { token, id } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) notFound()

  const digest = await fetchDigestById(token, numericId)
  if (!digest) notFound()

  const color = KIND_COLOR[digest.kind] ?? '#666666'

  return (
    <>
      {/* Back bar */}
      <div className="px-4 md:px-6 py-3 border-b border-black/10 flex items-center justify-between">
        <Link
          href={`/u/${token}/digests`}
          className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background px-3 py-1.5 border border-black/20 rounded-full transition-colors"
        >
          ← back to digests
        </Link>
        <ShareDigestButton />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <main className="font-mono bg-card p-6 md:p-8 rounded-xl border border-border-muted">
          <div
            className="font-mono text-[9px] font-bold border inline-block px-2 py-0.5 rounded-full uppercase tracking-wider mb-3"
            style={{ color, borderColor: color + '55', backgroundColor: color + '14' }}
          >
            {KIND_LABEL[digest.kind] ?? digest.kind}
          </div>
          <h1 className="font-mono text-xl font-extrabold uppercase tracking-tight text-foreground mb-1">
            {dateRange(digest)}
          </h1>

          <hr className="border-t border-border-muted my-4" />

          <div className="digest-body text-foreground">
            {renderDigestBody(digest.body_html)}
          </div>
        </main>
      </div>
    </>
  )
}
