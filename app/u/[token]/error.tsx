'use client'

import { useParams } from 'next/navigation'

// Catches any uncaught error inside /u/[token]/* (e.g. a server action rejecting
// without a client-side try/catch) so users see this instead of Vercel's default error page.
export default function VaultError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { token } = useParams<{ token: string }>()

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-destructive">
        [err] something went wrong
      </p>
      <p className="font-mono text-xs text-foreground/60 max-w-sm">
        That action didn&apos;t go through. Nothing was lost — try again.
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 border border-foreground/30 hover:bg-foreground hover:text-background transition-colors"
        >
          [ retry ]
        </button>
        <a
          href={`/u/${token}`}
          className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-1 border border-foreground/30 hover:bg-foreground hover:text-background transition-colors"
        >
          [ back to vault ]
        </a>
      </div>
    </div>
  )
}
