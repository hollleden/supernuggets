import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { userIdFromToken } from '@/lib/users'
import {
  mapRowToNugget,
  FOLDER_COLOR_HEX,
  formatDuration,
  type EntryRow,
  type Nugget,
  type FolderType,
} from '@/lib/nuggets'
import { ThumbnailImage } from '@/components/vault/thumbnail-image'
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

function mediaLabel(mediaType?: string): string {
  if (!mediaType) return 'TEXT'
  if (mediaType === 'image_group' || mediaType === 'image_url') return 'GALLERY'
  if (mediaType === 'image') return 'IMAGE'
  if (mediaType.startsWith('video')) return 'VIDEO'
  if (mediaType === 'voice') return 'VOICE'
  if (mediaType === 'article') return 'ARTICLE'
  return 'TEXT'
}

function MediaCapture({ nugget }: { nugget: Nugget }) {
  const info = nugget.sourceInfo!
  const label = mediaLabel(nugget.mediaType)
  const duration = info.durationS ? formatDuration(info.durationS) : null
  const via = info.uploader
    ? `via ${info.uploader.startsWith('@') ? info.uploader : '@' + info.uploader}`
    : null
  return (
    <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 space-y-4">
      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full aspect-[9/16] bg-stone-100 dark:bg-neutral-800 rounded-xl overflow-hidden relative border border-gray-200 dark:border-neutral-700"
      >
        <ThumbnailImage
          src={info.thumbnailUrl!}
          alt={nugget.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-[10px] tracking-tight uppercase">
          {label}{duration ? ` ${duration}` : ''}
        </div>
      </a>

      <div className="space-y-1.5 text-[12px] font-mono text-gray-500 dark:text-gray-400">
        {via && <div>{via} · {(info.platform || '').toLowerCase()}</div>}
        <a
          href={info.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-black dark:hover:text-white underline truncate block transition-colors text-[11px]"
        >
          {info.url}
        </a>
      </div>
    </div>
  )
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Media column (only when thumbnail available) ── */}
          {nugget.sourceInfo?.thumbnailUrl && (
            <div className="lg:col-span-3">
              <MediaCapture nugget={nugget} />
            </div>
          )}

          {/* ── Main content ── */}
          <main className={`${nugget.sourceInfo?.thumbnailUrl ? 'lg:col-span-6' : 'lg:col-span-8'} font-mono space-y-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-6 md:p-8`}>

            {/* Folder + Delete */}
            <div className="flex items-center justify-between mb-6">
              <FolderEditor nuggetId={nugget.id} initialFolder={nugget.folder} token={token} />
              <DeleteButton nuggetId={nugget.id} token={token} />
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white uppercase leading-[1.15] mb-2">
              {nugget.title}
            </h1>

            {/* Date */}
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-6">
              CREATED: {nugget.dateCompact}
            </div>

            {/* 1. SUMMARY */}
            {nugget.summaryBullets.length > 0 && (
              <>
                <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">SUMMARY</div>
                {nugget.summaryBullets.map((bullet, i) => (
                  <div key={i} className="flex gap-1.5 text-[13px] leading-relaxed text-gray-800 dark:text-gray-200 mb-2">
                    <span className="shrink-0 font-bold" style={{ color: folderColor }}>▪</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </>
            )}

            {/* 2. FACT-CHECK */}
            {nugget.factChecks.length > 0 && (
              <>
                <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">FACT-CHECK</div>
                {nugget.factChecks.map((fc, i) => (
                  <div key={i} className="mb-2">
                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 uppercase tracking-tight">
                      <span className="text-emerald-600 font-black">✓</span>
                      {fc.searchQuery ? (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(fc.searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline underline-offset-2"
                        >
                          {fc.claim}
                        </a>
                      ) : (
                        <span>{fc.claim}</span>
                      )}
                    </div>
                    {fc.evidence && (
                      <div className="text-gray-500 pl-5 text-[11px] leading-relaxed mt-0.5">
                        {fc.evidence}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* 3. MENTIONED */}
            {nugget.mentioned.length > 0 && (
              <>
                <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">MENTIONED</div>
                <div className="flex flex-wrap gap-1.5">
                  {nugget.mentioned.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-3 py-1 border border-gray-300 dark:border-neutral-600 text-gray-800 dark:text-gray-200 hover:border-black dark:hover:border-white transition-colors"
                    >
                      {m.label}
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* 4. DESCRIPTION + 5. TRANSCRIPT */}
            {nugget.transcript && (() => {
              const raw = nugget.transcript;
              let description = '';
              let body = raw;
              if (raw.startsWith('DESCRIPTION: ')) {
                const idx = raw.indexOf('\n\n');
                if (idx !== -1) {
                  description = raw.slice('DESCRIPTION: '.length, idx).trim();
                  body = raw.slice(idx + 2).trim();
                } else {
                  description = raw.slice('DESCRIPTION: '.length).trim();
                  body = '';
                }
              }
              return (
                <>
                  {description && (
                    <>
                      <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">DESCRIPTION</span>
                        <CopyButton text={description} label="COPY" />
                      </div>
                      <pre className="text-[12px] leading-relaxed text-gray-600 whitespace-pre-wrap break-words bg-gray-50 dark:bg-neutral-800 p-3 rounded">{description}</pre>
                    </>
                  )}
                  {body && (
                    <>
                      <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">TRANSCRIPT</span>
                        <CopyButton text={body} label="COPY" />
                      </div>
                      <pre className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-wrap break-words bg-gray-50 dark:bg-neutral-800 p-3 rounded">{body}</pre>
                    </>
                  )}
                </>
              );
            })()}

            {/* 6. TAGS */}
            <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-3">TAGS</div>
            <TagEditor nuggetId={nugget.id} initialTags={nugget.tags} token={token} />

            {/* 7. SOURCE */}
            {nugget.sourceInfo && (
              <>
                <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">SOURCE</div>
                <div className="text-[11px] text-gray-600">
                  <span>↗ </span>
                  <a
                    href={nugget.sourceInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black dark:hover:text-white"
                  >
                    {sourceHeaderLine(nugget.sourceInfo) || 'OPEN ORIGINAL'}
                  </a>
                </div>
                <a
                  href={nugget.sourceInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-gray-400 hover:text-black underline truncate block max-w-full transition-colors"
                >
                  {nugget.sourceInfo.url}
                </a>
              </>
            )}

            {/* Links */}
            {nugget.extractedLinks.length > 0 && (
              <>
                <hr className="border-t border-gray-200 dark:border-neutral-700 my-4" />
                <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-2">LINKS</div>
                {nugget.extractedLinks.map(url => (
                  <div key={url} className="flex gap-2 text-xs mb-1">
                    <span className="text-gray-400 shrink-0">⬈</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white break-all underline underline-offset-2 decoration-1"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </>
            )}
          </main>

          {/* ── Related sidebar ── */}
          <aside className={`${nugget.sourceInfo?.thumbnailUrl ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-3`}>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest px-1 mb-1">
              RELATED IN {nugget.folder.toUpperCase()}
            </div>
            {related.length === 0 ? (
              <p className="font-mono text-xs text-gray-400 px-1">
                NO OTHER NUGGETS IN THIS FOLDER YET.
              </p>
            ) : (
              related.map(r => (
                <RelatedCard key={r.id} nugget={r} token={token} />
              ))
            )}
          </aside>

        </div>
      </div>
    </>
  )
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex py-1 items-center">
      <div className="flex-grow border-t border-gray-100 dark:border-neutral-700" />
      <span className="flex-shrink mx-4 text-[9px] text-gray-400 tracking-[0.2em] uppercase font-bold">
        {children}
      </span>
      <div className="flex-grow border-t border-gray-100 dark:border-neutral-700" />
    </div>
  )
}

function RelatedCard({ nugget, token }: { nugget: Nugget; token: string }) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all
  return (
    <Link
      href={`/u/${token}/n/${nugget.id}`}
      className="group block bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-all min-h-[90px] flex flex-col justify-between"
    >
      <div className="flex justify-between items-center w-full">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: folderColor }}
        >
          {nugget.folder.toUpperCase()}
        </span>
        <span className="text-[11px] text-gray-400">{nugget.dateCompact}</span>
      </div>
      <div
        className="font-bold text-black dark:text-white text-xs uppercase tracking-tight line-clamp-2 group-hover:transition-colors mt-2"
        style={{ ['--hover-color' as string]: folderColor }}
      >
        {nugget.title}
      </div>
    </Link>
  )
}
