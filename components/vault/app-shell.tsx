'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { Sidebar } from './sidebar'
import { CursorWaitOnNav } from './cursor-wait-nav'
import { pickRandomNuggetId } from '@/app/actions/nuggets'
import { VaultStatsProvider, useVaultStats } from '@/lib/vault-stats-context'
import { FOLDERS, type FolderType } from '@/lib/nuggets'
import { cn } from '@/lib/utils'
import { SearchIcon, RandomIcon, StatsIcon, PlaneIcon, BotIcon, MoonIcon, SunIcon, TextScaleIcon, SortIcon, HamburgerIcon, CloseIcon, CalendarIcon } from './pixel-icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="font-mono text-[10px] font-bold tracking-widest uppercase rounded-none px-2 py-1">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] border border-black/15 dark:border-white/10 w-full">
      <SearchIcon size={13} className="text-foreground/30 dark:text-[#FFF200] pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a nugget..."
        className="w-full bg-transparent font-mono text-[14px] font-bold focus:outline-none placeholder:text-neutral-400 tracking-wider py-0.5 text-foreground"
      />
    </div>
  )
}

function HeaderSearch() {
  return (
    <Suspense fallback={
      <div className="flex-1 px-4 flex items-center gap-2">
        <span className="text-neutral-400 shrink-0 text-sm">🔍</span>
        <span className="font-mono text-[14px] text-neutral-400 tracking-wider">Find a nugget...</span>
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
  const digestsHref = tokenPrefix ? `${tokenPrefix}/digests` : '/digests'
  const isHome = pathname === homeHref
  const isStats = pathname === statsHref
  const isDigests = pathname?.startsWith(digestsHref) ?? false
  const { folderCounts } = useVaultStats()
  const activeFolder = (searchParams.get('folder') ?? 'all') as FolderType

  const handleFolderClick = (folder: FolderType) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (folder === 'all' || folder === activeFolder) sp.delete('folder')
    else sp.set('folder', folder)
    const qs = sp.toString()
    router.replace(qs ? `${homeHref}?${qs}` : homeHref)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 bg-card pt-14 overflow-y-auto md:hidden">
      <div className="p-4 space-y-4">
        <div>
          <div className="text-[13px] font-black tracking-widest text-muted-foreground mb-2">// navigation</div>
          <div className="flex flex-col gap-1.5">
            <button onClick={() => { onResurface(); onClose() }} className="pill-btn justify-start"><span>✨</span> random nugget</button>
            <a href={statsHref} onClick={onClose} className={cn('pill-btn justify-start', isStats && 'active')}><span>📈</span> stats</a>
            <a href={digestsHref} onClick={onClose} className={cn('pill-btn justify-start', isDigests && 'active')}><span>📊</span> digests</a>
          </div>
        </div>

        <div className="border-t border-black/10 pt-4">
          <div className="text-[13px] font-black tracking-widest text-muted-foreground mb-2">// folders</div>
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
                  {count > 0 && <span className="text-[13px] font-normal opacity-50">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-black/10 pt-4 flex flex-col gap-1.5">
          <a href="https://t.me/supernuggetss_bot" target="_blank" rel="noopener noreferrer" className="pill-btn justify-start opacity-50 hover:opacity-80" onClick={onClose}>
            <BotIcon size={12} /> open bot
          </a>
          <button onClick={() => { onToggleDarkMode(); onClose() }} className="pill-btn justify-start opacity-50 hover:opacity-80">
            {isDarkMode ? <SunIcon size={12} /> : <MoonIcon size={12} />} {isDarkMode ? 'light mode' : 'dark mode'}
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

// ─── Easter egg ───────────────────────────────────────────────────────────────

const EASTER_EGG_MESSAGES = [
  "hey. close the laptop. go outside. the nuggets will still be here.",
  "you've been staring at this screen long enough. your eyes deserve a break.",
  "touch some grass. seriously. right now. the vault is fine without you.",
  "step away from the screen. drink some water. look at something far away.",
  "okay but have you considered... going for a walk? just a thought.",
]

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

  // ── Easter egg state ──────────────────────────────────────────────────────
  const [showBubble, setShowBubble] = useState(false)
  const [bubbleText, setBubbleText] = useState('')
  const logoClicksRef = useRef(0)
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // User's own saved choice only — never the OS/browser preference.
    const stored = localStorage.getItem('theme')
    setIsDarkMode(stored === 'dark')
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', isDarkMode)
    if (userToggled) localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
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

  // ── Easter egg: logo click counter ───────────────────────────────────────
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    logoClicksRef.current += 1
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current)

    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      setBubbleText(EASTER_EGG_MESSAGES[Math.floor(Math.random() * EASTER_EGG_MESSAGES.length)])
      setShowBubble(true)
      bubbleTimerRef.current = setTimeout(() => setShowBubble(false), 6000)
    } else {
      logoTimerRef.current = setTimeout(() => {
        if (logoClicksRef.current === 1) {
          router.push(token ? `/u/${token}` : '/')
        }
        logoClicksRef.current = 0
      }, 350)
    }
  }


  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background flex items-center min-h-[48px] border-b border-black/10 dark:border-white/8">
        {/* Logo + sidebar toggle */}
        <div
          className={cn(
            'flex items-center shrink-0 transition-all duration-200 border-r border-black/20 dark:border-white/10 self-stretch',
            isSidebarCollapsed
              ? 'md:w-[72px] px-1 gap-1 justify-center'
              : 'md:w-[220px] px-2 gap-1.5'
          )}
          data-egg-exempt
        >
          <button
            onClick={() => setIsSidebarCollapsed(v => !v)}
            className="hidden md:flex p-1 text-muted-foreground/55 hover:text-muted-foreground/85 transition-colors shrink-0"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <HamburgerIcon size={17} /> : <CloseIcon size={13} />}
          </button>
          <a
            href={token ? `/u/${token}` : '/'}
            onClick={handleLogoClick}
            className="font-mono text-base font-black tracking-wider whitespace-nowrap flex items-center gap-1.5"
          >
            <div className="nugget-container relative shrink-0" style={{ width: '38px' }}>
              <img
                src="/nugget-logo-pixel.png"
                alt="Supernuggets"
                className="h-auto w-full nugget-avatar"
                style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }}
              />
              <svg className="pixel-star star-1" style={{ top: '-6px', left: '8px', width: '13px', height: '13px' }} viewBox="0 0 7 7" fill="none" aria-hidden="true">
                <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
              </svg>
              <svg className="pixel-star star-2" style={{ top: '8px', right: '-5px', width: '13px', height: '13px' }} viewBox="0 0 7 7" fill="none" aria-hidden="true">
                <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
              </svg>
              <svg className="pixel-star star-3" style={{ bottom: '-5px', left: '18px', width: '13px', height: '13px' }} viewBox="0 0 7 7" fill="none" aria-hidden="true">
                <path d="M3 0h1v1H3V0zm0 6h1v1H3V6zM0 3h1v1H0V3zm6 0h1v1H6V3zm-2 0h-1v1h1V3zm0-1h-1v1h1V2zm0 2h-1v1h1V4zm1-1h-1v1h1V3zm-3 0h-1v1h1V3z" fill="#000"/>
                <path d="M3 1h1v1H3V1zm0 4h1v1H3V5zM1 3h1v1H1V3zm4 0h1v1H5V3zm-2 0h1v1H3V3zm0-1h1v1H3V2zm0 2h1v1H3V4z" fill="#FAFF00"/>
              </svg>
            </div>
            {!isSidebarCollapsed && <span className="hidden md:inline tracking-tight">supernuggets</span>}
          </a>
        </div>

        {/* Search — flex-1 on mobile, absolutely centred on md+ */}
        <div className="flex-1 px-3 md:flex-none md:absolute md:inset-y-0 md:left-0 md:right-0 md:flex md:items-center md:justify-center md:pointer-events-none">
          <div className="w-full md:pointer-events-auto md:w-full md:max-w-sm">
            <HeaderSearch />
          </div>
        </div>

        {/* Spacer (desktop): pushes buttons to the right edge */}
        <div className="hidden md:flex flex-1" />

        {/* Action buttons */}
        <div className="hidden md:flex items-center gap-1 px-3 relative z-10">
          {([
            { label: 'random',    icon: <RandomIcon size={14} />,    onClick: handleResurface,                                   as: 'button' },
            { label: 'stats',     icon: <StatsIcon size={14} />,     href: token ? `/u/${token}/stats` : '/stats',               as: 'link' },
            { label: 'digests',   icon: <CalendarIcon size={14} />,  href: token ? `/u/${token}/digests` : '/digests',           as: 'link' },
            { label: 'open bot',  icon: <BotIcon size={14} />,       href: 'https://t.me/supernuggetss_bot', external: true,    as: 'a' },
            { label: isDarkMode ? 'light mode' : 'dark mode', icon: isDarkMode ? <SunIcon size={14} /> : <MoonIcon size={14} />, onClick: () => { setUserToggled(true); setIsDarkMode(v => !v) }, as: 'button' },
            { label: 'text scale', icon: <TextScaleIcon size={14} />, as: 'stub' },
            { label: 'sort',      icon: <SortIcon size={14} />,      as: 'stub' },
          ] as const).map((item) => {
            const btnCls = 'p-1.5 flex items-center rounded-[4px] border border-black/15 dark:border-white/10 hover:bg-foreground hover:text-background transition-colors'
            const stubCls = 'p-1.5 flex items-center rounded-[4px] border border-black/8 dark:border-white/6 opacity-25 cursor-not-allowed'
            if (item.as === 'stub') return (
              <Tip key={item.label} label={item.label}>
                <button className={stubCls} disabled>{item.icon}</button>
              </Tip>
            )
            if (item.as === 'link') return (
              <Tip key={item.label} label={item.label}>
                <Link href={(item as { href: string }).href} className={btnCls}>{item.icon}</Link>
              </Tip>
            )
            if (item.as === 'a') return (
              <Tip key={item.label} label={item.label}>
                <a href={(item as { href: string }).href} target="_blank" rel="noopener noreferrer" className={btnCls}>{item.icon}</a>
              </Tip>
            )
            return (
              <Tip key={item.label} label={item.label}>
                <button onClick={(item as { onClick: () => void }).onClick} className={btnCls}>{item.icon}</button>
              </Tip>
            )
          })}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setIsMobileMenuOpen(v => !v)}
          className="md:hidden font-mono text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Sidebar + main */}
      <div className="flex">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
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

      {/* ── Easter egg: speech bubble ── */}
      {showBubble && (
        <div
          className="fixed z-[9000] bg-card border-2 border-foreground p-4 font-mono text-[18px] tracking-wide leading-relaxed"
          style={{
            left: isSidebarCollapsed ? '88px' : '232px',
            top: '8px',
            maxWidth: '380px',
            boxShadow: '4px 4px 0px #000',
          }}
        >
          <div
            className="absolute top-3"
            style={{ left: '-9px', width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '9px solid var(--foreground)' }}
          />
          {bubbleText}
        </div>
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
