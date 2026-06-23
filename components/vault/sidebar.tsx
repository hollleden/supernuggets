'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useSearchParams, useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FOLDERS, FOLDER_COLOR_HEX, type FolderType } from '@/lib/nuggets'
import { useVaultStats } from '@/lib/vault-stats-context'

const FOLDER_LABELS: Record<FolderType, string> = {
  all: 'ALL', Grow: 'GROW', Leisure: 'LEISURE', Health: 'HEALTH',
  Creativity: 'CREATIVITY', Money: 'MONEY', Work: 'WORK', Curation: 'CURATION',
  Personal: 'PERSONAL', Beauty: 'BEAUTY', Food: 'FOOD', Travel: 'TRAVEL', Sport: 'SPORT',
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
  const { folderCounts } = useVaultStats()

  const activeFolder = (searchParams.get('folder') ?? 'all') as FolderType

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
        isCollapsed ? 'w-[56px]' : 'w-[220px]',
        'h-[calc(100vh-48px)]'
      )}
    >
      {/* Scrollable inner */}
      <div className="flex flex-col flex-1 overflow-y-auto p-3 gap-1 no-scrollbar">

        {/* Primary nav */}
        <div className={cn('flex flex-col gap-1', !isCollapsed && 'mb-4')}>
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
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1 mt-1">
              // FOLDERS
            </div>
            <div className="flex flex-col gap-1">
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
                      {folder !== 'all' && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isActive ? 'currentColor' : color }}
                        />
                      )}
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
          </>
        )}

        {/* Folder dots — collapsed view */}
        {isCollapsed && (
          <div className="flex flex-col gap-1 mt-2">
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
      <div className="p-3 border-t border-black/10 dark:border-white/10 flex flex-col gap-1">
        <PillNavItem
          icon="🤖"
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
