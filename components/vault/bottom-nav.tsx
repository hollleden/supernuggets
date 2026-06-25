'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Grid3X3, Sparkles, Moon, Sun, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mobile-only bottom nav. Mirrors the desktop sidebar's nav items but as a
// thumb-friendly fixed bar. Renders above the cream paper, sticker shadow
// implicit via the top border.

interface BottomNavProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onResurface: () => void
}

export function BottomNav({ isDarkMode, onToggleDarkMode, onResurface }: BottomNavProps) {
  const pathname = usePathname()
  const params = useParams<{ token?: string }>()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'
  const statsHref = tokenPrefix ? `${tokenPrefix}/stats` : '/stats'
  const isHome = pathname === homeHref
  const isStats = pathname === statsHref

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t-2 border-foreground flex md:hidden">
      <BottomItem
        href={homeHref}
        icon={<Grid3X3 className="w-4 h-4" />}
        label="browse"
        isActive={isHome}
      />
      <BottomItem
        icon={<Sparkles className="w-4 h-4" />}
        label="resurface"
        onClick={onResurface}
      />
      <BottomItem
        href={statsHref}
        icon={<Activity className="w-4 h-4" />}
        label="stats"
        isActive={isStats}
      />
      <BottomItem
        icon={isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        label={isDarkMode ? 'light' : 'dark'}
        onClick={onToggleDarkMode}
      />
    </nav>
  )
}

interface BottomItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  href?: string
}

function BottomItem({ icon, label, isActive, onClick, href }: BottomItemProps) {
  const className = cn(
    'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
    'font-mono text-[9px] font-bold tracking-widest',
    'border-r border-foreground last:border-r-0',
    isActive
      ? 'bg-foreground text-background'
      : 'text-foreground active:bg-foreground active:text-background'
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className}>
      {icon}
      <span>{label}</span>
    </button>
  )
}
