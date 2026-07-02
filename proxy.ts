import { NextRequest, NextResponse } from 'next/server'

/**
 * When a user opens their magic-URL vault (`/u/<token>/...`), mirror the token
 * into a long-lived httpOnly cookie. This lets the landing page recognise a
 * returning visitor and offer a one-click "Open my vault" instead of making
 * them re-fetch the link from the bot every time.
 *
 * The token is already the URL secret (RLS scopes all data by user_id), so
 * storing it in an httpOnly cookie is no less safe than a browser bookmark.
 */
const VAULT_RE = /^\/u\/([^/]+)/

export function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const match = req.nextUrl.pathname.match(VAULT_RE)
  if (match) {
    res.cookies.set('sn_vault_token', match[1], {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
  }
  return res
}

export const config = {
  matcher: ['/u/:path*'],
}
