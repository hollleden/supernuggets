'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from './sidebar'
import { CursorWaitOnNav } from './cursor-wait-nav'
import { pickRandomNuggetId } from '@/app/actions/nuggets'
import { VaultStatsProvider, useVaultStats } from '@/lib/vault-stats-context'
import { FOLDERS, type FolderType } from '@/lib/nuggets'
import { cn } from '@/lib/utils'

// ─── Header search (debounced URL param) ─────────────────────────────────────

function HeaderSearchInner() {
  const router = useRouter()
  const params = useParams<{ token?: string }>()
  const searchParams = useSearchParams()
  const tokenPrefix = params?.token ? `/u/${params.token}` : ''
  const homeHref = tokenPrefix || '/'

  const urlQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(urlQ)

  useEffect(() => setQuery(urlQ), [urlQ])

  useEffect(() => {
    const current = searchParams.get('q') ?? ''
    if (query === current) return
    const timer = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString())
      if (query) sp.set('q', query)
      else sp.delete('q')
      const qs = sp.toString()
      router.replace(qs ? `${homeHref}?${qs}` : homeHref)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex items-center gap-2 px-4 flex-1">
      <span className="text-neutral-400 shrink-0 pointer-events-none text-base">🔍</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder=""
        className="w-full bg-transparent font-mono text-[11px] font-bold uppercase focus:outline-none placeholder:text-neutral-400 tracking-wider py-1 text-foreground"
      />
    </div>
  )
}

function HeaderSearch() {
  return (
    <Suspense fallback={
      <div className="flex-1 px-4 flex items-center gap-2">
        <span className="text-neutral-400 shrink-0 text-sm">🔍</span>
        <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">SEARCH...</span>
      </div>
    }>
      <HeaderSearchInner />
    </Suspense>
  )
}

// ─── Mobile overlay menu ─────────────────────────────────────────────────────

interface MobileMenuProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onResurface: () => void
  onClose: () => void
}

function MobileMenuInner({ isDarkMode, onToggleDarkMode, onResurface, onClose }: MobileMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams<{ token?: string }>()
  const searchParams = useSearchParams()
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
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-card pt-14 overflow-y-auto md:hidden">
      <div className="p-4 space-y-4">
        <div>
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">// NAVIGATION</div>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => { onResurface(); onClose() }} className="pill-btn justify-start"><span>✨</span> RANDOM NUGGET</button>
            <a href={statsHref} onClick={onClose} className={cn('pill-btn justify-start', isStats && 'active')}><span>📈</span> STATS</a>
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">// FOLDERS</div>
          <div className="grid grid-cols-2 gap-1.5">
            {FOLDERS.filter(f => f !== 'all').sort((a, b) => a.localeCompare(b)).map((folder) => {
              const isActive = folder === activeFolder
              const count = folderCounts[folder] ?? 0
              return (
                <button
                  key={folder}
                  onClick={() => handleFolderClick(folder)}
                  className={cn('pill-btn justify-between', isActive && 'active')}
                >
                  <span>{folder.toUpperCase()}</span>
                  {count > 0 && <span className="text-[9px] font-normal opacity-50">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-black/10 pt-4 flex flex-col gap-1.5">
          <a href="https://t.me/supernuggetss_bot" target="_blank" rel="noopener noreferrer" className="pill-btn justify-start opacity-50 hover:opacity-80" onClick={onClose}>
            <span>⬈</span> OPEN BOT
          </a>
          <button onClick={() => { onToggleDarkMode(); onClose() }} className="pill-btn justify-start opacity-50 hover:opacity-80">
            <span>{isDarkMode ? '☀️' : '🌙'}</span> {isDarkMode ? 'LIGHT MODE' : 'DARK MODE'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MobileMenu(props: MobileMenuProps) {
  return (
    <Suspense fallback={null}>
      <MobileMenuInner {...props} />
    </Suspense>
  )
}

// ─── Shell inner (context consumer) ──────────────────────────────────────────

function AppShellInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams<{ token?: string }>()
  const token = params?.token
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userToggled, setUserToggled] = useState(false)
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', isDarkMode)
    if (userToggled) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    }
  }, [isDarkMode, mounted, userToggled])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 768) setIsSidebarCollapsed(true) }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleResurface = async () => {
    if (!token) return
    const id = await pickRandomNuggetId(token)
    if (id != null) router.push(`/u/${token}/n/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Static top bar */}
      <div className="w-full bg-[#FAFF00] dark:bg-neutral-800 border-b border-black dark:border-neutral-700 py-1.5 select-none">
        <div className="top-bar-text font-mono text-[10px] font-black uppercase tracking-wider text-black dark:text-neutral-400 text-center px-4">
          SUPERNUGGETS — DIGITAL VAULT // BRAIN DUMP ENGINE — STOP CLUTTERING YOUR CAMERA ROLL — RECLAIM YOUR CREATIVE CHAOS — CAPTURED TODAY, REMEMBERED FOREVER
        </div>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-card border-b border-black/20 dark:border-white/10 flex min-h-[48px]">
        {/* Logo — mirrors sidebar width */}
        <div
          className={cn(
            'flex items-center justify-between px-3 border-r border-black/20 dark:border-white/10 shrink-0 transition-all duration-200',
            isSidebarCollapsed ? 'md:w-[64px]' : 'md:w-[220px]'
          )}
        >
          <Link href={token ? `/u/${token}` : '/'} className="font-mono text-sm font-black uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 hover:opacity-70 transition-opacity">
            <img src="/nugget-logo.png" alt="Supernuggets" className="w-12 h-12 shrink-0" style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }} />
            {!isSidebarCollapsed && <span className="hidden md:inline tracking-tight">SUPERNUGGETS</span>}
            <span className="md:hidden tracking-tight">SUPERNUGGETS</span>
          </Link>

          {/* Mobile right: burger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(v => !v)}
              className="font-mono text-lg leading-none p-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Search */}
        <HeaderSearch />

      </header>

      {/* Sidebar + main */}
      <div className="flex">
        <Sidebar
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => { setUserToggled(true); setIsDarkMode(v => !v) }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
          onResurface={handleResurface}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <MobileMenu
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => { setUserToggled(true); setIsDarkMode(v => !v) }}
          onResurface={handleResurface}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Public export ────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <VaultStatsProvider>
      <CursorWaitOnNav />
      <AppShellInner>{children}</AppShellInner>
    </VaultStatsProvider>
  )
}
