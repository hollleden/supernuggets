'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

type Status = 'idle' | 'copied' | 'failed'

// Clipboard-copy island with textarea fallback for non-secure contexts /
// older browsers / focus-failure. Always shows visible feedback (never silent).
export function CopyButton({ text, label = 'copy', className }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>('idle')

  const handleClick = async () => {
    const ok = await copyText(text)
    setStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 1400)
  }

  return (
    <button
      onClick={handleClick}
      title={status === 'copied' ? 'Copied to clipboard!' : status === 'failed' ? 'Failed' : label}
      className={cn(
        'transition-colors p-1',
        status === 'copied' ? 'text-emerald-500'
        : status === 'failed' ? 'text-destructive'
        : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {status === 'copied' ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </>
        )}
      </svg>
    </button>
  )
}

async function copyText(text: string): Promise<boolean> {
  // Modern API — works on https, localhost, when the document has focus
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through
    }
  }
  // Fallback — hidden textarea + execCommand. Deprecated but still widely supported.
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
    console.error('CopyButton fallback failed:', err)
    return false
  }
}
