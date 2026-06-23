'use client'

import { useParams, useRouter } from 'next/navigation'
import type { Nugget, FolderType } from '@/lib/nuggets'
import { FOLDER_COLOR_HEX, sourceHeaderLine, formatDuration } from '@/lib/nuggets'
import { ThumbnailImage } from '@/components/vault/thumbnail-image'

const FOLDER_TEXTURE: Partial<Record<string, string>> = {
  Grow:       '/ / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /',
  Leisure:    '~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~',
  Health:     '+ + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +',
  Creativity: '* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *',
  Money:      '$ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $ $',
  Work:       '= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =',
  Curation:   ': : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : :',
  Personal:   '• • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •',
  Beauty:     '♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦ ♦',
  Food:       '◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦ ◦',
  Travel:     '> > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > >',
  Sport:      '| | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | | |',
}

function mediaBadgeLabel(mediaType?: string): string {
  if (!mediaType) return '[ TEXT ]'
  if (mediaType.startsWith('image')) return '[ IMAGE ]'
  if (mediaType.startsWith('video')) return '[ VIDEO ]'
  if (mediaType === 'voice') return '[ VOICE ]'
  if (mediaType === 'article') return '[ ARTICLE ]'
  return '[ TEXT ]'
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
  const texture = FOLDER_TEXTURE[nugget.folder] ?? ''
  const accentBg = folderColor + '1F'
  const cardHref = `${tokenPrefix}/n/${nugget.id}`
  const hasThumbnail = !!nugget.sourceInfo?.thumbnailUrl

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(cardHref)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(cardHref) }}
      className={`nugget-card ${hasThumbnail ? 'flex flex-row gap-3 h-36' : 'flex flex-col min-h-[180px]'} p-3 relative overflow-hidden cursor-pointer`}
      style={{
        '--card-accent': folderColor,
        '--card-accent-bg': accentBg,
      } as React.CSSProperties}
    >
      {hasThumbnail && (
        <div className="h-full aspect-[9/16] bg-stone-100 border border-gray-200 rounded-xl overflow-hidden relative shrink-0">
          <ThumbnailImage
            src={nugget.sourceInfo!.thumbnailUrl!}
            alt={nugget.title}
            className="w-full h-full object-cover"
          />
          {nugget.sourceInfo!.durationS && (
            <div className="absolute bottom-1 right-1 bg-black text-white font-bold px-1 py-0.5 rounded text-[7px] tracking-tighter uppercase">
              [ {formatDuration(nugget.sourceInfo!.durationS)} ]
            </div>
          )}
        </div>
      )}

      {!hasThumbnail && texture && (
        <div
          className="absolute inset-0 p-3 text-[11px] font-bold tracking-[0.25em] leading-relaxed break-all select-none pointer-events-none overflow-hidden"
          style={{ color: folderColor, opacity: 0.045 }}
          aria-hidden
        >
          {texture}
        </div>
      )}

      <div className={`relative z-10 flex flex-col ${hasThumbnail ? 'flex-1 justify-between min-w-0' : 'flex-1'}`}>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span
              className="font-mono text-[8px] font-bold tracking-wider border px-1.5 py-0.5 rounded-full bg-card"
              style={{ color: folderColor, borderColor: folderColor + '99' }}
            >
              {mediaBadgeLabel(nugget.mediaType)}
            </span>
            <time className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground">
              {nugget.dateCompact}
            </time>
          </div>

          {!hideFolder && (
            <span
              className="font-mono text-[9px] font-bold uppercase tracking-widest block mb-1"
              style={{ color: folderColor }}
            >
              {nugget.folder}
            </span>
          )}

          <h3 className={`font-mono text-xs font-extrabold uppercase tracking-tight leading-snug text-foreground ${hasThumbnail ? 'line-clamp-2' : 'mb-3 flex-1 line-clamp-3 md:text-sm'}`}>
            {nugget.title}
          </h3>
        </div>

        <div className="space-y-0.5 border-t border-neutral-200/60 pt-1.5">
          {nugget.sourceInfo && (
            <div
              className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide truncate"
              title={nugget.sourceInfo.url}
            >
              ↗ {sourceHeaderLine(nugget.sourceInfo) || 'SOURCE'}
            </div>
          )}

          {nugget.tags.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {nugget.tags.slice(0, hasThumbnail ? 2 : 3).map(tag => (
                <button
                  key={tag}
                  onClick={(e) => { e.stopPropagation(); router.push(`${tokenPrefix || '/'}?tag=${encodeURIComponent(tag)}`) }}
                  className="font-mono text-[8px] text-muted-foreground hover:text-foreground uppercase tracking-wide underline-offset-2 hover:underline"
                >
                  #{tag}
                </button>
              ))}
              {nugget.tags.length > (hasThumbnail ? 2 : 3) && (
                <span className="font-mono text-[8px] text-muted-foreground uppercase tracking-wide border border-foreground/20 px-1 rounded-sm">
                  +{nugget.tags.length - (hasThumbnail ? 2 : 3)}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {nuggets.map(nugget => (
        <NuggetCard key={nugget.id} nugget={nugget} hideFolder={hideFolder} />
      ))}
    </div>
  )
}
