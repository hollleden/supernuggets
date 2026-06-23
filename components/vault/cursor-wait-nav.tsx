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
      const el = e.target as HTMLElement
      const link = el.closest('a[href]')
      const roleLink = el.closest('[role="link"]')
      if (link) {
        const href = link.getAttribute('href')
        if (href?.startsWith('/') && !href.startsWith('//')) {
          document.documentElement.classList.add('cursor-wait')
        }
      } else if (roleLink) {
        document.documentElement.classList.add('cursor-wait')
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
