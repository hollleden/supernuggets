'use client'

import Link from 'next/link'
import type { Nugget, FolderType } from '@/lib/nuggets'
import { FOLDER_COLOR_HEX, sourceHeaderLine } from '@/lib/nuggets'

interface NuggetCardProps {
  nugget: Nugget
  // When a folder filter is active, the folder name is redundant per-card.
  hideFolder?: boolean
}

// Card spec (post user-iteration): title-led, tags at bottom, no summary preview.
// Uniform sizing via CSS grid + flex-col + min-h on container.
export function NuggetCard({ nugget, hideFolder }: NuggetCardProps) {
  const folderColor = FOLDER_COLOR_HEX[nugget.folder as FolderType] ?? FOLDER_COLOR_HEX.all

  return (
    <Link
      href={`/n/${nugget.id}`}
      className="flex flex-col bg-card p-5 h-full min-h-[14rem]
        border border-transparent border-t-2
        transition-all duration-150
        hover:border-foreground hover:-translate-x-[2px] hover:-translate-y-[2px]
        hover:shadow-[4px_4px_0px_0px_var(--color-foreground)]"
      style={{ borderTopColor: folderColor }}
    >
      {/* Metadata row — date always, folder only when not already filtered to it */}
      <div className="flex items-center justify-between mb-4">
        {hideFolder ? (
          <span aria-hidden /> /* keep the flex spacing */
        ) : (
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-wider"
            style={{ color: folderColor }}
          >
            {nugget.folder}
          </span>
        )}
        <time className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground uppercase ml-auto">
          {nugget.dateCompact}
        </time>
      </div>

      {/* Title — leads the card */}
      <h3 className="font-mono text-base md:text-lg font-extrabold uppercase leading-[1.15] text-foreground mb-3 flex-1">
        {nugget.title}
      </h3>

      {/* SOURCE — present only for URL-derived entries. Sits above tags so
          the platform/uploader is visible at-a-glance on the card. */}
      {nugget.sourceInfo && (
        <a
          href={nugget.sourceInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide mt-auto pt-3 truncate"
          title={nugget.sourceInfo.url}
        >
          ↗ {sourceHeaderLine(nugget.sourceInfo) || 'SOURCE'}
        </a>
      )}

      {/* Tags — bottom-pinned via flex-1 above. Plain text, clickable. */}
      {nugget.tags.length > 0 && (
        <div className={`flex flex-wrap gap-x-2 gap-y-1 ${nugget.sourceInfo ? 'pt-1' : 'mt-auto pt-3'}`}>
          {nugget.tags.slice(0, 3).map(tag => (
            <Link
              key={tag}
              href={`/?q=${encodeURIComponent(tag)}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wide"
            >
              #{tag}
            </Link>
          ))}
          {nugget.tags.length > 3 && (
            <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">
              +{nugget.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
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
        <div className="bg-dither w-24 h-24 mb-6 border border-foreground" />
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
            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            [ CLEAR ALL FILTERS ]
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-fr">
      {nuggets.map(nugget => (
        <NuggetCard key={nugget.id} nugget={nugget} hideFolder={hideFolder} />
      ))}
    </div>
  )
}
