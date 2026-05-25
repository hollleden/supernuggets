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
export function CopyButton({ text, label = 'COPY', className }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>('idle')

  const handleClick = async () => {
    const ok = await copyText(text)
    setStatus(ok ? 'copied' : 'failed')
    setTimeout(() => setStatus('idle'), 1400)
  }

  const display =
    status === 'copied' ? 'COPIED'
    : status === 'failed' ? 'FAILED'
    : label

  return (
    <button
      onClick={handleClick}
      className={cn(
        'font-mono text-[10px] font-bold uppercase tracking-widest transition-colors',
        status === 'failed' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      [ {display} ]
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
