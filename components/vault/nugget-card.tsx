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
  const cardHref = `${tokenPrefix}/n/${nugget.id}`
  const hasThumbnail = !!nugget.sourceInfo?.thumbnailUrl

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(cardHref)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(cardHref) }}
      className={`nugget-card ${hasThumbnail ? 'flex flex-row gap-3' : 'flex flex-col justify-between'} h-40 p-3 relative overflow-hidden cursor-pointer`}
      style={{
        '--card-accent': folderColor,
        '--card-accent-bg': folderColor + '1F',
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

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between w-full mb-0.5">
            {!hideFolder ? (
              <span
                className="font-mono text-[10px] font-bold uppercase"
                style={{ color: folderColor }}
              >
                {nugget.folder}
              </span>
            ) : <span />}
            <time className="font-mono text-[10px] text-muted-foreground">
              {nugget.dateCompact}
            </time>
          </div>

          <span
            className="font-mono text-[8px] font-bold tracking-wider border px-1.5 py-0.5 rounded uppercase inline-block mb-1.5"
            style={{ color: folderColor, borderColor: folderColor + '40', backgroundColor: folderColor + '12' }}
          >
            {mediaBadgeLabel(nugget.mediaType)}
          </span>

          <h3 className="font-mono text-xs font-extrabold uppercase tracking-tight leading-tight text-foreground line-clamp-2">
            {nugget.title}
          </h3>
        </div>

        <div className="space-y-0.5 border-t border-gray-50 pt-1.5">
          {nugget.sourceInfo && (
            <div
              className="font-mono text-[9px] text-muted-foreground uppercase tracking-wide truncate"
              title={nugget.sourceInfo.url}
            >
              ↗ {sourceHeaderLine(nugget.sourceInfo) || 'SOURCE'}
            </div>
          )}

          {nugget.tags.length > 0 && (
            <div className="font-mono text-[8px] text-muted-foreground uppercase tracking-tighter truncate">
              {nugget.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
              {nugget.tags.length > 3 && ` +${nugget.tags.length - 3}`}
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
