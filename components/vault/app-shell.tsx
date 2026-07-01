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
import { SearchIcon, RandomIcon, StatsIcon, PlaneIcon, BotIcon, MoonIcon, SunIcon, TextScaleIcon, SortIcon, HamburgerIcon, CloseIcon } from './pixel-icons'
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
  const isHome = pathname === homeHref
  const isStats = pathname === statsHref
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

// ─── Deep Fry Easter Egg helpers ─────────────────────────────────────────────

function playSizzle() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const sr = ctx.sampleRate
    const buf = ctx.createBuffer(1, Math.floor(sr * 0.45), sr)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.4) * 0.5
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  } catch {}
}

function spawnParticles(cx: number, cy: number) {
  const colors = ['#FF6B00', '#FF9500', '#FFD700', '#FF4500', '#FF2200']
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div')
    const size = 3 + Math.floor(Math.random() * 5)
    const color = colors[Math.floor(Math.random() * colors.length)]
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * 40
    const dx = Math.cos(angle) * dist
    const dy = Math.sin(angle) * dist - 25
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};pointer-events:none;z-index:9997;image-rendering:pixelated;transition:transform 0.45s ease-out,opacity 0.45s ease-out;`
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      el.style.transform = `translate(${dx}px,${dy}px)`
      el.style.opacity = '0'
    })
    setTimeout(() => el.remove(), 500)
  }
}

const DEEP_FRY_INIT = "Wait, because thank god you found me. I was literally drowning in all these unread links and TikToks. Are we ready to just... completely trash this place? Because I am so ready."
const DEEP_FRY_DIALOGUES = [
  "Wait, because the audacity to save this specific TikTok at 3 AM while crying? Trash it! The satisfaction right now? Literally unmatched.",
  "It's the way we are completely frying your digital clutter right now... Like, we are literally cleaning your brain and nobody can stop us.",
  "But literally, look at this link! You and I both know you were *never* going to look at it again anyway. Let's be so real right now. Let it burn!",
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
  const [deepFryActive, setDeepFryActive] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [dialogIdx, setDialogIdx] = useState(-1)
  const logoClicksRef = useRef(0)
  const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deepFryRef = useRef(false)
  const destroyedRef = useRef(0)

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
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
    if (deepFryRef.current) return
    logoClicksRef.current += 1
    if (logoTimerRef.current) clearTimeout(logoTimerRef.current)
    logoTimerRef.current = setTimeout(() => { logoClicksRef.current = 0 }, 1200)
    if (logoClicksRef.current >= 5) {
      logoClicksRef.current = 0
      playSizzle()
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 100)
      deepFryRef.current = true
      destroyedRef.current = 0
      setDialogIdx(-1)
      setDeepFryActive(true)
    }
  }

  // ── Easter egg: pointerover destruction loop ──────────────────────────────
  useEffect(() => {
    if (!deepFryActive) return
    const onPointer = (e: PointerEvent) => {
      if (!deepFryRef.current) return
      if (destroyedRef.current >= 8) return
      const el = e.target as HTMLElement
      if (!el || el === document.body || el === document.documentElement) return
      if (el.closest('[data-egg-exempt]')) return
      if (el.classList.contains('deep-fried')) return

      el.classList.add('deep-fried')
      const r = el.getBoundingClientRect()
      spawnParticles(r.left + r.width / 2, r.top + r.height / 2)

      destroyedRef.current += 1
      const n = destroyedRef.current

      if (n % 2 === 0) {
        setDialogIdx(Math.floor(Math.random() * 3))
      }

      if (n >= 8) {
        deepFryRef.current = false
        setDeepFryActive(false)
        document.documentElement.style.cursor = ''
        setTimeout(() => setShowModal(true), 300)
      }
    }
    document.addEventListener('pointerover', onPointer)
    return () => document.removeEventListener('pointerover', onPointer)
  }, [deepFryActive])

  const speechText = dialogIdx === -1 ? DEEP_FRY_INIT : DEEP_FRY_DIALOGUES[dialogIdx]

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
                className={cn('h-auto w-full nugget-avatar', deepFryActive && 'logo-shaking')}
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

      {/* ── Easter egg: white flash ── */}
      {showFlash && (
        <div className="fixed inset-0 z-[9998] bg-white pointer-events-none" />
      )}

      {/* ── Easter egg: speech bubble ── */}
      {deepFryActive && (
        <div
          data-egg-exempt
          className="fixed z-[9000] bg-card border-2 border-foreground p-3 font-mono text-[11px] tracking-wide leading-relaxed"
          style={{
            left: isSidebarCollapsed ? '88px' : '232px',
            top: '8px',
            maxWidth: '260px',
            boxShadow: '4px 4px 0px #000',
          }}
        >
          {/* Speech bubble tail */}
          <div
            className="absolute top-3"
            style={{
              left: '-9px',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '9px solid var(--foreground)',
            }}
          />
          {speechText}
        </div>
      )}

      {/* ── Easter egg: exit modal ── */}
      {showModal && (
        <div
          data-egg-exempt
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ animation: 'fadein 0.3s ease forwards' }}
        >
          <div className="absolute inset-0 bg-[#FAF9F6]" />
          <div
            className="relative bg-[#FAF9F6] p-8 max-w-sm w-full mx-4 text-center font-mono border-4 border-black z-10"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            <img
              src="/nugget-logo-pixel.png"
              alt=""
              className="w-12 h-auto mx-auto mb-5"
              style={{ imageRendering: 'pixelated' as React.CSSProperties['imageRendering'] }}
            />
            <p className="text-[12px] font-bold uppercase tracking-wide text-black mb-6 leading-relaxed">
              Okay, wait, because can we just take a second? Look at us. We actually did it, the vault is completely fried. But listen to me, I need you to do something for me right now. Close this laptop. Walk out the door. Go touch some actual, literal grass. I love you, but you need fresh air. Go!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white font-mono font-bold tracking-wide text-[10px] uppercase px-4 py-4 hover:bg-neutral-800 transition-colors"
            >
              OKAY FINE, I'M GOING OUTSIDE RIGHT NOW
            </button>
          </div>
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
