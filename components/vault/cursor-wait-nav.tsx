'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function CursorWaitOnNav() {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.classList.remove('cursor-wait')
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a[href]')
      if (!link) return
      const href = link.getAttribute('href')
      if (href?.startsWith('/') && !href.startsWith('//')) {
        document.documentElement.classList.add('cursor-wait')
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
