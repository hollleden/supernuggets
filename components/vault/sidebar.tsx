'use client'

import { Suspense, useMemo, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'
import { DotIcon } from './pixel-icons'
import { useVaultStats } from '@/lib/vault-stats-context'

// Sidebar shows only tags that cluster >=2 posts — one-off tags stay on their
// posts (searchable, shown on detail pages) but drop out of the browse list.
const ANCHOR_THRESHOLD = 2

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'all', skin: 'skin', make: 'make', food: 'food',
  body: 'body', learn: 'learn', work: 'work', fun: 'fun',
  go: 'go', mind: 'mind', other: 'other',
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

  const [tagSortAZ, setTagSortAZ] = useState(false)

  const anchorTags = useMemo(() => {
    const filtered = Object.entries(tagCounts)
      .filter(([, count]) => count >= ANCHOR_THRESHOLD)
    return tagSortAZ
      ? filtered.sort((a, b) => a[0].localeCompare(b[0]))
      : filtered.sort((a, b) => b[1] - a[1])
  }, [tagCounts, tagSortAZ])

  const handleTagClick = (tag: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (activeTag === tag) sp.delete('tag')
    else sp.set('tag', tag)
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
  }

  const handleFolderClick = (folder: FolderType) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (folder === 'all' || folder === activeFolder) sp.delete('folder')
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
      <div className="flex flex-col overflow-y-auto no-scrollbar flex-1">

        {/* Folder list — expanded */}
        {!isCollapsed && (
          <div className="flex flex-col px-2 gap-0.5 pt-2">
            <div className="flex flex-col gap-0.5">
              {FOLDERS.filter(f => f !== 'all').sort((a, b) => a.localeCompare(b)).map((folder) => {
                const isActive = folder === activeFolder
                const count = folderCounts[folder] ?? 0
                const color = FOLDER_COLOR_HEX[folder]
                return (
                  <button
                    key={folder}
                    onClick={() => handleFolderClick(folder)}
                    className={cn(
                      'font-mono text-[13px] tracking-wider px-2 py-1 text-left transition-all flex items-center justify-between rounded-md',
                      isActive
                        ? 'text-foreground font-black'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={isActive ? { backgroundColor: color + '18' } : {}}
                  >
                    <span className="flex items-center gap-1.5">
                      <span style={{ color }} className="shrink-0">
                        <DotIcon size={7} />
                      </span>
                      {FOLDER_LABELS[folder]}
                    </span>
                    {count > 0 && (
                      <span className="text-[11px] opacity-40 tabular-nums">{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tags */}
            {anchorTags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-0.5">
                <button
                  onClick={() => setTagSortAZ(prev => !prev)}
                  className="font-mono text-[11px] tracking-wider px-2 py-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors text-right"
                >
                  {tagSortAZ ? '↓ A-Z' : '↓ #'}
                </button>
                {anchorTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={cn(
                      'font-mono text-[13px] tracking-wider px-2 py-1 text-left transition-all flex items-center justify-between rounded-md',
                      activeTag === tag
                        ? 'text-foreground font-black bg-black/8 dark:bg-white/10'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>#{tag}</span>
                    <span className="text-[11px] opacity-40 tabular-nums">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Folder dots — collapsed */}
        {isCollapsed && (
          <div className="flex flex-col gap-1 px-2 mt-2">
            {FOLDERS.filter(f => f !== 'all').sort((a, b) => a.localeCompare(b)).map((folder) => {
              const isActive = folder === activeFolder
              const color = FOLDER_COLOR_HEX[folder]
              return (
                <Tooltip key={folder}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleFolderClick(folder)}
                      className={cn(
                        'mx-auto flex items-center justify-center w-10 h-8 rounded-md transition-all',
                        isActive ? '' : 'opacity-55 hover:opacity-90'
                      )}
                      style={isActive ? { backgroundColor: color + '18' } : {}}
                    >
                      <span style={{ color }}>
                        <DotIcon size={14} />
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-mono text-[12px] font-bold tracking-wider rounded-none">
                    {FOLDER_LABELS[folder]}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        )}
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
