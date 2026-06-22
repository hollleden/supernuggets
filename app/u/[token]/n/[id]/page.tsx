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

function mediaBadgeLabel(mediaType?: string): string {
  if (!mediaType) return '[ TEXT ]'
  if (mediaType.startsWith('image')) return '[ IMAGE ]'
  if (mediaType.startsWith('video')) return '[ VIDEO ]'
  if (mediaType === 'voice') return '[ VOICE ]'
  if (mediaType === 'article') return '[ ARTICLE ]'
  return '[ TEXT ]'
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
      {/* Back bar */}
      <div className="px-4 md:px-6 py-3 border-b border-gray-100">
        <Link
          href={`/u/${token}`}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider border border-gray-300 px-3 py-1 rounded bg-white hover:border-black transition-colors"
        >
          ← BACK
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Main content card ── */}
          <article
            className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden"
          >
            {/* Metadata bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono text-[9px] border px-2 py-0.5 rounded uppercase"
                  style={{ color: folderColor, borderColor: folderColor + '40' }}
                >
                  {mediaBadgeLabel(nugget.mediaType)}
                </span>
                <FolderEditor nuggetId={nugget.id} initialFolder={nugget.folder} token={token} />
                <time className="font-mono text-[10px] text-gray-400 tracking-wider">
                  {nugget.dateCompact}
                </time>
              </div>
              <DeleteButton nuggetId={nugget.id} token={token} />
            </div>

            {/* Title */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <h1 className="font-mono text-xl md:text-2xl font-black tracking-tight text-black uppercase leading-tight">
                {nugget.title}
              </h1>
            </div>

            <div className="p-5 space-y-6">
              {/* Source */}
              {nugget.sourceInfo && (
                <Section title="SOURCE">
                  <div className="font-mono text-xs leading-relaxed">
                    <a
                      href={nugget.sourceInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-black hover:underline underline-offset-2 uppercase tracking-wide font-bold"
                    >
                      <span>↗</span>
                      <span>{sourceHeaderLine(nugget.sourceInfo) || 'OPEN ORIGINAL'}</span>
                    </a>
                    <div className="mt-1 text-gray-400 break-all">
                      <a
                        href={nugget.sourceInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-black"
                      >
                        {nugget.sourceInfo.url}
                      </a>
                    </div>
                  </div>
                </Section>
              )}

              {/* Summary */}
              {nugget.summaryBullets.length > 0 && (
                <Section title="SUMMARY">
                  <ul className="space-y-2">
                    {nugget.summaryBullets.map((bullet, i) => (
                      <li key={i} className="font-mono text-xs text-black leading-relaxed flex gap-3">
                        <span className="text-gray-400 shrink-0">▪</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Mentioned */}
              {nugget.mentioned.length > 0 && (
                <Section title="MENTIONED">
                  <ul className="space-y-1">
                    {nugget.mentioned.map((m, i) => (
                      <li key={i} className="font-mono text-xs leading-relaxed flex gap-3">
                        <span className="text-gray-400 shrink-0">•</span>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:underline underline-offset-2 decoration-1"
                        >
                          {m.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Fact-check */}
              {nugget.factChecks.length > 0 && (
                <Section title="FACT-CHECK">
                  <ul className="space-y-4">
                    {nugget.factChecks.map((fc, i) => (
                      <li key={i} className="font-mono text-xs leading-relaxed">
                        <div className="flex gap-3">
                          <span className="text-gray-400 shrink-0">✓</span>
                          {fc.searchQuery ? (
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(fc.searchQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold uppercase tracking-wide text-black hover:underline underline-offset-2 decoration-1"
                            >
                              {fc.claim}
                            </a>
                          ) : (
                            <span className="font-bold uppercase tracking-wide">{fc.claim}</span>
                          )}
                        </div>
                        {fc.evidence && (
                          <div className="text-gray-400 pl-7 mt-1">{fc.evidence}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Tags */}
              <Section title="TAGS">
                <TagEditor nuggetId={nugget.id} initialTags={nugget.tags} token={token} />
              </Section>

              {/* Links */}
              {nugget.extractedLinks.length > 0 && (
                <Section title="LINKS">
                  <ul className="space-y-1">
                    {nugget.extractedLinks.map(url => (
                      <li key={url} className="font-mono text-xs flex gap-3">
                        <span className="text-gray-400 shrink-0">⬈</span>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:underline break-all underline-offset-2 decoration-1"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Transcript */}
              {nugget.transcript && (
                <Section title="RAW CAPTURE PAYLOAD" actions={<CopyButton text={nugget.transcript} label="COPY" />}>
                  <div className="bg-stone-50 border border-gray-200 rounded-xl p-4">
                    <pre className="font-mono text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                      {nugget.transcript}
                    </pre>
                  </div>
                </Section>
              )}
            </div>
          </article>

          {/* ── Related sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="font-mono text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">
              RELATED IN {nugget.folder.toUpperCase()}
            </div>
            {related.length === 0 ? (
              <p className="font-mono text-xs text-gray-400">
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
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex-1 border-b border-gray-100" />
        <span className="font-mono text-[9px] text-gray-400 tracking-widest uppercase px-1">
          {title}
        </span>
        {actions
          ? <>{actions}</>
          : <span className="flex-1 border-b border-gray-100" />
        }
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
      className="block bg-white border border-gray-200 rounded-xl p-4 relative shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-black cursor-pointer transition-all duration-150"
    >
      <span
        className="absolute top-3 left-4 font-mono text-[9px] border px-1.5 py-0.5 rounded uppercase tracking-wider"
        style={{
          color: folderColor,
          borderColor: folderColor + '40',
          backgroundColor: folderColor + '12',
        }}
      >
        {nugget.folder.toUpperCase()}
      </span>
      <span className="absolute top-3 right-4 font-mono text-[9px] text-gray-400">
        {nugget.dateCompact}
      </span>
      <h3 className="font-mono text-xs font-black uppercase leading-tight text-black line-clamp-2 mt-6">
        {nugget.title}
      </h3>
    </Link>
  )
}
