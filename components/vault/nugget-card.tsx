'use client'

import { useParams, useRouter } from 'next/navigation'
import type { Nugget, FolderType } from '@/lib/nuggets'
import { FOLDER_COLOR_HEX, formatDuration } from '@/lib/nuggets'
import { ThumbnailImage } from '@/components/vault/thumbnail-image'

function mediaLabel(mediaType?: string): string {
  if (!mediaType) return 'TEXT'
  if (mediaType === 'image_group' || mediaType === 'image_url') return 'GALLERY'
  if (mediaType === 'image') return 'IMAGE'
  if (mediaType.startsWith('video')) return 'VIDEO'
  if (mediaType === 'voice') return 'VOICE'
  if (mediaType === 'article') return 'ARTICLE'
  return 'TEXT'
}

function viaLine(nugget: Nugget): string | null {
  const info = nugget.sourceInfo
  if (!info) return null
  const parts: string[] = []
  if (info.uploader) parts.push(info.uploader.startsWith('@') ? info.uploader : '@' + info.uploader)
  if (info.platform) parts.push(info.platform.toLowerCase())
  return parts.join(' · ')
}

interface NuggetCardProps {
  nugget: Nugget
  hideFolder?: boolean
}

export function NuggetCard({ nugget, hideFolder }: NuggetCardProps) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all
  const params = useParams<{ token?: string }>()
  const router = useRouter()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const cardHref = `${tokenPrefix}/n/${nugget.id}`
  const hasThumbnail = !!nugget.sourceInfo?.thumbnailUrl
  const label = mediaLabel(nugget.mediaType)
  const duration = nugget.sourceInfo?.durationS ? formatDuration(nugget.sourceInfo.durationS) : null
  const via = viaLine(nugget)

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(cardHref)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(cardHref) }}
      className="nugget-card group flex flex-col overflow-hidden cursor-pointer"
      style={{
        '--card-accent': folderColor,
        '--card-accent-bg': folderColor + '08',
      } as React.CSSProperties}
    >
      {/* Visual zone: thumbnail or bold folder-color block */}
      <div className="relative overflow-hidden aspect-[16/10] border-b-2 border-[#121110] dark:border-[oklch(0.35_0_0)]">
        {hasThumbnail ? (
          <>
            <ThumbnailImage
              src={nugget.sourceInfo!.thumbnailUrl!}
              alt={nugget.title}
              className="w-full h-full object-cover"
            />
            {duration && (
              <span className="absolute top-2 right-2 bg-black/80 text-white font-mono font-bold px-1.5 py-0.5 text-[8px] tracking-tight uppercase">
                {duration}
              </span>
            )}
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: folderColor }}
          >
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              {label}
            </span>
          </div>
        )}
      </div>

      {/* Content zone */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {!hideFolder && (
          <span
            className="font-mono text-[9px] font-extrabold uppercase tracking-[0.1em] self-start px-1.5 py-0.5 border"
            style={{ color: folderColor, borderColor: folderColor }}
          >
            {nugget.folder}
          </span>
        )}

        <h3 className="font-mono text-[12px] font-extrabold uppercase tracking-tight leading-snug text-foreground line-clamp-2">
          {nugget.title}
        </h3>

        {/* Hover-reveal metadata */}
        <div className="flex flex-col gap-1 max-h-0 opacity-0 overflow-hidden transition-all duration-200 ease-out group-hover:max-h-16 group-hover:opacity-100">
          <div className="flex items-center justify-between gap-2">
            {via && (
              <span className="font-mono text-[9px] text-muted-foreground truncate">
                {via}
              </span>
            )}
            <time className="font-mono text-[9px] text-muted-foreground shrink-0 ml-auto">
              {nugget.dateCompact}
            </time>
          </div>
          {nugget.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {nugget.tags.slice(0, 2).map(tag => (
                <span key={tag} className="font-mono text-[8px] text-muted-foreground bg-muted px-1.5 py-0.5">
                  #{tag}
                </span>
              ))}
              {nugget.tags.length > 2 && (
                <span className="font-mono text-[8px] text-muted-foreground">
                  +{nugget.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MasonryGridProps {
  nuggets: Nugget[]
  hideFolder?: boolean
  onClearFilters?: () => void
}

export function MasonryGrid({ nuggets, hideFolder, onClearFilters }: MasonryGridProps) {
  if (nuggets.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <pre className="font-mono text-xs text-foreground text-center leading-relaxed mb-4">
{`VAULT REGISTRY INDEX // EMPTY
----------------------------------
0 NUGGETS FOUND MATCHING YOUR FILTERS.
ADJUST PARAMETERS OR STRUCTURAL FOLDERS
TO INDEX AGAIN.`}
        </pre>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="font-mono text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            [ CLEAR ALL FILTERS ]
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {nuggets.map(nugget => (
        <NuggetCard key={nugget.id} nugget={nugget} hideFolder={hideFolder} />
      ))}
    </div>
  )
}
