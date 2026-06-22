'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from './sidebar'
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
      <span className="text-neutral-400 shrink-0 pointer-events-none text-sm">🔍</span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="SEARCH NUGGETS, TAGS, FOLDERS..."
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

// ─── Nugget count badge from context ─────────────────────────────────────────

function NuggetCount() {
  const { totalNuggets, filteredNuggets } = useVaultStats()
  if (!totalNuggets) return null
  const label = filteredNuggets === totalNuggets
    ? `${totalNuggets} NUGGETS`
    : `${filteredNuggets}/${totalNuggets}`
  return (
    <span className="font-mono text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
      {label}
    </span>
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
            <a href={homeHref} onClick={onClose} className={cn('pill-btn justify-start', isHome && 'active')}><span>🎛️</span> BROWSE</a>
            <button onClick={() => { onResurface(); onClose() }} className="pill-btn justify-start"><span>✨</span> RESURFACE</button>
            <a href={statsHref} onClick={onClose} className={cn('pill-btn justify-start', isStats && 'active')}><span>📈</span> STATS</a>
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">// FOLDERS</div>
          <div className="grid grid-cols-2 gap-1.5">
            {FOLDERS.map((folder) => {
              const isActive = folder === activeFolder
              const count = folder === 'all' ? folderCounts.all : (folderCounts[folder] ?? 0)
              return (
                <button
                  key={folder}
                  onClick={() => handleFolderClick(folder)}
                  className={cn('pill-btn justify-between', isActive && 'active')}
                >
                  <span>{folder === 'all' ? 'ALL' : folder.toUpperCase()}</span>
                  {count > 0 && <span className="text-[9px] font-normal opacity-50">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-black/10 pt-4 flex flex-col gap-1.5">
          <a href="https://t.me/supernuggetss_bot" target="_blank" rel="noopener noreferrer" className="pill-btn justify-start" onClick={onClose}>
            <span>🤖</span> BOT STATUS
          </a>
          <button onClick={() => { onToggleDarkMode(); onClose() }} className="pill-btn justify-start">
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
  const { totalNuggets, filteredNuggets } = useVaultStats()

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode, mounted])

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

  const nuggetCountLabel = !totalNuggets
    ? null
    : filteredNuggets === totalNuggets
      ? `${totalNuggets} NUGGETS`
      : `${filteredNuggets}/${totalNuggets}`

  return (
    <div className="min-h-screen bg-background">

      {/* Scrolling marquee bar */}
      <div className="w-full bg-[#FAFF00] border-b border-black py-1.5 overflow-hidden select-none">
        <div className="marquee-content font-mono text-[10px] font-black uppercase tracking-wider text-black">
          <span className="px-4 shrink-0">💎 SUPERNUGGETS DIGITAL VAULT // BRAIN DUMP ENGINE ╳ AUDIO, IMAGES, ARTICLES AND VIDEOS INGEST OK &nbsp;⚡︎ STOP CLUTTERING YOUR CAMERA ROLL ╳ RECLAIM YOUR CREATIVE CHAOS ╳ CAPTURED TODAY, REMEMBERED FOREVER ╳ SUPERNUGGETS ⚡︎</span>
          <span className="px-4 shrink-0">💎 SUPERNUGGETS DIGITAL VAULT // BRAIN DUMP ENGINE ╳ AUDIO, IMAGES, ARTICLES AND VIDEOS INGEST OK &nbsp;⚡︎ STOP CLUTTERING YOUR CAMERA ROLL ╳ RECLAIM YOUR CREATIVE CHAOS ╳ CAPTURED TODAY, REMEMBERED FOREVER ╳ SUPERNUGGETS ⚡︎</span>
        </div>
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-card border-b border-black/20 dark:border-white/10 flex min-h-[56px]">
        {/* Logo — mirrors sidebar width */}
        <div
          className={cn(
            'flex items-center justify-between px-4 border-r border-black/20 dark:border-white/10 shrink-0 transition-all duration-200',
            isSidebarCollapsed ? 'md:w-[64px]' : 'md:w-[264px]'
          )}
        >
          <span className="font-mono text-xs font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
            <span>💾</span>
            <span className="hidden md:inline">{isSidebarCollapsed ? 'SN' : 'SUPERNUGGETS'}</span>
            <span className="md:hidden">SUPERNUGGETS</span>
          </span>

          {/* Mobile right: count + burger */}
          <div className="flex items-center gap-2 md:hidden">
            {nuggetCountLabel && (
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider border border-foreground/40 px-2 py-0.5 rounded-full">
                {nuggetCountLabel}
              </span>
            )}
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

        {/* Nugget count — desktop */}
        <div className="hidden md:flex items-center px-4 border-l border-black/20 dark:border-white/10 bg-background/60 shrink-0">
          <NuggetCount />
        </div>
      </header>

      {/* Sidebar + main */}
      <div className="flex">
        <Sidebar
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(v => !v)}
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
          onToggleDarkMode={() => setIsDarkMode(v => !v)}
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
      <AppShellInner>{children}</AppShellInner>
    </VaultStatsProvider>
  )
}
