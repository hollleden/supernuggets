import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import {
  mapRowToNugget,
  FOLDER_COLOR_HEX,
  type EntryRow,
  type Nugget,
  type FolderType,
} from '@/lib/nuggets'
import { CopyButton } from '@/components/vault/copy-button'
import { FolderEditor } from '@/components/vault/folder-editor'
import { TagEditor } from '@/components/vault/tag-editor'
import { DeleteButton } from '@/components/vault/delete-button'
import { sourceHeaderLine } from '@/lib/nuggets'

export const dynamic = 'force-dynamic'

async function loadNugget(id: number, userId: number): Promise<Nugget | null> {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return mapRowToNugget(data as EntryRow)
}

async function loadRelated(folder: string, excludeId: number, userId: number): Promise<Nugget[]> {
  const { data, error } = await supabaseAdmin
    .from('entries')
    .select('*')
    .eq('folder', folder)
    .eq('user_id', userId)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(16)
  if (error || !data) return []
  const all = (data as EntryRow[]).map(mapRowToNugget)
  const seen = new Set<string>()
  const out: Nugget[] = []
  for (const n of all) {
    const key = n.title.toLowerCase().trim()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
    if (out.length >= 8) break
  }
  return out
}

export default async function NuggetPage({
  params,
}: {
  params: Promise<{ token: string; id: string }>
}) {
  const { token, id } = await params
  const userId = await userIdFromToken(token)
  if (userId == null) notFound()

  const numericId = Number(id)
  if (!Number.isFinite(numericId)) notFound()

  const nugget = await loadNugget(numericId, userId)
  if (!nugget) notFound()

  const related = await loadRelated(nugget.folder, nugget.id, userId)
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all

  return (
    <>
      <div className="px-4 md:px-6 py-3 border-b border-black/10">
        <Link
          href={`/u/${token}`}
          className="inline-flex font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background px-3 py-1.5 border border-black/20 rounded-full transition-colors"
        >
          ← BACK
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article
            className="lg:col-span-2 bg-card border border-black/10 rounded-xl p-5 md:p-7"
            style={{ borderTopColor: folderColor, borderTopWidth: '3px' }}
          >
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-black/10 gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="font-mono text-[9px] border border-black/10 px-2 py-0.5 rounded-full uppercase tracking-wider text-muted-foreground"
                  style={{ color: folderColor, borderColor: folderColor + '40' }}
                >
                  {(() => {
                    const m = nugget.mediaType
                    if (!m) return '[ TEXT ]'
                    if (m.startsWith('image')) return '[ IMAGE ]'
                    if (m.startsWith('video')) return '[ VIDEO ]'
                    if (m === 'voice') return '[ VOICE ]'
                    if (m === 'article') return '[ ARTICLE ]'
                    return '[ TEXT ]'
                  })()}
                </span>
                <FolderEditor nuggetId={nugget.id} initialFolder={nugget.folder} token={token} />
                <time className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {nugget.dateCompact}
                </time>
              </div>
              <DeleteButton nuggetId={nugget.id} token={token} />
            </div>

            <h1 className="font-mono text-2xl md:text-3xl font-extrabold uppercase leading-tight text-foreground my-6">
              {nugget.title}
            </h1>

            {nugget.sourceInfo && (
              <Section title="SOURCE">
                <div className="font-mono text-sm leading-relaxed">
                  <a
                    href={nugget.sourceInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-foreground hover:bg-foreground hover:text-background underline underline-offset-2 decoration-1 uppercase tracking-wide font-bold"
                  >
                    <span>↗</span>
                    <span>{sourceHeaderLine(nugget.sourceInfo) || 'OPEN ORIGINAL'}</span>
                  </a>
                  <div className="mt-1 text-muted-foreground break-all">
                    <a
                      href={nugget.sourceInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground"
                    >
                      {nugget.sourceInfo.url}
                    </a>
                  </div>
                </div>
              </Section>
            )}

            {nugget.summaryBullets.length > 0 && (
              <Section title="SUMMARY">
                <ul className="space-y-2">
                  {nugget.summaryBullets.map((bullet, i) => (
                    <li key={i} className="font-mono text-sm leading-relaxed text-foreground flex gap-3">
                      <span className="text-muted-foreground shrink-0">▪</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {nugget.mentioned.length > 0 && (
              <Section title="MENTIONED">
                <ul className="space-y-1">
                  {nugget.mentioned.map((m, i) => (
                    <li key={i} className="font-mono text-sm leading-relaxed flex gap-3">
                      <span className="text-muted-foreground shrink-0">•</span>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:bg-foreground hover:text-background underline underline-offset-2 decoration-1"
                      >
                        {m.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {nugget.factChecks.length > 0 && (
              <Section title="FACT-CHECK">
                <ul className="space-y-4">
                  {nugget.factChecks.map((fc, i) => (
                    <li key={i} className="font-mono text-sm leading-relaxed">
                      <div className="flex gap-3">
                        <span className="text-muted-foreground shrink-0">✓</span>
                        {fc.searchQuery ? (
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(fc.searchQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold uppercase tracking-wide text-foreground hover:bg-foreground hover:text-background underline underline-offset-2 decoration-1"
                          >
                            {fc.claim}
                          </a>
                        ) : (
                          <span className="font-bold uppercase tracking-wide">{fc.claim}</span>
                        )}
                      </div>
                      {fc.evidence && (
                        <div className="text-muted-foreground pl-7 mt-1">
                          {fc.evidence}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="TAGS">
              <TagEditor nuggetId={nugget.id} initialTags={nugget.tags} token={token} />
            </Section>

            {nugget.extractedLinks.length > 0 && (
              <Section title="LINKS">
                <ul className="space-y-1">
                  {nugget.extractedLinks.map(url => (
                    <li key={url} className="font-mono text-sm flex gap-3">
                      <span className="text-muted-foreground shrink-0">⬈</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:bg-foreground hover:text-background break-all underline underline-offset-2 decoration-1"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {nugget.transcript && (
              <Section title="TRANSCRIPT" actions={<CopyButton text={nugget.transcript} label="COPY" />}>
                <pre className="font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words bg-black/[0.03] border border-black/10 rounded-xl p-4">
                  {nugget.transcript}
                </pre>
              </Section>
            )}
          </article>

          <aside className="lg:col-span-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              RELATED IN {nugget.folder.toUpperCase()}
            </div>
            {related.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                NO OTHER NUGGETS IN THIS FOLDER YET.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {related.map(r => (
                  <RelatedCard key={r.id} nugget={r} token={token} />
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}

function Section({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
        <span className="flex-1 border-b border-muted-foreground/40" />
        <span className="px-1">{title}</span>
        {actions ? <>{actions}</> : <span className="flex-1 border-b border-muted-foreground/40" />}
      </div>
      {children}
    </section>
  )
}

function RelatedCard({ nugget, token }: { nugget: Nugget; token: string }) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all
  return (
    <Link
      href={`/u/${token}/n/${nugget.id}`}
      className="block bg-card border border-black/10 rounded-xl p-4 relative hover:border-black/25 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-150"
      style={{ borderTopColor: folderColor, borderTopWidth: '3px' }}
    >
      <span
        className="absolute top-3 left-4 font-mono text-[9px] border border-black/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider"
        style={{ color: folderColor }}
      >
        {nugget.folder.toUpperCase()}
      </span>
      <span className="absolute top-3 right-4 font-mono text-[9px] text-muted-foreground">
        {nugget.dateCompact}
      </span>
      <h3 className="font-mono text-xs font-extrabold uppercase leading-tight text-foreground line-clamp-3 mt-6">
        {nugget.title}
      </h3>
    </Link>
  )
}
