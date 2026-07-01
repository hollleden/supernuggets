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
      {/* Left: thumbnail or folder-tinted placeholder */}
      {hasThumbnail ? (
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
      ) : (
        <div
          className="shrink-0 self-stretch"
          style={{
            width: '72px',
            backgroundColor: folderColor + '18',
            borderRight: `1px solid ${folderColor}30`,
          }}
        />
      )}

      {/* Right: text — spans 100% width when no thumbnail */}
      <div className="flex-1 flex flex-col p-3 min-w-0 gap-1.5">
        {!hideFolder && (
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-wider"
            style={{ color: folderColor }}
          >
            {nugget.folder}
          </span>
        )}

        <h3 className="font-mono text-[13px] font-extrabold uppercase tracking-tight leading-snug text-foreground" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {nugget.title}
        </h3>

        {nugget.tags.length > 0 && (
          <div className="font-mono text-[10px] text-muted-foreground/55 truncate mt-auto pt-1">
            {nugget.tags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
            {nugget.tags.length > 2 && ` +${nugget.tags.length - 2}`}
          </div>
        )}
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
{`i'm actually obsessed with how empty this is.
---------------------------------------------
nothing found. seriously, go outside.
the sun is literally waiting for you.`}
        </pre>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="font-mono text-[12px] font-bold tracking-wider px-4 py-2 rounded-full border border-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            RESET
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
