'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Nugget, FolderType } from '@/lib/nuggets'
import { FOLDER_COLOR_HEX, formatDuration } from '@/lib/nuggets'
import { ThumbnailImage } from '@/components/vault/thumbnail-image'

function mediaLabel(mediaType?: string): string {
  if (!mediaType) return 'text'
  if (mediaType === 'image_group' || mediaType === 'image_url') return 'gallery'
  if (mediaType === 'image') return 'image'
  if (mediaType.startsWith('video')) return 'video'
  if (mediaType === 'voice') return 'voice'
  if (mediaType === 'article') return 'article'
  return 'text'
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
  const duration = nugget.sourceInfo?.durationS ? formatDuration(nugget.sourceInfo.durationS) : null
  const via = viaLine(nugget)

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(cardHref)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(cardHref) }}
      className="nugget-card flex flex-row relative overflow-hidden cursor-pointer"
      style={{ minHeight: '120px' }}
    >
      {/* Left: thumbnail — only when media exists, no placeholder otherwise */}
      {hasThumbnail && (
        <div className="relative shrink-0 overflow-hidden" style={{ width: '180px' }}>
          <ThumbnailImage
            src={nugget.sourceInfo!.thumbnailUrl!}
            alt={nugget.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {duration && (
            <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white font-mono font-bold px-1.5 py-0.5 rounded text-[8px] tracking-tight uppercase z-10">
              {duration}
            </div>
          )}
        </div>
      )}

      {/* Right: text — spans 100% width when no thumbnail */}
      <div className="flex-1 flex flex-col justify-between p-4 min-w-0">
        <div>
          <div className="flex items-center justify-between w-full mb-1">
            {!hideFolder ? (
              <span
                className="font-mono text-[13px] font-bold uppercase"
                style={{ color: folderColor }}
              >
                {nugget.folder}
              </span>
            ) : <span />}
            <time className="font-mono text-[13px] text-muted-foreground">
              {nugget.dateCompact}
            </time>
          </div>

          <h3 className="font-mono text-[15px] font-extrabold uppercase tracking-tight leading-snug text-foreground line-clamp-2">
            {nugget.title}
          </h3>
        </div>

        <div className="space-y-0.5 mt-auto">
          {via && (
            <div className="font-mono text-[13px] text-muted-foreground truncate">
              {via}
            </div>
          )}

          {nugget.tags.length > 0 && (
            <div className="font-mono text-[13px] text-muted-foreground truncate">
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

const BATCH_SIZE = 40

export function MasonryGrid({ nuggets, hideFolder, onClearFilters }: MasonryGridProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [nuggets])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(v => Math.min(v + BATCH_SIZE, nuggets.length))
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [nuggets.length])

  if (nuggets.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <pre className="font-mono text-xs text-foreground text-center leading-relaxed mb-4">
{`vault registry index // empty
----------------------------------
nothing matched those filters.
try clearing a tag or switching folders.`}
        </pre>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="font-mono text-[12px] font-bold tracking-wider px-4 py-2 rounded-full border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            [ clear all filters ]
          </button>
        )}
      </div>
    )
  }

  const visible = nuggets.slice(0, visibleCount)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map(nugget => (
          <NuggetCard key={nugget.id} nugget={nugget} hideFolder={hideFolder} />
        ))}
      </div>
      {visibleCount < nuggets.length && (
        <div ref={sentinelRef} className="h-1" />
      )}
    </>
  )
}
