'use client'

import { Suspense, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'
import { useVaultStats } from '@/lib/vault-stats-context'

const ANCHOR_THRESHOLD = 3

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'ALL', skin: 'SKIN', make: 'MAKE', food: 'FOOD',
  body: 'BODY', learn: 'LEARN', work: 'WORK', fun: 'FUN',
  go: 'GO', mind: 'MIND', other: 'OTHER',
}

interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

function SidebarInner({
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = useParams<{ token?: string }>()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'
  const { folderCounts, tagCounts } = useVaultStats()

  const activeFolder = (searchParams.get('folder') ?? 'all') as FolderType
  const activeTag = searchParams.get('tag')?.toLowerCase() ?? ''

  const anchorTags = useMemo(() => {
    return Object.entries(tagCounts)
      .filter(([, count]) => count >= ANCHOR_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
  }, [tagCounts])

  const handleTagClick = (tag: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (activeTag === tag) sp.delete('tag')
    else sp.set('tag', tag)
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
  }

  const handleFolderClick = (folder: FolderType) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (folder === 'all') sp.delete('folder')
    else sp.set('folder', folder)
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
      <div className="flex flex-col overflow-y-auto p-2 gap-0.5 no-scrollbar flex-1">

        {/* Folder list — desktop expanded only */}
        {!isCollapsed && (
          <>
            <div className="flex flex-col">
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

            {/* Tags — plain text, no header */}
            {anchorTags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-0.5">
                {anchorTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 text-left transition-colors flex items-center justify-between',
                      activeTag === tag
                        ? 'text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>#{tag}</span>
                    <span className="text-[9px] opacity-40 tabular-nums">{count}</span>
                  </button>
                ))}
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

      {/* Collapse toggle */}
      <div className="p-2 pt-1 border-t border-black/10 dark:border-white/10">
        <button
          onClick={onToggleCollapse}
          className={cn(
            'pill-btn border-dashed opacity-40 hover:opacity-70',
            isCollapsed && 'pill-btn-icon mx-auto'
          )}
        >
          {isCollapsed ? '▶' : <><span>◀</span><span className="text-[10px]">COLLAPSE</span></>}
        </button>
      </div>
    </aside>
  )
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  )
}
