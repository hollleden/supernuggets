import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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
import { SearchBar } from '@/components/vault/search-bar'
import { sourceHeaderLine } from '@/lib/nuggets'

// Pinterest-style detail page. Top: sticky search bar (no breadcrumb / no back —
// browser back handles nav). Article: 2/3 content + 1/3 related rail on desktop.

export const dynamic = 'force-dynamic'

async function loadNugget(id: number): Promise<Nugget | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return mapRowToNugget(data as EntryRow)
}

async function loadRelated(folder: string, excludeId: number): Promise<Nugget[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('folder', folder)
    .neq('id', excludeId)
    .order('created_at', { ascending: false })
    .limit(16)
  if (error || !data) return []
  const all = (data as EntryRow[]).map(mapRowToNugget)
  // Dedupe by case-insensitive title — collapses accidental data duplicates
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
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) notFound()

  const nugget = await loadNugget(numericId)
  if (!nugget) notFound()

  const related = await loadRelated(nugget.folder, nugget.id)
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all

  return (
    <>
      {/* Sticky global search bar + BACK button */}
      <div className="sticky top-0 z-30 bg-background border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background px-2 py-2 border border-foreground transition-colors"
          >
            [ ← BACK ]
          </Link>
          <SearchBar navigateOnSubmit />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content — 2/3 width on desktop */}
          <article
            className="lg:col-span-2 bg-card border border-foreground p-6 md:p-8"
            style={{ borderTopColor: folderColor, borderTopWidth: '4px' }}
          >
            {/* Metadata row: folder editor + date on left, DELETE on right */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-foreground gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FolderEditor nuggetId={nugget.id} initialFolder={nugget.folder} />
                <time className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {nugget.dateCompact}
                </time>
              </div>
              <DeleteButton nuggetId={nugget.id} />
            </div>

            {/* Title — breathing room above/below */}
            <h1 className="font-mono text-2xl md:text-3xl font-extrabold uppercase leading-tight text-foreground my-8">
              {nugget.title}
            </h1>

            {/* SOURCE — sits between title and SUMMARY for URL-derived entries.
                Matches the TG receipt's ↗ SOURCE block; uppercase mono, raw URL underneath. */}
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
                      {/* Stacked layout per Gemini — claim on top, description indented below */}
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

            {/* Editable tags — now ABOVE transcript per user reorder */}
            <Section title="TAGS">
              <TagEditor nuggetId={nugget.id} initialTags={nugget.tags} />
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

            {/* Transcript moved to bottom — it's the longest wall of text, push it last */}
            {nugget.transcript && (
              <Section title="TRANSCRIPT" actions={<CopyButton text={nugget.transcript} label="COPY" />}>
                <pre className="font-mono text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words bg-muted/40 border border-foreground p-4">
                  {nugget.transcript}
                </pre>
              </Section>
            )}
          </article>

          {/* Related rail — 1/3 width on desktop, stacked below on mobile */}
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
                  <RelatedCard key={r.id} nugget={r} />
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

function RelatedCard({ nugget }: { nugget: Nugget }) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all
  return (
    <Link
      href={`/n/${nugget.id}`}
      className="block bg-card p-3 border border-transparent border-t-2 hover:border-foreground hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_var(--color-foreground)] transition-all duration-150"
      style={{ borderTopColor: folderColor }}
    >
      <time className="block font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
        {nugget.dateCompact}
      </time>
      {/* Brighter title per Gemini — was line-clamp-3 text-xs text-foreground, now sm + extrabold */}
      <h3 className="font-mono text-sm font-extrabold uppercase leading-tight text-foreground line-clamp-3">
        {nugget.title}
      </h3>
    </Link>
  )
}
