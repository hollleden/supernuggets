'use client'

import { forwardRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNugget } from '@/app/actions/nuggets'
import { TrashIcon } from '@/components/vault/pixel-icons'

interface DeleteButtonProps {
  nuggetId: number
  token: string
  className?: string
  variant?: 'default' | 'icon'
}

// Destructive action — confirm then permanently delete via server action + redirect home.
// Matches the bot's [✓ YES DELETE / ✗ CANCEL] verb-noun confirm pattern.
export const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
  function DeleteButton({ nuggetId, token, className, variant = 'default' }, ref) {
    const router = useRouter()
    const [pending, setPending] = useState(false)

    const handleClick = async () => {
      const confirmed = window.confirm(
        'Delete this nugget? Once it\'s gone from the vault, it can\'t come back.'
      )
      if (!confirmed) return
      setPending(true)
      const result = await deleteNugget(token, nuggetId)
      if (!result.ok) {
        setPending(false)
        alert(`deletion failed — ${result.error}`)
        return
      }
      router.push(`/u/${token}`)
      router.refresh()
    }

    if (variant === 'icon') {
      return (
        <button
          ref={ref}
          onClick={handleClick}
          disabled={pending}
          className="h-full px-3 flex items-center justify-center rounded-[4px] border border-black/15 dark:border-white/10 hover:bg-foreground hover:text-background transition-colors text-foreground/40 disabled:opacity-40"
        >
          <TrashIcon size={22} />
        </button>
      )
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
        [ ⌫ {pending ? 'removing…' : 'delete nugget'} ]
      </button>
    )
  }
)
