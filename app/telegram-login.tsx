'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const BOT_ID = '8799818981'
const ORIGIN = 'https://www.supernuggets.app'
const AUTH_URL = 'https://www.supernuggets.app/api/auth/telegram'

function TelegramLoginInner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  function openLogin() {
    const params = new URLSearchParams({
      bot_id: BOT_ID,
      origin: ORIGIN,
      request_access: 'read',
      return_to: AUTH_URL,
      embed: '1',
    })
    const w = 550, h = 470
    const left = Math.round(window.screen.width / 2 - w / 2)
    const top = Math.round(window.screen.height / 2 - h / 2)
    window.open(
      `https://oauth.telegram.org/auth?${params}`,
      'telegram_oauth',
      `width=${w},height=${h},left=${left},top=${top}`
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      <button
        onClick={openLogin}
        className="absolute inset-0 w-full h-full cursor-pointer bg-transparent border-0 p-0"
        aria-label="Log in with Telegram"
      />
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
