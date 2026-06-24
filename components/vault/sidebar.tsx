'use client'

import { Suspense, useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useSearchParams, useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'
import { useVaultStats } from '@/lib/vault-stats-context'

const INITIAL_TAG_COUNT = 10
const ANCHOR_THRESHOLD = 3

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'ALL', skin: 'SKIN', make: 'MAKE', food: 'FOOD',
  body: 'BODY', learn: 'LEARN', work: 'WORK', fun: 'FUN',
  go: 'GO', mind: 'MIND', other: 'OTHER',
}

interface SidebarProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onResurface: () => void
  isResurfaceActive?: boolean
}

function SidebarInner({
  isDarkMode,
  onToggleDarkMode,
  isCollapsed,
  onToggleCollapse,
  onResurface,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ token?: string }>()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'
  const statsHref = tokenPrefix ? `${tokenPrefix}/stats` : '/stats'
  const isHome = pathname === homeHref
  const isStats = pathname === statsHref
  const { folderCounts, tagCounts } = useVaultStats()
  const [tagsExpanded, setTagsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sn-tags-expanded') === '1'
  })
  const [showAllTags, setShowAllTags] = useState(false)

  const toggleTagsExpanded = () => {
    setTagsExpanded(v => {
      const next = !v
      localStorage.setItem('sn-tags-expanded', next ? '1' : '0')
      return next
    })
  }

  const activeFolder = (searchParams.get('folder') ?? 'all') as FolderType
  const activeTag = searchParams.get('tag')?.toLowerCase() ?? ''

  const anchorTags = useMemo(() => {
    return Object.entries(tagCounts)
      .filter(([, count]) => count >= ANCHOR_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
  }, [tagCounts])

  const handleTagClick = (tag: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (activeTag === tag) {
      sp.delete('tag')
    } else {
      sp.set('tag', tag)
    }
    sp.delete('folder')
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
  }

  const handleFolderClick = (folder: FolderType) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (folder === 'all') sp.delete('folder')
    else sp.set('folder', folder)
    sp.delete('tag')
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col sticky top-12 bg-card border-r border-black/20 dark:border-white/10 shrink-0 transition-all duration-200 overflow-hidden',
        isCollapsed ? 'w-[72px]' : 'w-[220px]',
        'h-[calc(100vh-48px)]'
      )}
    >
      {/* Scrollable inner */}
      <div className="flex flex-col overflow-y-auto p-2 gap-0.5 no-scrollbar">

        {/* Primary nav */}
        <div className={cn('flex flex-col gap-0.5', !isCollapsed && 'mb-1 pb-2 border-b border-black/10 dark:border-white/10')}>
          <PillNavItem
            icon="✨"
            label="RANDOM NUGGET"
            isActive={false}
            isCollapsed={isCollapsed}
            onClick={onResurface}
          />
          <PillNavItem
            icon="📈"
            label="STATS"
            href={statsHref}
            isActive={isStats}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Folder list — desktop expanded only */}
        {!isCollapsed && (
          <>
            <div className="flex flex-col gap-0.5">
              {FOLDERS.filter(f => f !== 'all').sort((a, b) => a.localeCompare(b)).map((folder) => {
                const isActive = folder === activeFolder
                const count = folderCounts[folder] ?? 0
                const color = FOLDER_COLOR_HEX[folder]
                return (
                  <button
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className={cn('pill-btn justify-between', isActive && 'active')}
                    style={isActive ? {} : { '--pill-accent': color } as React.CSSProperties}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: isActive ? 'currentColor' : color }}
                      />
                      {FOLDER_LABELS[folder]}
                    </span>
                    {count > 0 && (
                      <span className="text-[9px] font-normal opacity-50 tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tags section */}
            {anchorTags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={toggleTagsExpanded}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>// TAGS</span>
                  <span className="text-[9px]">{tagsExpanded ? '▾' : '▸'}</span>
                </button>
                {tagsExpanded && (
                  <div className="flex flex-wrap gap-1 px-1 pt-1">
                    {(showAllTags ? anchorTags : anchorTags.slice(0, INITIAL_TAG_COUNT)).map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={cn(
                          'font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border transition-colors',
                          activeTag === tag
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-black/15 dark:border-white/15 hover:border-foreground/40 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        #{tag}
                        <span className="ml-0.5 opacity-50">{count}</span>
                      </button>
                    ))}
                    {!showAllTags && anchorTags.length > INITIAL_TAG_COUNT && (
                      <button
                        onClick={() => setShowAllTags(true)}
                        className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        +{anchorTags.length - INITIAL_TAG_COUNT} more
                      </button>
                    )}
                    {showAllTags && anchorTags.length > INITIAL_TAG_COUNT && (
                      <button
                        onClick={() => setShowAllTags(false)}
                        className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Folder dots — collapsed view */}
        {isCollapsed && (
          <div className="flex flex-col gap-0.5 mt-2">
            {FOLDERS.filter(f => f !== 'all').sort((a, b) => a.localeCompare(b)).map((folder) => {
              const isActive = folder === activeFolder
              const color = FOLDER_COLOR_HEX[folder]
              return (
                <Tooltip key={folder}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleFolderClick(folder)}
                      className={cn('pill-btn-icon mx-auto', isActive && 'active')}
                      style={{ borderColor: color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isActive ? 'currentColor' : color }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
                    {FOLDER_LABELS[folder]}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 pt-3 mt-1 border-t border-black/10 dark:border-white/10 flex flex-col gap-0.5">
        <PillNavItem
          icon="⬈"
          label="OPEN BOT"
          href="https://t.me/supernuggetss_bot"
          isActive={false}
          isCollapsed={isCollapsed}
          external
          subtle
        />
        <PillNavItem
          icon={isDarkMode ? '☀️' : '🌙'}
          label={isDarkMode ? 'LIGHT MODE' : 'DARK MODE'}
          isActive={false}
          isCollapsed={isCollapsed}
          onClick={onToggleDarkMode}
          subtle
        />
        <button
          onClick={onToggleCollapse}
          className={cn(
            'pill-btn mt-1 border-dashed opacity-40 hover:opacity-70',
            isCollapsed && 'pill-btn-icon mx-auto'
          )}
        >
          {isCollapsed ? '▶' : <><span>◀</span><span className="text-[10px]">COLLAPSE PANEL</span></>}
        </button>
      </div>
    </aside>
  )
}

interface PillNavItemProps {
  icon: React.ReactNode | string
  label: string
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
  href?: string
  external?: boolean
  subtle?: boolean
}

function PillNavItem({ icon, label, isActive, isCollapsed, onClick, href, external, subtle }: PillNavItemProps) {
  const className = cn(isCollapsed ? 'pill-btn-icon mx-auto' : 'pill-btn', isActive && 'active', subtle && 'opacity-50 hover:opacity-80')
  const inner = isCollapsed ? icon : <>{icon}<span>{label}</span></>

  const node = href ? (
    external
      ? <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>
      : <Link href={href} className={className}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={className}>{inner}</button>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" className="font-mono text-[10px] font-bold uppercase tracking-wider rounded-none">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return node
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  )
}
