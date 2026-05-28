'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNugget } from '@/app/actions/nuggets'

interface DeleteButtonProps {
  nuggetId: number
  token: string
  className?: string
}

// Destructive action — confirm then permanently delete via server action + redirect home.
// Matches the bot's [✓ YES DELETE / ✗ CANCEL] verb-noun confirm pattern.
export function DeleteButton({ nuggetId, token, className }: DeleteButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    const confirmed = window.confirm(
      '[CONFIRM] ERASE THIS NUGGET FROM THE VAULT?\n\nThis action cannot be undone.'
    )
    if (!confirmed) return
    setPending(true)
    const result = await deleteNugget(token, nuggetId)
    if (!result.ok) {
      setPending(false)
      alert(`[FAIL] DB_DELETE_REJECTED: ${result.error}`)
      return
    }
    router.push(`/u/${token}`)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={
        className ??
        'font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 border border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50'
      }
    >
      [ ⌫ {pending ? 'ERASING…' : 'DELETE'} ]
    </button>
  )
}
