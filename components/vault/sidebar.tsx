'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Grid3X3,
  Sparkles,
  Activity,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  onResurface: () => void
  isResurfaceActive?: boolean
}

// 16x16 pixel floppy — BRAND.md §5 logo. Uses currentColor for fills so it
// adapts to light/dark (cream + black in light, cream-grey + sepia in dark).
function PixelFloppy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      {/* Outer body */}
      <rect x="1" y="1" width="14" height="14" fill="currentColor" />
      {/* Inner cutout — becomes the "card surface" */}
      <rect x="2" y="2" width="12" height="12" fill="var(--card)" />
      {/* Metal shutter band at top */}
      <rect x="3" y="2" width="10" height="4" fill="currentColor" />
      {/* Shutter slot — gives the metal piece its iconic notch */}
      <rect x="6" y="3" width="3" height="2" fill="var(--card)" />
      {/* Label window */}
      <rect x="3" y="7" width="10" height="7" fill="currentColor" />
      {/* Label paper area */}
      <rect x="4" y="8" width="8" height="5" fill="var(--card)" />
      {/* Two writing lines on the label */}
      <rect x="5" y="9" width="6" height="1" fill="currentColor" />
      <rect x="5" y="11" width="4" height="1" fill="currentColor" />
    </svg>
  )
}

export function Sidebar({
  isDarkMode,
  onToggleDarkMode,
  isCollapsed,
  onToggleCollapse,
  onResurface,
  isResurfaceActive,
}: SidebarProps) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isStats = pathname === '/stats'
  return (
    <nav
      className={cn(
        'h-screen bg-card hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r-2 border-foreground transition-all duration-300',
        isCollapsed ? 'w-[52px]' : 'w-[180px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-3 border-b-2 border-foreground">
        <PixelFloppy className="w-7 h-7 shrink-0 text-foreground" />
        {!isCollapsed && (
          <span className="font-mono text-xs font-extrabold uppercase tracking-tight text-foreground">
            SUPERNUGGETS
          </span>
        )}
      </div>

      {/* Primary nav */}
      <div className="flex flex-col flex-1 py-2">
        <NavItem
          icon={<Grid3X3 className="w-4 h-4" />}
          label="BROWSE"
          href="/"
          isActive={isHome}
          isCollapsed={isCollapsed}
        />
        <NavItem
          icon={<Sparkles className="w-4 h-4" />}
          label="RESURFACE"
          isCollapsed={isCollapsed}
          onClick={onResurface}
          isActive={isResurfaceActive}
        />
        <NavItem
          icon={<Activity className="w-4 h-4" />}
          label="STATS"
          href="/stats"
          isActive={isStats}
          isCollapsed={isCollapsed}
        />

        <div className="flex-1" />

        {/* Footer nav */}
        <div className="border-t border-foreground pt-2">
          <NavItem
            icon={isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            label={isDarkMode ? 'LIGHT' : 'DARK'}
            onClick={onToggleDarkMode}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-foreground">
        <button
          onClick={onToggleCollapse}
          className="w-full h-7 flex items-center justify-center text-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Version stamp */}
      <div
        className={cn(
          'p-2 border-t border-foreground font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center',
          isCollapsed ? '[writing-mode:vertical-lr] rotate-180' : ''
        )}
      >
        {isCollapsed ? 'V0.4' : 'SYS_V0.4'}
      </div>
    </nav>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  isCollapsed: boolean
  onClick?: () => void
  href?: string
}

function NavItem({ icon, label, isActive, isCollapsed, onClick, href }: NavItemProps) {
  const className = cn(
    'w-full rounded-none h-9 font-mono text-[10px] uppercase tracking-wider transition-colors inline-flex items-center',
    isCollapsed ? 'justify-center px-0' : 'justify-start px-3',
    isActive
      ? 'bg-foreground text-background hover:bg-foreground hover:text-background font-bold'
      : 'text-foreground hover:bg-foreground hover:text-background'
  )

  const inner = (
    <>
      {icon}
      {!isCollapsed && <span className="ml-2">{label}</span>}
    </>
  )

  const node = href ? (
    <Link href={href} className={className}>{inner}</Link>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={onClick}
    >
      {inner}
    </Button>
  )

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="font-mono text-[10px] font-bold uppercase tracking-wider bg-foreground text-background border border-foreground rounded-none"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return node
}
