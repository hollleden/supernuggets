'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'copied' | 'failed'

// Copies the current page URL. Same clipboard-with-fallback strategy as CopyButton.
export function ShareDigestButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>('idle')

  const handleClick = async () => {
    const ok = await copyText(window.location.href)
    setStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 1400)
  }

  const label = status === 'copied' ? 'copied!' : status === 'failed' ? 'failed' : 'share'

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border border-black/20 rounded-full transition-colors',
        status === 'copied' ? 'text-emerald-600 border-emerald-500/40' : 'hover:bg-foreground hover:text-background',
        className
      )}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {status === 'copied' ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </>
        )}
      </svg>
      {label}
    </button>
  )
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through
    }
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch (err) {
    console.error('ShareDigestButton fallback failed:', err)
    return false
  }
}
