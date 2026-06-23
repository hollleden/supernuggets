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

function mediaBadgeLabel(mediaType?: string): string {
  if (!mediaType) return '[ TEXT ]'
  if (mediaType.startsWith('image')) return '[ IMAGE ]'
  if (mediaType.startsWith('video')) return '[ VIDEO ]'
  if (mediaType === 'voice') return '[ VOICE ]'
  if (mediaType === 'article') return '[ ARTICLE ]'
  return '[ TEXT ]'
}

function MediaCapture({ nugget }: { nugget: Nugget }) {
  const info = nugget.sourceInfo!
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest px-1">
        Media Capture
      </div>

      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full aspect-[9/16] bg-stone-100 rounded-xl overflow-hidden relative border border-gray-200 group"
      >
        <ThumbnailImage
          src={info.thumbnailUrl!}
          alt={nugget.title}
          className="w-full h-full object-cover"
        />
        {info.durationS && (
          <div className="absolute bottom-1.5 right-1.5 bg-black text-white font-bold px-1.5 py-0.5 rounded text-[8px] tracking-tighter uppercase">
            [ {formatDuration(info.durationS)} ]
          </div>
        )}
      </a>

      <div className="space-y-2 px-1 pt-1 border-t border-gray-100 text-[11px]">
        <div>
          <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Source</div>
          <div className="text-[11px] font-bold text-gray-600 uppercase">
            ↗ {sourceHeaderLine(info) || 'OPEN ORIGINAL'}
          </div>
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-400 hover:text-black underline truncate block max-w-full transition-colors mt-0.5"
          >
            {info.url}
          </a>
        </div>
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

          {/* ── Main content card ── */}
          <main className={`${nugget.sourceInfo?.thumbnailUrl ? 'lg:col-span-6' : 'lg:col-span-8'} bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}>

            {/* Metadata bar with BACK button */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href={`/u/${token}`}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase px-2.5 py-1 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  <span>←</span>
                  <span>BACK</span>
                </Link>
                <span
                  className="text-[10px] font-bold border px-2 py-0.5 rounded uppercase"
                  style={{
                    color: folderColor,
                    borderColor: folderColor + '40',
                    backgroundColor: folderColor + '12',
                  }}
                >
                  {mediaBadgeLabel(nugget.mediaType)}
                </span>
                <FolderEditor nuggetId={nugget.id} initialFolder={nugget.folder} token={token} />
                <span className="text-gray-400 text-[11px]">{nugget.dateCompact}</span>
              </div>
              <DeleteButton nuggetId={nugget.id} token={token} />
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black uppercase leading-[1.15]">
              {nugget.title}
            </h1>

            {/* Source — only shown in main column when there's no media column */}
            {nugget.sourceInfo && !nugget.sourceInfo.thumbnailUrl && (
              <div className="space-y-2 pt-2">
                <Divider>SOURCE</Divider>
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-gray-600 flex items-center gap-2">
                    <span>↗</span>
                    <a
                      href={nugget.sourceInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-black uppercase"
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
                </div>
              </div>
            )}

            {/* Summary */}
            {nugget.summaryBullets.length > 0 && (
              <div className="space-y-4 pt-4">
                <Divider>SUMMARY</Divider>
                <ul className="space-y-3 text-[13px] leading-relaxed text-gray-800 pl-4">
                  {nugget.summaryBullets.map((bullet, i) => (
                    <li
                      key={i}
                      className="relative before:content-['▪'] before:absolute before:-left-4"
                      style={{ ['--tw-before-color' as string]: folderColor }}
                    >
                      <span className="absolute -left-4" style={{ color: folderColor }}>▪</span>
                      <span className="pl-1">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mentioned */}
            {nugget.mentioned.length > 0 && (
              <div className="space-y-4 pt-4">
                <Divider>MENTIONED</Divider>
                <div className="flex flex-wrap gap-2 text-xs">
                  {nugget.mentioned.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#fcfbfa] border border-gray-200 px-3 py-1.5 rounded-xl font-medium text-gray-700 flex items-center gap-1.5 hover:border-black transition-colors"
                    >
                      <span className="text-[10px]" style={{ color: folderColor }}>▪</span>
                      {m.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Fact-check */}
            {nugget.factChecks.length > 0 && (
              <div className="space-y-4 pt-4">
                <Divider>FACT-CHECK</Divider>
                <div className="space-y-4 text-xs">
                  {nugget.factChecks.map((fc, i) => (
                    <div key={i} className="space-y-1">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-tight">
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
                        <div className="text-gray-500 pl-4 leading-relaxed text-[11px]">
                          {fc.evidence}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3 pt-4">
              <Divider>TAGS</Divider>
              <TagEditor nuggetId={nugget.id} initialTags={nugget.tags} token={token} />
            </div>

            {/* Links */}
            {nugget.extractedLinks.length > 0 && (
              <div className="space-y-3 pt-4">
                <Divider>LINKS</Divider>
                <ul className="space-y-1 text-xs">
                  {nugget.extractedLinks.map(url => (
                    <li key={url} className="flex gap-2">
                      <span className="text-gray-400 shrink-0">⬈</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:text-black break-all underline underline-offset-2 decoration-1"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw Capture Payload */}
            {nugget.transcript && (
              <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">RAW CAPTURE PAYLOAD</span>
                  <CopyButton text={nugget.transcript} label="COPY" />
                </div>
                <div className="bg-stone-50 border border-gray-200 rounded-xl p-4 text-gray-600 leading-relaxed text-[11px]">
                  <pre className="font-mono whitespace-pre-wrap break-words">
                    {nugget.transcript}
                  </pre>
                </div>
              </div>
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
      <div className="flex-grow border-t border-gray-100" />
      <span className="flex-shrink mx-4 text-[9px] text-gray-400 tracking-[0.2em] uppercase font-bold">
        {children}
      </span>
      <div className="flex-grow border-t border-gray-100" />
    </div>
  )
}

function RelatedCard({ nugget, token }: { nugget: Nugget; token: string }) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all
  return (
    <Link
      href={`/u/${token}/n/${nugget.id}`}
      className="group block bg-white border border-gray-200 rounded-2xl p-4 hover:border-black transition-all min-h-[90px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col justify-between"
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
        className="font-bold text-black text-xs uppercase tracking-tight line-clamp-2 group-hover:transition-colors mt-2"
        style={{ ['--hover-color' as string]: folderColor }}
      >
        {nugget.title}
      </div>
    </Link>
  )
}
