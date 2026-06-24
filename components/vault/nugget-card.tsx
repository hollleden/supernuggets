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
  if (info.uploader) parts.push(`via ${info.uploader.startsWith('@') ? info.uploader : '@' + info.uploader}`)
  else parts.push('via')
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
      className="nugget-card flex flex-row gap-4 h-40 p-4 relative overflow-hidden cursor-pointer"
    >
      {/* Left zone: thumbnail or type label */}
      {hasThumbnail ? (
        <div className="h-full aspect-[9/16] bg-stone-100 border border-gray-200 rounded-xl overflow-hidden relative shrink-0">
          <ThumbnailImage
            src={nugget.sourceInfo!.thumbnailUrl!}
            alt={nugget.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white font-mono font-bold px-1.5 py-0.5 rounded text-[8px] tracking-tight uppercase">
            {label}{duration ? ` ${duration}` : ''}
          </div>
        </div>
      ) : (
        <div
          className="h-full aspect-[9/16] shrink-0 relative rounded-xl"
          style={{ backgroundColor: folderColor + '14', border: `0.5px solid ${folderColor}26` }}
        >
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/80 text-white font-mono font-bold px-1.5 py-0.5 rounded text-[8px] tracking-tight uppercase whitespace-nowrap">
            {label}{duration ? ` ${duration}` : ''}
          </div>
        </div>
      )}

      {/* Right zone: text content */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between w-full mb-1">
            {!hideFolder ? (
              <span
                className="font-mono text-[11px] font-bold uppercase"
                style={{ color: folderColor }}
              >
                {nugget.folder}
              </span>
            ) : <span />}
            <time className="font-mono text-[11px] text-muted-foreground">
              {nugget.dateCompact}
            </time>
          </div>

          <h3 className="font-mono text-[13px] font-extrabold uppercase tracking-tight leading-snug text-foreground line-clamp-2">
            {nugget.title}
          </h3>
        </div>

        <div className="space-y-0.5 mt-auto">
          {via && (
            <div className="font-mono text-[11px] text-muted-foreground truncate">
              {via}
            </div>
          )}

          {nugget.tags.length > 0 && (
            <div className="font-mono text-[11px] text-muted-foreground truncate">
              {nugget.tags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
              {nugget.tags.length > 2 && ` +${nugget.tags.length - 2}`}
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
