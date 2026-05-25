'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { pickRandomNuggetId } from '@/app/actions/nuggets'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

// Top-level app chrome. Wraps every page with the sidebar (desktop) + bottom
// nav (mobile) + dark-mode toggle. Owns no data-fetching responsibility.
export function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  // Tracks whether the initial DOM read has completed. Guards the class-sync
  // effect so it doesn't strip the pre-paint '.dark' class before we've read it.
  const [mounted, setMounted] = useState(false)

  // Step 1 — read what the pre-paint script in layout.tsx already applied.
  // Must run before Step 2 writes anything back to the DOM.
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  // Step 2 — keep DOM in sync with state. Skipped on first render (mounted=false)
  // so we never accidentally remove a dark class that the pre-paint script added.
  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode, mounted])

  // Auto-collapse on narrow viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarCollapsed(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleResurface = async () => {
    const id = await pickRandomNuggetId()
    if (id != null) router.push(`/n/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onResurface={handleResurface}
        isResurfaceActive={false}
      />

      <main
        className={cn(
          'min-h-screen flex flex-col transition-all duration-300 pb-16 md:pb-0',
          isSidebarCollapsed ? 'md:ml-[52px]' : 'md:ml-[180px]'
        )}
      >
        {children}
      </main>

      <BottomNav
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onResurface={handleResurface}
      />
    </div>
  )
}
