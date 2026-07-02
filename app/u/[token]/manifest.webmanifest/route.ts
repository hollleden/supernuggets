import { NextResponse } from 'next/server'

// Per-user manifest so "Add to Home Screen" from inside a vault (/u/[token]/...)
// launches back into that vault instead of the bare marketing root. iOS 16.4+
// honors the linked manifest's start_url/scope over the current page URL, so a
// single global manifest.ts start_url can't be personalized — this route-scoped
// manifest (linked only within app/u/[token]/layout.tsx) fixes that per user.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const scope = `/u/${token}`

  return NextResponse.json(
    {
      name: 'supernuggets',
      short_name: 'supernuggets',
      description: 'A clean, fast pocket vault for everything worth keeping.',
      start_url: scope,
      scope,
      display: 'standalone',
      background_color: '#FAFF00',
      theme_color: '#FAFF00',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  )
}
