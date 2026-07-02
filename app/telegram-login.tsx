'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const BOT_USERNAME = 'supernuggetss_bot'

function TelegramLoginInner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'small')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-auth-url', 'https://www.supernuggets.app/api/auth/telegram')
    container.appendChild(script)

    return () => {
      if (container.contains(script)) {
        container.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} />

      {error === 'auth_failed' && (
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-destructive">
          [FAIL] AUTH_VERIFICATION_FAILED // TRY AGAIN
        </p>
      )}
      {error === 'no_vault' && (
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-destructive">
          [FAIL] VAULT_NOT_FOUND // SEND /START TO THE BOT FIRST
        </p>
      )}
    </div>
  )
}

export function TelegramLogin() {
  return (
    <Suspense
      fallback={
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          loading login...
        </div>
      }
    >
      <TelegramLoginInner />
    </Suspense>
  )
}
